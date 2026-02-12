<?php

namespace App\Services;

use App\Models\Customer;
use App\Exceptions\BusinessRuleException;
use Illuminate\Support\Facades\DB;

class CustomerService extends BaseService
{
    /**
     * List customers with filtering and pagination
     */
    public function list(array $filters = [], int $perPage = 15)
    {
        $query = Customer::query()->with(['salesOrders', 'formulas']);

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('customer_code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if (!empty($filters['customer_type'])) {
            $query->where('customer_type', $filters['customer_type']);
        }

        // Filter by status
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['credit_blocked'])) {
            $query->where('credit_blocked', $filters['credit_blocked']);
        }

        // Filter credit customers
        if (!empty($filters['credit_only'])) {
            $query->creditCustomers();
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDir = $filters['sort_dir'] ?? 'asc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Find a customer by ID
     */
    public function find(int $id)
    {
        return Customer::with(['salesOrders', 'formulas'])->findOrFail($id);
    }

    /**
     * Create a new customer
     */
    public function create(array $data)
    {
        $this->hasPermission('customers.create');

        return $this->transaction(function () use ($data) {
            // Generate customer code
            $data['customer_code'] = $this->generateReference('CUST');

            // Validate credit settings
            if (in_array($data['customer_type'] ?? 'cash', ['credit', 'both'])) {
                $data['credit_limit'] = $data['credit_limit'] ?? 0;
                $data['payment_terms_days'] = $data['payment_terms_days'] ?? 0;
            } else {
                $data['credit_limit'] = 0;
                $data['payment_terms_days'] = 0;
            }

            $data['outstanding_balance'] = 0;
            $data['total_purchases'] = 0;
            $data['credit_blocked'] = false;
            $data['is_active'] = $data['is_active'] ?? true;

            $customer = Customer::create($data);

            return $customer->fresh();
        });
    }

    /**
     * Update a customer
     */
    public function update(int $id, array $data)
    {
        $this->hasPermission('customers.update');

        return $this->transaction(function () use ($id, $data) {
            $customer = Customer::findOrFail($id);

            // If changing from credit to cash, check outstanding balance
            if (isset($data['customer_type']) && $data['customer_type'] === 'cash') {
                if ($customer->outstanding_balance > 0) {
                    throw new BusinessRuleException(
                        'Cannot change to cash-only customer with outstanding balance of ' . 
                        number_format($customer->outstanding_balance, 2)
                    );
                }
                $data['credit_limit'] = 0;
                $data['payment_terms_days'] = 0;
            }

            $customer->update($data);

            return $customer->fresh();
        });
    }

    /**
     * Delete a customer
     */
    public function delete(int $id, string $reason)
    {
        $this->hasPermission('customers.delete');

        return $this->transaction(function () use ($id, $reason) {
            $customer = Customer::findOrFail($id);

            // Check if customer has outstanding balance
            if ($customer->outstanding_balance > 0) {
                throw new BusinessRuleException(
                    'Cannot delete customer with outstanding balance of ' . 
                    number_format($customer->outstanding_balance, 2)
                );
            }

            // Check if customer has pending orders
            if ($customer->salesOrders()->whereIn('status', ['draft', 'pending', 'approved'])->exists()) {
                throw new BusinessRuleException('Cannot delete customer with pending sales orders');
            }

            $customer->setAuditReason($reason);
            $customer->delete();

            return true;
        });
    }

    /**
     * Update credit facility for a customer
     */
    public function updateCreditFacility(int $id, array $data, string $reason)
    {
        $this->hasPermission('customers.manage_credit');

        return $this->transaction(function () use ($id, $data, $reason) {
            $customer = Customer::findOrFail($id);

            if ($customer->customer_type === 'cash') {
                throw new BusinessRuleException('Cannot set credit facility for cash-only customer');
            }

            $oldLimit = $customer->credit_limit;
            $newLimit = $data['credit_limit'];

            // Check if reducing limit below outstanding balance
            if ($newLimit < $customer->outstanding_balance) {
                throw new BusinessRuleException(
                    'Cannot reduce credit limit below outstanding balance of ' . 
                    number_format($customer->outstanding_balance, 2)
                );
            }

            $customer->setAuditReason($reason);
            $customer->update([
                'credit_limit' => $newLimit,
                'payment_terms_days' => $data['payment_terms_days'] ?? $customer->payment_terms_days,
            ]);

            return $customer->fresh();
        });
    }

    /**
     * Block or unblock credit for a customer
     */
    public function toggleCreditBlock(int $id, bool $block, string $reason)
    {
        $this->hasPermission('customers.manage_credit');

        return $this->transaction(function () use ($id, $block, $reason) {
            $customer = Customer::findOrFail($id);

            if ($customer->customer_type === 'cash') {
                throw new BusinessRuleException('Cannot block credit for cash-only customer');
            }

            $customer->setAuditReason($reason);
            $customer->update(['credit_blocked' => $block]);

            return $customer->fresh();
        });
    }

    /**
     * Check if customer can make a credit purchase
     */
    public function canMakeCreditPurchase(int $customerId, float $amount): array
    {
        $customer = Customer::findOrFail($customerId);

        if (!$customer->isCreditAllowed()) {
            return [
                'allowed' => false,
                'reason' => $customer->credit_blocked 
                    ? 'Credit facility is blocked' 
                    : 'Customer is not set up for credit purchases',
            ];
        }

        if (!$customer->hasAvailableCredit($amount)) {
            return [
                'allowed' => false,
                'reason' => 'Insufficient credit limit. Available: ' . 
                    number_format($customer->getAvailableCredit(), 2) . 
                    ', Required: ' . number_format($amount, 2),
            ];
        }

        return [
            'allowed' => true,
            'available_credit' => $customer->getAvailableCredit(),
        ];
    }

    /**
     * Get customer credit summary
     */
    public function getCreditSummary(int $id)
    {
        $customer = Customer::with(['salesOrders' => function ($q) {
            $q->where('payment_type', 'credit')
              ->whereIn('status', ['approved', 'processing', 'shipped', 'delivered']);
        }])->findOrFail($id);

        $pendingOrders = $customer->salesOrders()
            ->where('payment_type', 'credit')
            ->whereIn('status', ['draft', 'pending'])
            ->sum('total_amount');

        return [
            'customer' => $customer,
            'credit_limit' => $customer->credit_limit,
            'outstanding_balance' => $customer->outstanding_balance,
            'available_credit' => $customer->getAvailableCredit(),
            'credit_usage_percentage' => $customer->getCreditUsagePercentage(),
            'pending_orders_total' => $pendingOrders,
            'payment_terms_days' => $customer->payment_terms_days,
            'is_blocked' => $customer->credit_blocked,
        ];
    }

    /**
     * Get customers with credit alerts
     */
    public function getCreditAlerts()
    {
        return Customer::creditCustomers()
            ->where('is_active', true)
            ->where(function ($q) {
                // Credit usage >= 90%
                $q->whereRaw('(outstanding_balance / NULLIF(credit_limit, 0)) >= 0.90')
                  // OR credit blocked
                  ->orWhere('credit_blocked', true);
            })
            ->orderByRaw('(outstanding_balance / NULLIF(credit_limit, 0)) DESC')
            ->get()
            ->map(function ($customer) {
                return [
                    'customer' => $customer,
                    'alert_type' => $customer->credit_blocked 
                        ? 'blocked' 
                        : ($customer->getCreditUsagePercentage() >= 90 ? 'near_limit' : 'warning'),
                    'credit_usage_percentage' => $customer->getCreditUsagePercentage(),
                    'available_credit' => $customer->getAvailableCredit(),
                ];
            });
    }
}
