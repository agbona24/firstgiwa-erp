<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\FormulaService;
use App\Http\Requests\Formula\StoreFormulaRequest;
use App\Http\Requests\Formula\UpdateFormulaRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FormulaController extends Controller
{
    protected $formulaService;

    public function __construct(FormulaService $formulaService)
    {
        $this->formulaService = $formulaService;
    }

    /**
     * List formulas
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'customer_id', 'is_active', 'sort_by', 'sort_dir']);
        $perPage = $request->get('per_page', 15);

        $formulas = $this->formulaService->list($filters, $perPage);

        return response()->json($formulas);
    }

    /**
     * Store a new formula
     */
    public function store(StoreFormulaRequest $request): JsonResponse
    {
        $formula = $this->formulaService->create($request->validated());

        return response()->json([
            'message' => 'Formula created successfully',
            'data' => $formula,
        ], 201);
    }

    /**
     * Show formula details
     */
    public function show(int $id): JsonResponse
    {
        $formula = $this->formulaService->find($id);

        return response()->json(['data' => $formula]);
    }

    /**
     * Update formula
     */
    public function update(UpdateFormulaRequest $request, int $id): JsonResponse
    {
        $formula = $this->formulaService->update($id, $request->validated());

        return response()->json([
            'message' => 'Formula updated successfully',
            'data' => $formula,
        ]);
    }

    /**
     * Delete formula
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $reason = $request->input('reason', 'Formula deleted');
        $this->formulaService->delete($id, $reason);

        return response()->json([
            'message' => 'Formula deleted successfully',
        ]);
    }

    /**
     * Get formulas available for a customer
     */
    public function forCustomer(int $customerId): JsonResponse
    {
        $formulas = $this->formulaService->getAvailableForCustomer($customerId);

        return response()->json(['data' => $formulas]);
    }

    /**
     * Calculate requirements for a formula
     */
    public function calculateRequirements(Request $request, int $id): JsonResponse
    {
        $totalQuantity = $request->input('total_quantity');
        
        if (!$totalQuantity) {
            return response()->json([
                'message' => 'Total quantity is required',
            ], 422);
        }

        $requirements = $this->formulaService->calculateRequirements($id, $totalQuantity);

        return response()->json(['data' => $requirements]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive(Request $request, int $id): JsonResponse
    {
        $active = $request->boolean('is_active');
        $reason = $request->input('reason', $active ? 'Formula activated' : 'Formula deactivated');

        $formula = $this->formulaService->toggleActive($id, $active, $reason);

        return response()->json([
            'message' => $active ? 'Formula activated successfully' : 'Formula deactivated successfully',
            'data' => $formula,
        ]);
    }

    /**
     * Clone a formula
     */
    public function clone(Request $request, int $id): JsonResponse
    {
        $overrides = $request->only(['name', 'customer_id', 'description', 'is_active']);
        $formula = $this->formulaService->clone($id, $overrides);

        return response()->json([
            'message' => 'Formula cloned successfully',
            'data' => $formula,
        ], 201);
    }
}
