<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryAdjustment;
use App\Models\StockMovement;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Get inventory list with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $inventory = $this->inventoryService->listInventory($request->all());

        return response()->json($inventory);
    }

    /**
     * Get stock level for a specific product/warehouse.
     */
    public function show(int $productId, Request $request): JsonResponse
    {
        $warehouseId = $request->query('warehouse_id');

        if ($warehouseId) {
            $inventory = $this->inventoryService->getStockLevel($productId, $warehouseId);
        } else {
            $inventory = Inventory::with(['product', 'warehouse'])
                ->where('product_id', $productId)
                ->get();
        }

        return response()->json($inventory);
    }

    /**
     * Get stock movements for a product.
     */
    public function movements(int $productId, Request $request): JsonResponse
    {
        $movements = $this->inventoryService->getStockMovements($productId, $request->all());

        return response()->json($movements);
    }

    /**
     * Transfer stock between warehouses.
     */
    public function transfer(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'quantity' => 'required|numeric|min:0.001',
            'reason' => 'nullable|string|max:500',
            'batch_id' => 'nullable|exists:inventory_batches,id',
        ]);

        if (!$request->user()->hasPermission('inventory.transfer')) {
            return response()->json(['message' => 'Permission denied.'], 403);
        }

        try {
            $movements = $this->inventoryService->transferStock(
                productId: $request->product_id,
                fromWarehouseId: $request->from_warehouse_id,
                toWarehouseId: $request->to_warehouse_id,
                quantity: $request->quantity,
                reason: $request->reason,
                batchId: $request->batch_id
            );

            return response()->json([
                'message' => 'Stock transferred successfully',
                'movements' => $movements,
            ]);
        } catch (\App\Exceptions\BusinessRuleException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Create inventory adjustment.
     */
    public function adjust(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'adjustment_type' => 'required|in:loss,drying,damage,expiry,count_correction,theft,found,other',
            'quantity_change' => 'required|numeric|not_in:0',
            'reason' => 'required|string|max:500',
            'batch_id' => 'nullable|exists:inventory_batches,id',
        ]);

        if (!$request->user()->hasPermission('inventory.adjust')) {
            return response()->json(['message' => 'Permission denied.'], 403);
        }

        try {
            $adjustment = $this->inventoryService->createAdjustment(
                productId: $request->product_id,
                warehouseId: $request->warehouse_id,
                adjustmentType: $request->adjustment_type,
                quantityChange: $request->quantity_change,
                reason: $request->reason,
                batchId: $request->batch_id
            );

            $message = $adjustment->status === InventoryAdjustment::STATUS_PENDING
                ? 'Adjustment created and submitted for approval'
                : 'Adjustment applied successfully';

            return response()->json([
                'message' => $message,
                'adjustment' => $adjustment,
            ], 201);
        } catch (\App\Exceptions\BusinessRuleException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Get pending adjustments.
     */
    public function pendingAdjustments(Request $request): JsonResponse
    {
        $adjustments = InventoryAdjustment::with(['product', 'warehouse', 'createdBy'])
            ->pendingApproval()
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($adjustments);
    }

    /**
     * Approve an adjustment.
     */
    public function approveAdjustment(int $id, Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('inventory.approve_adjustment')) {
            return response()->json(['message' => 'Permission denied.'], 403);
        }

        $adjustment = InventoryAdjustment::findOrFail($id);

        try {
            $approved = $this->inventoryService->approveAdjustment(
                $adjustment,
                $request->input('notes')
            );

            return response()->json([
                'message' => 'Adjustment approved and applied',
                'adjustment' => $approved,
            ]);
        } catch (\App\Exceptions\BusinessRuleException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\App\Exceptions\RoleSeparationException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }
    }

    /**
     * Reject an adjustment.
     */
    public function rejectAdjustment(int $id, Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('inventory.approve_adjustment')) {
            return response()->json(['message' => 'Permission denied.'], 403);
        }

        $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $adjustment = InventoryAdjustment::findOrFail($id);

        try {
            $rejected = $this->inventoryService->rejectAdjustment(
                $adjustment,
                $request->input('notes')
            );

            return response()->json([
                'message' => 'Adjustment rejected',
                'adjustment' => $rejected,
            ]);
        } catch (\App\Exceptions\BusinessRuleException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Get low stock products.
     */
    public function lowStock(): JsonResponse
    {
        $products = $this->inventoryService->getLowStockProducts();

        return response()->json($products);
    }

    /**
     * Get critical stock products.
     */
    public function criticalStock(): JsonResponse
    {
        $products = $this->inventoryService->getCriticalStockProducts();

        return response()->json($products);
    }

    /**
     * Get all stock movements with filters.
     */
    public function allMovements(Request $request): JsonResponse
    {
        $query = StockMovement::with(['product', 'warehouse', 'batch', 'createdBy']);

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        $query->orderBy('created_at', 'desc');

        $perPage = min($request->get('per_page', 15), 100);
        $movements = $query->paginate($perPage);

        return response()->json($movements);
    }

    /**
     * Get adjustment history.
     */
    public function adjustmentHistory(Request $request): JsonResponse
    {
        $query = InventoryAdjustment::with(['product', 'warehouse', 'createdBy', 'approvedBy']);

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('adjustment_type')) {
            $query->where('adjustment_type', $request->adjustment_type);
        }

        $query->orderBy('created_at', 'desc');

        $perPage = min($request->get('per_page', 15), 100);
        $adjustments = $query->paginate($perPage);

        return response()->json($adjustments);
    }
}
