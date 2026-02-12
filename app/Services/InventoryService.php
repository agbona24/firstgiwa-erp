<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Exceptions\InsufficientStockException;
use App\Models\Inventory;
use App\Models\InventoryAdjustment;
use App\Models\InventoryBatch;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InventoryService extends BaseService
{
    /**
     * Get inventory list with filters.
     */
    public function listInventory(array $filters = []): LengthAwarePaginator
    {
        $query = Inventory::with(['product.category', 'warehouse'])
            ->join('products', 'inventory.product_id', '=', 'products.id')
            ->select('inventory.*');

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('products.name', 'like', "%{$search}%")
                    ->orWhere('products.sku', 'like', "%{$search}%");
            });
        }

        // Filter by warehouse
        if (!empty($filters['warehouse_id'])) {
            $query->where('inventory.warehouse_id', $filters['warehouse_id']);
        }

        // Filter by category
        if (!empty($filters['category_id'])) {
            $query->where('products.category_id', $filters['category_id']);
        }

        // Filter by inventory type
        if (!empty($filters['inventory_type'])) {
            $query->where('products.inventory_type', $filters['inventory_type']);
        }

        // Filter by stock status
        if (!empty($filters['status'])) {
            match ($filters['status']) {
                'low_stock' => $query->whereRaw('inventory.quantity <= products.reorder_level AND inventory.quantity > products.critical_level'),
                'critical' => $query->whereRaw('inventory.quantity <= products.critical_level'),
                'out_of_stock' => $query->where('inventory.quantity', '<=', 0),
                'in_stock' => $query->where('inventory.quantity', '>', 0),
                default => null,
            };
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'products.name';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min($filters['per_page'] ?? config('erp.pagination.default'), config('erp.pagination.max'));

        return $query->paginate($perPage);
    }

    /**
     * Get stock level for a product in a warehouse.
     */
    public function getStockLevel(int $productId, int $warehouseId): ?Inventory
    {
        return Inventory::where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->first();
    }

    /**
     * Get total stock for a product across all warehouses.
     */
    public function getTotalStock(int $productId): float
    {
        return Inventory::where('product_id', $productId)->sum('quantity');
    }

    /**
     * Get available stock (quantity - reserved) for a product.
     */
    public function getAvailableStock(int $productId, ?int $warehouseId = null): float
    {
        $query = Inventory::where('product_id', $productId);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return $query->get()->sum('available_quantity');
    }

    /**
     * Add stock to inventory.
     */
    public function addStock(
        int $productId,
        int $warehouseId,
        float $quantity,
        float $unitCost,
        string $movementType,
        ?string $reason = null,
        ?object $reference = null,
        ?int $batchId = null
    ): StockMovement {
        return $this->transaction(function () use (
            $productId, $warehouseId, $quantity, $unitCost, $movementType, $reason, $reference, $batchId
        ) {
            $this->assertPositive($quantity, 'Quantity');

            // Get or create inventory record
            $inventory = $this->getOrCreateInventory($productId, $warehouseId);
            $quantityBefore = $inventory->quantity;

            // Update inventory quantity
            $inventory->quantity += $quantity;
            $inventory->last_adjusted_by = $this->userId();
            $inventory->last_stock_take = now();
            $inventory->save();

            // Create stock movement
            return $this->createStockMovement(
                productId: $productId,
                warehouseId: $warehouseId,
                batchId: $batchId,
                movementType: $movementType,
                quantity: $quantity,
                unitCost: $unitCost,
                quantityBefore: $quantityBefore,
                quantityAfter: $inventory->quantity,
                reason: $reason,
                reference: $reference
            );
        });
    }

    /**
     * Deduct stock from inventory.
     */
    public function deductStock(
        int $productId,
        int $warehouseId,
        float $quantity,
        string $movementType,
        ?string $reason = null,
        ?object $reference = null,
        ?int $batchId = null,
        bool $allowNegative = false
    ): StockMovement {
        return $this->transaction(function () use (
            $productId, $warehouseId, $quantity, $movementType, $reason, $reference, $batchId, $allowNegative
        ) {
            $this->assertPositive($quantity, 'Quantity');

            $inventory = $this->getStockLevel($productId, $warehouseId);
            $product = Product::find($productId);

            if (!$inventory) {
                if ($quantityChange > 0) {
                    $inventory = $this->getOrCreateInventory($productId, $warehouseId);
                } else {
                    throw new BusinessRuleException("No inventory record exists for this product in the specified warehouse.");
                }
            }

            // Check available stock
            if (!$allowNegative && $inventory->available_quantity < $quantity) {
                throw new InsufficientStockException(
                    $product->name,
                    $quantity,
                    $inventory->available_quantity,
                    $inventory->warehouse->name ?? null
                );
            }

            $quantityBefore = $inventory->quantity;

            // Update inventory quantity
            $inventory->quantity -= $quantity;
            $inventory->last_adjusted_by = $this->userId();
            $inventory->last_stock_take = now();
            $inventory->save();

            // Update batch if specified
            if ($batchId) {
                $batch = InventoryBatch::find($batchId);
                if ($batch) {
                    $batch->deductQuantity($quantity);
                }
            }

            // Create stock movement
            return $this->createStockMovement(
                productId: $productId,
                warehouseId: $warehouseId,
                batchId: $batchId,
                movementType: $movementType,
                quantity: $quantity,
                unitCost: $product->cost_price,
                quantityBefore: $quantityBefore,
                quantityAfter: $inventory->quantity,
                reason: $reason,
                reference: $reference
            );
        });
    }

    /**
     * Transfer stock between warehouses.
     */
    public function transferStock(
        int $productId,
        int $fromWarehouseId,
        int $toWarehouseId,
        float $quantity,
        ?string $reason = null,
        ?int $batchId = null
    ): array {
        return $this->transaction(function () use (
            $productId, $fromWarehouseId, $toWarehouseId, $quantity, $reason, $batchId
        ) {
            $this->assertPositive($quantity, 'Quantity');

            if ($fromWarehouseId === $toWarehouseId) {
                throw new BusinessRuleException("Cannot transfer stock to the same warehouse.");
            }

            $product = Product::find($productId);

            // Deduct from source warehouse
            $outMovement = $this->deductStock(
                productId: $productId,
                warehouseId: $fromWarehouseId,
                quantity: $quantity,
                movementType: StockMovement::TYPE_TRANSFER_OUT,
                reason: $reason,
                batchId: $batchId
            );

            // Update the out movement with warehouse info
            $outMovement->from_warehouse_id = $fromWarehouseId;
            $outMovement->to_warehouse_id = $toWarehouseId;
            $outMovement->save();

            // Add to destination warehouse
            $inMovement = $this->addStock(
                productId: $productId,
                warehouseId: $toWarehouseId,
                quantity: $quantity,
                unitCost: $product->cost_price,
                movementType: StockMovement::TYPE_TRANSFER_IN,
                reason: $reason,
                batchId: $batchId
            );

            // Update the in movement with warehouse info
            $inMovement->from_warehouse_id = $fromWarehouseId;
            $inMovement->to_warehouse_id = $toWarehouseId;
            $inMovement->save();

            return [
                'out' => $outMovement,
                'in' => $inMovement,
            ];
        });
    }

    /**
     * Create inventory adjustment.
     */
    public function createAdjustment(
        int $productId,
        int $warehouseId,
        string $adjustmentType,
        float $quantityChange,
        string $reason,
        ?int $batchId = null
    ): InventoryAdjustment {
        return $this->transaction(function () use (
            $productId, $warehouseId, $adjustmentType, $quantityChange, $reason, $batchId
        ) {
            $inventory = $this->getStockLevel($productId, $warehouseId);
            $product = Product::find($productId);

            if (!$inventory) {
                throw new BusinessRuleException("No inventory record exists for this product in the specified warehouse.");
            }

            // For negative adjustments, check stock availability
            if ($quantityChange < 0 && $inventory->quantity < abs($quantityChange)) {
                throw new InsufficientStockException(
                    $product->name,
                    abs($quantityChange),
                    $inventory->quantity
                );
            }

            $adjustment = InventoryAdjustment::create([
                'adjustment_number' => $this->generateReference('ADJ', 'inventory_adjustments', 'adjustment_number'),
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'batch_id' => $batchId,
                'adjustment_type' => $adjustmentType,
                'quantity_change' => $quantityChange,
                'quantity_before' => $inventory->quantity,
                'quantity_after' => $inventory->quantity + $quantityChange,
                'unit_cost' => $product->cost_price,
                'total_value_impact' => abs($quantityChange) * $product->cost_price,
                'reason' => $reason,
                'status' => InventoryAdjustment::STATUS_DRAFT,
                'created_by' => $this->userId(),
            ]);

            // Check if approval is required
            if ($adjustment->requiresApproval()) {
                $adjustment->submitForApproval();
            } else {
                // Auto-approve small adjustments
                $this->applyAdjustment($adjustment);
            }

            return $adjustment->fresh(['product', 'warehouse', 'createdBy']);
        });
    }

    /**
     * Approve an inventory adjustment.
     */
    public function approveAdjustment(InventoryAdjustment $adjustment, ?string $notes = null): InventoryAdjustment
    {
        return $this->transaction(function () use ($adjustment, $notes) {
            if ($adjustment->status !== InventoryAdjustment::STATUS_PENDING) {
                throw new BusinessRuleException("Only pending adjustments can be approved.");
            }

            // Check role separation
            if (!$this->canApprove($adjustment, 'created_by')) {
                throw new \App\Exceptions\RoleSeparationException(
                    "You cannot approve your own adjustment.",
                    'creator_cannot_approve'
                );
            }

            // Approve the adjustment
            $adjustment->approve($this->userId(), $notes);

            // Apply the adjustment to inventory
            $this->applyAdjustment($adjustment);

            return $adjustment->fresh(['product', 'warehouse', 'createdBy', 'approvedBy']);
        });
    }

    /**
     * Reject an inventory adjustment.
     */
    public function rejectAdjustment(InventoryAdjustment $adjustment, ?string $notes = null): InventoryAdjustment
    {
        if ($adjustment->status !== InventoryAdjustment::STATUS_PENDING) {
            throw new BusinessRuleException("Only pending adjustments can be rejected.");
        }

        $adjustment->reject($this->userId(), $notes);

        return $adjustment->fresh(['product', 'warehouse', 'createdBy', 'approvedBy']);
    }

    /**
     * Apply an approved adjustment to inventory.
     */
    protected function applyAdjustment(InventoryAdjustment $adjustment): void
    {
        $movementType = $adjustment->isIncrease()
            ? StockMovement::TYPE_ADJUSTMENT_IN
            : StockMovement::TYPE_ADJUSTMENT_OUT;

        if ($adjustment->isIncrease()) {
            $this->addStock(
                productId: $adjustment->product_id,
                warehouseId: $adjustment->warehouse_id,
                quantity: abs($adjustment->quantity_change),
                unitCost: $adjustment->unit_cost,
                movementType: $movementType,
                reason: $adjustment->reason,
                batchId: $adjustment->batch_id
            );
        } else {
            $this->deductStock(
                productId: $adjustment->product_id,
                warehouseId: $adjustment->warehouse_id,
                quantity: abs($adjustment->quantity_change),
                movementType: $movementType,
                reason: $adjustment->reason,
                batchId: $adjustment->batch_id,
                allowNegative: true // Already validated
            );
        }

        if ($adjustment->status === InventoryAdjustment::STATUS_DRAFT) {
            $adjustment->status = InventoryAdjustment::STATUS_APPROVED;
            $adjustment->approved_by = $this->userId();
            $adjustment->approved_at = now();
            $adjustment->save();
        }
    }

    /**
     * Create a new inventory batch.
     */
    public function createBatch(
        int $productId,
        int $warehouseId,
        float $quantity,
        float $unitCost,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $productionDate = null,
        ?string $expiryDate = null
    ): InventoryBatch {
        return $this->transaction(function () use (
            $productId, $warehouseId, $quantity, $unitCost, $sourceType, $sourceId, $productionDate, $expiryDate
        ) {
            $batch = InventoryBatch::create([
                'batch_number' => $this->generateReference('BAT', 'inventory_batches', 'batch_number'),
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'production_date' => $productionDate,
                'expiry_date' => $expiryDate,
                'initial_quantity' => $quantity,
                'current_quantity' => $quantity,
                'unit_cost' => $unitCost,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'status' => InventoryBatch::STATUS_ACTIVE,
                'created_by' => $this->userId(),
            ]);

            return $batch;
        });
    }

    /**
     * Get stock movements for a product.
     */
    public function getStockMovements(int $productId, array $filters = []): LengthAwarePaginator
    {
        $query = StockMovement::with(['warehouse', 'batch', 'createdBy'])
            ->where('product_id', $productId);

        if (!empty($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }

        if (!empty($filters['movement_type'])) {
            $query->where('movement_type', $filters['movement_type']);
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->dateRange($filters['start_date'], $filters['end_date']);
        }

        $query->orderBy('created_at', 'desc');

        $perPage = min($filters['per_page'] ?? config('erp.pagination.default'), config('erp.pagination.max'));

        return $query->paginate($perPage);
    }

    /**
     * Get low stock products.
     */
    public function getLowStockProducts(): Collection
    {
        return Inventory::with(['product', 'warehouse'])
            ->join('products', 'inventory.product_id', '=', 'products.id')
            ->whereRaw('inventory.quantity <= products.reorder_level')
            ->whereRaw('inventory.quantity > products.critical_level')
            ->select('inventory.*')
            ->get();
    }

    /**
     * Get critical stock products.
     */
    public function getCriticalStockProducts(): Collection
    {
        return Inventory::with(['product', 'warehouse'])
            ->join('products', 'inventory.product_id', '=', 'products.id')
            ->whereRaw('inventory.quantity <= products.critical_level')
            ->select('inventory.*')
            ->get();
    }

    /**
     * Get or create inventory record.
     */
    protected function getOrCreateInventory(int $productId, int $warehouseId): Inventory
    {
        return Inventory::firstOrCreate(
            [
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
            ],
            [
                'quantity' => 0,
                'reserved_quantity' => 0,
            ]
        );
    }

    /**
     * Create a stock movement record.
     */
    protected function createStockMovement(
        int $productId,
        int $warehouseId,
        ?int $batchId,
        string $movementType,
        float $quantity,
        ?float $unitCost,
        float $quantityBefore,
        float $quantityAfter,
        ?string $reason = null,
        ?object $reference = null
    ): StockMovement {
        $movement = StockMovement::create([
            'reference_number' => $this->generateReference('SM', 'stock_movements', 'reference_number'),
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'batch_id' => $batchId,
            'movement_type' => $movementType,
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'total_value' => $unitCost ? $this->roundCurrency($quantity * $unitCost) : null,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'reference_type' => $reference ? get_class($reference) : null,
            'reference_id' => $reference?->id,
            'reason' => $reason,
            'created_by' => $this->userId(),
        ]);

        return $movement;
    }

    /**
     * Reserve stock for an order.
     */
    public function reserveStock(int $productId, int $warehouseId, float $quantity): void
    {
        $inventory = $this->getStockLevel($productId, $warehouseId);

        if (!$inventory) {
            throw new BusinessRuleException("No inventory record exists for this product.");
        }

        if ($inventory->available_quantity < $quantity) {
            $product = Product::find($productId);
            throw new InsufficientStockException(
                $product->name,
                $quantity,
                $inventory->available_quantity
            );
        }

        $inventory->reserved_quantity += $quantity;
        $inventory->save();
    }

    /**
     * Release reserved stock.
     */
    public function releaseReservation(int $productId, int $warehouseId, float $quantity): void
    {
        $inventory = $this->getStockLevel($productId, $warehouseId);

        if ($inventory) {
            $inventory->reserved_quantity = max(0, $inventory->reserved_quantity - $quantity);
            $inventory->save();
        }
    }
}
