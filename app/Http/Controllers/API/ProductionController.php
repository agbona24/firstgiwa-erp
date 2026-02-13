<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use App\Models\ProductionRunItem;
use App\Models\ProductionLoss;
use App\Models\Formula;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProductionController extends Controller
{
    /**
     * Display a listing of production runs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProductionRun::with([
            'formula',
            'finishedProduct',
            'warehouse',
            'branch',
            'creator'
        ]);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('production_number', 'like', "%{$search}%")
                    ->orWhere('batch_number', 'like', "%{$search}%")
                    ->orWhereHas('finishedProduct', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Warehouse filter
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        // Branch filter
        if ($request->filled('branch_id')) {
            $branchId = $request->input('branch_id');
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id'); // include legacy runs without branch
            });
        }

        // Product filter
        if ($request->filled('product_id')) {
            $query->where('finished_product_id', $request->input('product_id'));
        }

        // Date range filter
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('production_date', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'production_date');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('per_page', 15);
        $runs = $query->paginate($perPage);

        return response()->json($runs);
    }

    /**
     * Store a newly created production run.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'branch_id' => 'nullable|exists:branches,id',
            'formula_id' => 'required|exists:formulas,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'production_date' => 'required|date',
            'target_quantity' => 'required|numeric|min:0.01',
            'batch_number' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date|after:production_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $tenantId = $validated['tenant_id'] ?? $request->user()?->tenant_id;
        if (!$tenantId) {
            return response()->json([
                'message' => 'Tenant is required for production runs.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Get formula and calculate required materials
            $formula = Formula::with('items.product')->findOrFail($validated['formula_id']);

            // Create production run
            $branchId = $validated['branch_id'] ?? $request->header('X-Branch-ID');

            $run = ProductionRun::create([
                'tenant_id' => $tenantId,
                'branch_id' => $branchId ?: null,
                'production_number' => ProductionRun::generateProductionNumber(),
                'formula_id' => $formula->id,
                'finished_product_id' => $formula->product_id,
                'warehouse_id' => $validated['warehouse_id'],
                'production_date' => $validated['production_date'],
                'target_quantity' => $validated['target_quantity'],
                'batch_number' => $validated['batch_number'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'status' => 'planned',
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            // Calculate and create run items based on formula percentages
            $targetQty = (float) $validated['target_quantity'];
            if ($targetQty <= 0) {
                throw new \App\Exceptions\BusinessRuleException('Target quantity must be greater than zero.');
            }

            foreach ($formula->items as $formulaItem) {
                $quantityRequired = ($targetQty * $formulaItem->percentage) / 100;

                // Get current inventory cost for unit cost
                $inventory = Inventory::where('product_id', $formulaItem->product_id)
                    ->where('warehouse_id', $validated['warehouse_id'])
                    ->first();

                $unitCost = $formulaItem->product->cost_price ?? 0;

                ProductionRunItem::create([
                    'production_run_id' => $run->id,
                    'product_id' => $formulaItem->product_id,
                    'planned_quantity' => $quantityRequired,
                    'actual_quantity' => 0,
                    'variance' => 0,
                    'unit_of_measure' => $formulaItem->product->unit_of_measure ?? 'unit',
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantityRequired * $unitCost,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Production run created successfully',
                'data' => $run->load([
                    'formula',
                    'finishedProduct',
                    'warehouse',
                    'items.product',
                    'creator'
                ]),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create production run',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified production run.
     */
    public function show(int $id): JsonResponse
    {
        $run = ProductionRun::with([
            'formula.items.product',
            'finishedProduct',
            'warehouse',
            'branch',
            'items.product',
            'losses.product',
            'creator',
            'completedBy'
        ])->findOrFail($id);

        return response()->json(['data' => $run]);
    }

    /**
     * Update the specified production run.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $run = ProductionRun::findOrFail($id);

        // Can only update planned runs
        if ($run->status !== 'planned') {
            return response()->json([
                'message' => 'Can only update planned production runs.',
            ], 422);
        }

        $validated = $request->validate([
            'production_date' => 'sometimes|required|date',
            'target_quantity' => 'sometimes|required|numeric|min:0.01',
            'batch_number' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $run->update($validated);

        // Recalculate items if target quantity changed
        if (isset($validated['target_quantity'])) {
            $formula = $run->formula;
            $targetQty = (float) $validated['target_quantity'];
            if ($targetQty <= 0) {
                throw new \App\Exceptions\BusinessRuleException('Target quantity must be greater than zero.');
            }

            foreach ($run->items as $item) {
                $formulaItem = $formula->items->where('product_id', $item->product_id)->first();
                if ($formulaItem) {
                    $quantityRequired = ($targetQty * $formulaItem->percentage) / 100;
                    $item->update([
                        'planned_quantity' => $quantityRequired,
                        'total_cost' => $quantityRequired * $item->unit_cost,
                        'variance' => ($item->actual_quantity ?? 0) - $quantityRequired,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Production run updated successfully',
            'data' => $run->fresh(['formula', 'finishedProduct', 'items.product']),
        ]);
    }

    /**
     * Remove the specified production run (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $run = ProductionRun::findOrFail($id);

        // Can only delete planned runs
        if ($run->status !== 'planned') {
            return response()->json([
                'message' => 'Can only delete planned production runs.',
            ], 422);
        }

        $run->items()->delete();
        $run->delete();

        return response()->json([
            'message' => 'Production run deleted successfully',
        ]);
    }

    /**
     * Start a production run.
     */
    public function start(Request $request, int $id): JsonResponse
    {
        $run = ProductionRun::with('items.product')->findOrFail($id);

        if ($run->status !== 'planned') {
            return response()->json([
                'message' => 'Can only start planned production runs.',
            ], 422);
        }

        // Check material availability
        $insufficientMaterials = [];
        foreach ($run->items as $item) {
            $inventory = Inventory::where('product_id', $item->product_id)
                ->where('warehouse_id', $run->warehouse_id)
                ->first();

            $available = $inventory ? $inventory->quantity : 0;
            if ($available < $item->planned_quantity) {
                $insufficientMaterials[] = [
                    'product' => $item->product->name,
                    'required' => $item->planned_quantity,
                    'available' => $available,
                ];
            }
        }

        if (!empty($insufficientMaterials)) {
            return response()->json([
                'message' => 'Insufficient materials to start production',
                'data' => ['insufficient_materials' => $insufficientMaterials],
            ], 422);
        }

        $run->update([
            'status' => 'in_progress',
            'start_time' => now()->format('H:i:s'),
        ]);

        return response()->json([
            'message' => 'Production run started successfully',
            'data' => $run->fresh(),
        ]);
    }

    /**
     * Complete a production run.
     */
    public function complete(Request $request, int $id): JsonResponse
    {
        $run = ProductionRun::with('items')->findOrFail($id);

        if ($run->status !== 'in_progress') {
            return response()->json([
                'message' => 'Can only complete in-progress production runs.',
            ], 422);
        }

        $validated = $request->validate([
            'actual_output' => 'required|numeric|min:0',
            'wastage_quantity' => 'nullable|numeric|min:0',
            'items' => 'required|array',
            'items.*.item_id' => 'required|exists:production_run_items,id',
            'items.*.quantity_used' => 'required|numeric|min:0',
            'items.*.wastage' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $endTime = now();
            
            // Parse start_time - handle different formats (H:i or H:i:s)
            $startTime = $endTime;
            if ($run->start_time) {
                try {
                    // Try H:i:s format first
                    $startTime = \Carbon\Carbon::createFromFormat('H:i:s', $run->start_time);
                } catch (\Exception $e) {
                    try {
                        // Try H:i format
                        $startTime = \Carbon\Carbon::createFromFormat('H:i', $run->start_time);
                    } catch (\Exception $e2) {
                        // Use current time if parsing fails
                        $startTime = $endTime;
                    }
                }
            }
            $duration = $startTime->diffInMinutes($endTime);

            // Calculate wastage percentage
            $wastagePercentage = $run->target_quantity > 0 
                ? (($validated['wastage_quantity'] ?? 0) / $run->target_quantity) * 100 
                : 0;

            // Update production run
            $run->update([
                'status' => 'completed',
                'actual_output' => $validated['actual_output'],
                'wastage_quantity' => $validated['wastage_quantity'] ?? 0,
                'wastage_percentage' => round($wastagePercentage, 2),
                'end_time' => $endTime->format('H:i:s'),
                'duration_minutes' => $duration,
                'notes' => $validated['notes'] ?? $run->notes,
                'completed_by' => $request->user()->id,
                'completed_at' => now(),
            ]);

            // Update items and deduct from inventory
            foreach ($validated['items'] as $itemData) {
                $item = ProductionRunItem::findOrFail($itemData['item_id']);
                
                $actualQty = $itemData['quantity_used'];
                $item->update([
                    'actual_quantity' => $actualQty,
                    'variance' => $actualQty - $item->planned_quantity,
                    'total_cost' => $actualQty * $item->unit_cost,
                ]);

                // Deduct from inventory
                $inventory = Inventory::where('product_id', $item->product_id)
                    ->where('warehouse_id', $run->warehouse_id)
                    ->first();

                if ($inventory) {
                    $inventory->decrement('quantity', $actualQty);
                }
            }

            // Add finished goods to inventory (only if finished_product_id is set)
            if ($run->finished_product_id) {
                $finishedInventory = Inventory::firstOrCreate(
                    [
                        'product_id' => $run->finished_product_id,
                        'warehouse_id' => $run->warehouse_id,
                    ],
                    ['quantity' => 0]
                );
                $finishedInventory->increment('quantity', $validated['actual_output']);
            }

            // Log custom PRODUCTION action
            $run->logCustomAudit('PRODUCTION', 'Production run completed', [
                'completed_by' => $request->user()->name,
                'actual_output' => $validated['actual_output'],
                'target_quantity' => $run->target_quantity,
                'wastage_percentage' => round($wastagePercentage, 2),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Production run completed successfully',
                'data' => $run->fresh(['items.product', 'finishedProduct']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to complete production run',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel a production run.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $run = ProductionRun::findOrFail($id);

        if (in_array($run->status, ['completed', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot cancel a completed or already cancelled production run.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $run->update([
            'status' => 'cancelled',
            'notes' => $run->notes . "\nCancellation reason: " . $validated['reason'],
        ]);

        return response()->json([
            'message' => 'Production run cancelled successfully',
            'data' => $run->fresh(),
        ]);
    }

    /**
     * Record production loss.
     */
    public function recordLoss(Request $request, int $id): JsonResponse
    {
        $run = ProductionRun::findOrFail($id);

        if ($run->status !== 'in_progress') {
            return response()->json([
                'message' => 'Can only record losses for in-progress production runs.',
            ], 422);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:500',
            'loss_type' => 'required|string|in:spillage,damage,quality_reject,other',
        ]);

        $loss = ProductionLoss::create([
            'production_run_id' => $run->id,
            'product_id' => $validated['product_id'],
            'quantity' => $validated['quantity'],
            'reason' => $validated['reason'],
            'loss_type' => $validated['loss_type'],
            'recorded_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Production loss recorded successfully',
            'data' => $loss->load('product'),
        ], 201);
    }

    /**
     * Get planned production runs.
     */
    public function planned(Request $request): JsonResponse
    {
        $runs = ProductionRun::with(['formula', 'finishedProduct', 'warehouse'])
            ->where('status', 'planned')
            ->orderBy('production_date', 'asc')
            ->paginate($request->input('per_page', 15));

        return response()->json($runs);
    }

    /**
     * Get in-progress production runs.
     */
    public function inProgress(Request $request): JsonResponse
    {
        $runs = ProductionRun::with(['formula', 'finishedProduct', 'warehouse', 'creator'])
            ->where('status', 'in_progress')
            ->orderBy('start_time', 'asc')
            ->paginate($request->input('per_page', 15));

        return response()->json($runs);
    }

    /**
     * Check material availability for a production run.
     */
    public function checkMaterials(int $id): JsonResponse
    {
        $run = ProductionRun::with('items.product')->findOrFail($id);

        $materials = [];
        foreach ($run->items as $item) {
            $inventory = Inventory::where('product_id', $item->product_id)
                ->where('warehouse_id', $run->warehouse_id)
                ->first();

            $available = $inventory ? $inventory->quantity : 0;
            $materials[] = [
                'product' => $item->product,
                'required' => $item->planned_quantity,
                'available' => $available,
                'sufficient' => $available >= $item->planned_quantity,
            ];
        }

        $allSufficient = collect($materials)->every(fn($m) => $m['sufficient']);

        return response()->json([
            'data' => [
                'materials' => $materials,
                'all_sufficient' => $allSufficient,
            ],
        ]);
    }

    /**
     * Get production summary/statistics.
     */
    public function summary(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $summary = [
            'total_runs' => ProductionRun::whereBetween('production_date', [$startDate, $endDate])->count(),
            'completed_runs' => ProductionRun::completed()
                ->whereBetween('production_date', [$startDate, $endDate])
                ->count(),
            'total_output' => ProductionRun::completed()
                ->whereBetween('production_date', [$startDate, $endDate])
                ->sum('actual_output'),
            'total_wastage' => ProductionRun::completed()
                ->whereBetween('production_date', [$startDate, $endDate])
                ->sum('wastage_quantity'),
            'average_efficiency' => ProductionRun::completed()
                ->whereBetween('production_date', [$startDate, $endDate])
                ->avg(DB::raw('(actual_output / target_quantity) * 100')),
            'by_status' => ProductionRun::whereBetween('production_date', [$startDate, $endDate])
                ->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
            'planned_count' => ProductionRun::planned()->count(),
            'in_progress_count' => ProductionRun::inProgress()->count(),
        ];

        return response()->json(['data' => $summary]);
    }
}
