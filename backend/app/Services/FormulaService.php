<?php

namespace App\Services;

use App\Models\Formula;
use App\Models\FormulaItem;
use App\Exceptions\BusinessRuleException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FormulaService extends BaseService
{
    /**
     * List formulas with filtering and pagination
     */
    public function list(array $filters = [], int $perPage = 15)
    {
        $query = Formula::query()->with(['items.product', 'customer', 'creator']);

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('formula_code', 'like', "%{$search}%");
            });
        }

        // Filter by customer
        if (isset($filters['customer_id'])) {
            if ($filters['customer_id'] === 'general') {
                $query->general();
            } else {
                $query->where('customer_id', $filters['customer_id']);
            }
        }

        // Filter by active status
        if (isset($filters['is_active'])) {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDir = $filters['sort_dir'] ?? 'asc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Find a formula by ID
     */
    public function find(int $id)
    {
        return Formula::with(['items.product', 'customer', 'creator'])->findOrFail($id);
    }

    /**
     * Get formulas available for a customer
     */
    public function getAvailableForCustomer(int $customerId)
    {
        return Formula::active()
            ->forCustomer($customerId)
            ->with(['items.product'])
            ->get();
    }

    /**
     * Create a new formula
     */
    public function create(array $data)
    {
        $this->hasPermission('sales.manage_formulas');

        return $this->transaction(function () use ($data) {
            // Validate items
            if (empty($data['items'])) {
                throw new BusinessRuleException('Formula must have at least one item');
            }

            // Validate percentages total 100%
            $totalPercentage = collect($data['items'])->sum('percentage');
            if (abs($totalPercentage - 100) > 0.01) {
                throw new BusinessRuleException(
                    "Formula percentages must total 100%. Current total: {$totalPercentage}%"
                );
            }

            // Generate formula code
            $data['formula_code'] = $this->generateReference('FRM', 'formulas', 'formula_code');
            $data['created_by'] = Auth::id();
            $data['usage_count'] = 0;

            // Create formula
            $formula = Formula::create([
                'formula_code' => $data['formula_code'],
                'name' => $data['name'],
                'customer_id' => $data['customer_id'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'created_by' => $data['created_by'],
            ]);

            // Create formula items
            foreach ($data['items'] as $index => $item) {
                FormulaItem::create([
                    'formula_id' => $formula->id,
                    'product_id' => $item['product_id'],
                    'percentage' => $item['percentage'],
                    'sequence' => $index + 1,
                ]);
            }

            return $formula->fresh(['items.product', 'customer']);
        });
    }

    /**
     * Update a formula
     */
    public function update(int $id, array $data)
    {
        $this->hasPermission('sales.manage_formulas');

        return $this->transaction(function () use ($id, $data) {
            $formula = Formula::findOrFail($id);

            // Update basic info
            $formula->update([
                'name' => $data['name'] ?? $formula->name,
                'customer_id' => $data['customer_id'] ?? $formula->customer_id,
                'description' => $data['description'] ?? $formula->description,
                'is_active' => $data['is_active'] ?? $formula->is_active,
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Validate percentages
                $totalPercentage = collect($data['items'])->sum('percentage');
                if (abs($totalPercentage - 100) > 0.01) {
                    throw new BusinessRuleException(
                        "Formula percentages must total 100%. Current total: {$totalPercentage}%"
                    );
                }

                // Delete old items
                $formula->items()->delete();

                // Create new items
                foreach ($data['items'] as $index => $item) {
                    FormulaItem::create([
                        'formula_id' => $formula->id,
                        'product_id' => $item['product_id'],
                        'percentage' => $item['percentage'],
                        'sequence' => $index + 1,
                    ]);
                }
            }

            return $formula->fresh(['items.product', 'customer']);
        });
    }

    /**
     * Delete a formula
     */
    public function delete(int $id, string $reason)
    {
        $this->hasPermission('sales.manage_formulas');

        return $this->transaction(function () use ($id, $reason) {
            $formula = Formula::findOrFail($id);

            // Check if formula is in use
            if ($formula->salesOrders()->whereIn('status', ['draft', 'pending', 'approved', 'processing'])->exists()) {
                throw new BusinessRuleException('Cannot delete formula that is in use by active sales orders');
            }

            $formula->setAuditReason($reason);
            $formula->delete();

            return true;
        });
    }

    /**
     * Calculate requirements for a formula
     */
    public function calculateRequirements(int $formulaId, float $totalQuantity)
    {
        $formula = $this->find($formulaId);

        if (!$formula->isValid()) {
            throw new BusinessRuleException('Formula percentages do not total 100%');
        }

        return $formula->calculateRequirements($totalQuantity);
    }

    /**
     * Mark formula as used
     */
    public function markAsUsed(int $formulaId)
    {
        $formula = Formula::findOrFail($formulaId);
        $formula->increment('usage_count');
        $formula->update(['last_used_at' => now()]);
    }

    /**
     * Activate or deactivate a formula
     */
    public function toggleActive(int $id, bool $active, string $reason)
    {
        $this->hasPermission('sales.manage_formulas');

        return $this->transaction(function () use ($id, $active, $reason) {
            $formula = Formula::findOrFail($id);
            $formula->setAuditReason($reason);
            $formula->update(['is_active' => $active]);

            return $formula->fresh();
        });
    }

    /**
     * Clone a formula
     */
    public function clone(int $id, array $overrides = [])
    {
        $this->hasPermission('sales.manage_formulas');

        return $this->transaction(function () use ($id, $overrides) {
            $original = $this->find($id);

            $data = [
                'name' => $overrides['name'] ?? ($original->name . ' (Copy)'),
                'customer_id' => $overrides['customer_id'] ?? $original->customer_id,
                'description' => $overrides['description'] ?? $original->description,
                'is_active' => $overrides['is_active'] ?? true,
                'items' => $original->items->map(function ($item) {
                    return [
                        'product_id' => $item->product_id,
                        'percentage' => $item->percentage,
                    ];
                })->toArray(),
            ];

            return $this->create($data);
        });
    }
}
