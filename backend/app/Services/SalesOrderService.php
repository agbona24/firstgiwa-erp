<?php

namespace App\Services;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Customer;
use App\Models\Formula;
use App\Models\Setting;
use App\Exceptions\BusinessRuleException;
use App\Exceptions\CreditLimitExceededException;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\ApprovalRequiredException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SalesOrderService extends BaseService
{
    protected $customerService;
    protected $formulaService;
    protected $inventoryService;

    public function __construct(
        CustomerService $customerService,
        FormulaService $formulaService,
        InventoryService $inventoryService
    ) {
        $this->customerService = $customerService;
        $this->formulaService = $formulaService;
        $this->inventoryService = $inventoryService;
    }

    /**
     * List sales orders with filtering and pagination
     */
    public function list(array $filters = [], int $perPage = 15)
    {
        $query = SalesOrder::query()
            ->with(['customer', 'formula', 'items.product', 'warehouse', 'creator', 'approver']);

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by fulfillment status
        if (!empty($filters['fulfillment_status'])) {
            $query->where('fulfillment_status', $filters['fulfillment_status']);
        }

        // Filter by payment type
        if (!empty($filters['payment_type'])) {
            $query->where('payment_type', $filters['payment_type']);
        }

        // Filter by customer
        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        // Date range filter
        if (!empty($filters['start_date'])) {
            $query->where('order_date', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->where('order_date', '<=', $filters['end_date']);
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Find a sales order by ID
     */
    public function find(int $id)
    {
        return SalesOrder::with([
            'customer',
            'formula.items.product',
            'items.product',
            'warehouse',
            'creator',
            'approver',
            'payments'
        ])->findOrFail($id);
    }

    /**
     * Create a new sales order
     * 
     * This enforces credit limits and formula-based booking
     */
    public function create(array $data)
    {
        $this->hasPermission('sales.create');

        return $this->transaction(function () use ($data) {
            $customer = Customer::findOrFail($data['customer_id']);
            
            // Validate payment type
            $paymentType = $data['payment_type'] ?? 'cash';
            if ($paymentType === 'credit' && !$customer->isCreditAllowed()) {
                throw new BusinessRuleException(
                    $customer->credit_blocked 
                        ? 'Credit facility is blocked for this customer'
                        : 'Customer is not set up for credit purchases'
                );
            }

            // Process items based on order type
            if (!empty($data['formula_id'])) {
                // Formula-based order
                $items = $this->processFormulaOrder($data);
            } else {
                // Direct order
                $items = $this->processDirectOrder($data);
            }

            // Calculate totals
            $subtotal = collect($items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });
            
            $discountAmount = $data['discount_amount'] ?? 0;
            $taxRate = config('erp.vat_rate', 0.075);
            $taxAmount = ($subtotal - $discountAmount) * $taxRate;
            $totalAmount = $subtotal - $discountAmount + $taxAmount;

            // Credit limit check for credit orders
            if ($paymentType === 'credit') {
                $creditCheck = $this->customerService->canMakeCreditPurchase(
                    $customer->id,
                    $totalAmount
                );
                
                if (!$creditCheck['allowed']) {
                    throw new BusinessRuleException($creditCheck['reason']);
                }
            }

            // Generate order number
            $orderNumber = $this->generateReference('SO', 'sales_orders', 'order_number');

            // Determine initial status based on approval requirements
            $status = $this->determineInitialStatus($totalAmount, $paymentType);

            // Create sales order
            $salesOrder = SalesOrder::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer->id,
                'payment_type' => $paymentType,
                'formula_id' => $data['formula_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'order_date' => $data['order_date'] ?? now(),
                'delivery_date' => $data['delivery_date'] ?? null,
                'status' => $status,
                'fulfillment_status' => 'awaiting',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'credit_available' => $paymentType === 'credit' ? $customer->getAvailableCredit() : null,
                'notes' => $data['notes'] ?? null,
                'delivery_address' => $data['delivery_address'] ?? $customer->address,
                'created_by' => Auth::id(),
            ]);

            // Create order items
            foreach ($items as $index => $item) {
                SalesOrderItem::create([
                    'sales_order_id' => $salesOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_amount' => $item['quantity'] * $item['unit_price'],
                    'sequence' => $index + 1,
                ]);
            }

            // Mark formula as used if applicable
            if (!empty($data['formula_id'])) {
                $this->formulaService->markAsUsed($data['formula_id']);
            }

            // Throw exception if approval required
            if ($status === 'pending' && $this->requiresApproval($totalAmount)) {
                throw new ApprovalRequiredException(
                    "Sales order created but requires approval (threshold: ₦" . 
                    number_format(config('erp.approval_thresholds.sales_order', 1000000), 2) . ")"
                );
            }

            return $salesOrder->fresh(['customer', 'items.product', 'formula']);
        });
    }

    /**
     * Process formula-based order
     */
    protected function processFormulaOrder(array $data): array
    {
        $formula = Formula::with('items.product')->findOrFail($data['formula_id']);

        if (!$formula->is_active) {
            throw new BusinessRuleException('Formula is not active');
        }

        if (!$formula->isValid()) {
            throw new BusinessRuleException('Formula percentages do not total 100%');
        }

        // Check if formula is available for this customer
        if ($formula->customer_id && $formula->customer_id != $data['customer_id']) {
            throw new BusinessRuleException('Formula is not available for this customer');
        }

        if (empty($data['total_quantity'])) {
            throw new BusinessRuleException('Total quantity is required for formula-based orders');
        }

        $requirements = $formula->calculateRequirements($data['total_quantity']);
        $items = [];

        foreach ($requirements as $req) {
            $product = $req['product'];
            
            // Check stock availability
            if (!$this->checkStockAvailability($product->id, $req['quantity'])) {
                throw new InsufficientStockException(
                    $product->name,
                    $req['quantity'],
                    $this->getAvailableStock($product->id)
                );
            }

            $items[] = [
                'product_id' => $product->id,
                'quantity' => $req['quantity'],
                'unit_price' => $product->selling_price,
            ];
        }

        return $items;
    }

    /**
     * Process direct order
     */
    protected function processDirectOrder(array $data): array
    {
        if (empty($data['items'])) {
            throw new BusinessRuleException('Order items are required for direct orders');
        }

        $items = [];

        foreach ($data['items'] as $item) {
            // Check stock availability
            if (!$this->checkStockAvailability($item['product_id'], $item['quantity'])) {
                $product = \App\Models\Product::findOrFail($item['product_id']);
                $available = $this->getAvailableStock($product->id);
                throw new InsufficientStockException(
                    $product->name,
                    $item['quantity'],
                    $available
                );
            }

            $items[] = [
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
            ];
        }

        return $items;
    }

    /**
     * Determine initial status based on approval requirements
     */
    protected function determineInitialStatus(float $totalAmount, string $paymentType): string
    {
        // Check if approval is required from settings
        $requireApproval = Setting::get('approvals', 'sales_order_require_approval', true);
        
        if (!$requireApproval) {
            // Auto-approve all orders if approval is disabled
            return 'approved';
        }
        
        // Check if approval required by amount threshold from database settings
        $threshold = Setting::get('approvals', 'sales_order_threshold', 
            config('erp.approval_thresholds.sales_order', 1000000));
        
        if ($totalAmount >= $threshold) {
            return 'pending'; // Requires approval
        }

        // Auto-approve cash orders below threshold
        if ($paymentType === 'cash') {
            return 'approved';
        }

        // Credit orders below threshold still need approval
        return 'pending';
    }

    /**
     * Check if order requires approval
     */
    protected function requiresApproval(float $totalAmount): bool
    {
        $requireApproval = Setting::get('approvals', 'sales_order_require_approval', true);
        if (!$requireApproval) {
            return false;
        }
        
        $threshold = Setting::get('approvals', 'sales_order_threshold',
            config('erp.approval_thresholds.sales_order', 1000000));
        return $totalAmount >= $threshold;
    }

    /**
     * Approve a sales order
     */
    public function approve(int $id, string $reason = '')
    {
        $this->hasPermission('sales.approve');

        return $this->transaction(function () use ($id, $reason) {
            $salesOrder = SalesOrder::findOrFail($id);

            if ($salesOrder->status !== 'pending') {
                throw new BusinessRuleException('Only pending orders can be approved');
            }

            // Re-verify credit if credit order
            if ($salesOrder->isCreditOrder()) {
                $creditCheck = $this->customerService->canMakeCreditPurchase(
                    $salesOrder->customer_id,
                    $salesOrder->total_amount
                );
                
                if (!$creditCheck['allowed']) {
                    throw new BusinessRuleException($creditCheck['reason']);
                }
            }

            // Re-check stock availability
            foreach ($salesOrder->items as $item) {
                if (!$this->checkStockAvailability($item->product_id, $item->quantity)) {
                    throw new InsufficientStockException(
                        $item->product->name,
                        $item->quantity,
                        $this->getAvailableStock($item->product_id)
                    );
                }
            }

            $salesOrder->setAuditReason($reason ?: 'Sales order approved');
            $salesOrder->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Log custom APPROVE action
            $salesOrder->logCustomAudit('APPROVE', $reason ?: 'Sales order approved', [
                'approved_by' => Auth::user()->name,
                'total_amount' => $salesOrder->total_amount,
            ]);

            return $salesOrder->fresh();
        });
    }

    /**
     * Reject a sales order
     */
    public function reject(int $id, string $reason)
    {
        $this->hasPermission('sales.approve');

        return $this->transaction(function () use ($id, $reason) {
            $salesOrder = SalesOrder::findOrFail($id);

            if ($salesOrder->status !== 'pending') {
                throw new BusinessRuleException('Only pending orders can be rejected');
            }

            $salesOrder->setAuditReason($reason);
            $salesOrder->update([
                'status' => 'cancelled',
                'cancelled_by' => Auth::id(),
                'cancelled_at' => now(),
            ]);

            // Log custom REJECT action
            $salesOrder->logCustomAudit('REJECT', $reason, [
                'rejected_by' => Auth::user()->name,
                'total_amount' => $salesOrder->total_amount,
            ]);

            return $salesOrder->fresh();
        });
    }

    /**
     * Update fulfillment status of a sales order
     */
    public function fulfill(int $id, array $data)
    {
        $this->hasPermission('sales.fulfill');

        return $this->transaction(function () use ($id, $data) {
            $salesOrder = SalesOrder::findOrFail($id);

            // Allow fulfillment for approved or completed orders (POS sales are completed immediately)
            if (!in_array($salesOrder->status, ['approved', 'completed'])) {
                throw new BusinessRuleException('Only approved or completed orders can be fulfilled');
            }

            $validStatuses = ['awaiting', 'processing', 'shipped', 'delivered'];
            $newStatus = $data['fulfillment_status'] ?? null;

            if (!in_array($newStatus, $validStatuses)) {
                throw new BusinessRuleException('Invalid fulfillment status');
            }

            $reason = $data['notes'] ?? "Fulfillment status updated to {$newStatus}";
            $salesOrder->setAuditReason($reason);

            $updateData = [
                'fulfillment_status' => $newStatus,
            ];

            // If delivered, mark order as completed
            if ($newStatus === 'delivered') {
                $updateData['status'] = 'completed';
                $updateData['delivery_date'] = $data['delivery_date'] ?? now();
            }

            // If shipped, record shipping info
            if ($newStatus === 'shipped' && !empty($data['tracking_number'])) {
                $updateData['notes'] = ($salesOrder->notes ? $salesOrder->notes . "\n" : '') . 
                    "Tracking: " . $data['tracking_number'];
            }

            $salesOrder->update($updateData);

            return $salesOrder->fresh(['items', 'customer']);
        });
    }

    /**
     * Helper: Check stock availability
     */
    protected function checkStockAvailability(int $productId, float $quantity): bool
    {
        $availableStock = $this->inventoryService->getAvailableStock($productId);
        return $availableStock >= $quantity;
    }

    /**
     * Helper: Get available stock
     */
    protected function getAvailableStock(int $productId): float
    {
        return $this->inventoryService->getAvailableStock($productId);
    }
}
