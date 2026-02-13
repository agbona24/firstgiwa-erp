<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('supplier_code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%");
            });
        }

        // Active status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Has outstanding balance filter
        if ($request->boolean('has_outstanding')) {
            $query->where('outstanding_balance', '>', 0);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('per_page', 15);
        $suppliers = $query->paginate($perPage);

        return response()->json($suppliers);
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_code' => 'nullable|string|unique:suppliers,supplier_code|max:50',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:suppliers,email|max:255',
            'phone' => 'required|string|max:50',
            'address' => 'nullable|string|max:500',
            'contact_person' => 'nullable|string|max:255',
            'payment_terms_days' => 'nullable|integer|min:0|max:365',
            'tax_id' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        // Generate supplier code if not provided
        if (empty($validated['supplier_code'])) {
            $validated['supplier_code'] = $this->generateSupplierCode();
        }

        $supplier = Supplier::create($validated);

        return response()->json([
            'message' => 'Supplier created successfully',
            'data' => $supplier,
        ], 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show(int $id): JsonResponse
    {
        $supplier = Supplier::with(['purchaseOrders' => function ($query) {
            $query->latest()->limit(10);
        }])->findOrFail($id);

        return response()->json(['data' => $supplier]);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $validated = $request->validate([
            'supplier_code' => ['nullable', 'string', 'max:50', Rule::unique('suppliers')->ignore($supplier->id)],
            'name' => 'sometimes|required|string|max:255',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('suppliers')->ignore($supplier->id)],
            'phone' => 'sometimes|required|string|max:50',
            'address' => 'nullable|string|max:500',
            'contact_person' => 'nullable|string|max:255',
            'payment_terms_days' => 'nullable|integer|min:0|max:365',
            'tax_id' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $supplier->update($validated);

        return response()->json([
            'message' => 'Supplier updated successfully',
            'data' => $supplier->fresh(),
        ]);
    }

    /**
     * Remove the specified supplier (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        // Check if supplier has pending purchase orders
        $pendingOrders = $supplier->purchaseOrders()->whereIn('status', ['pending', 'approved', 'partial'])->count();
        if ($pendingOrders > 0) {
            return response()->json([
                'message' => 'Cannot delete supplier with pending purchase orders.',
            ], 422);
        }

        // Check for outstanding balance
        if ($supplier->outstanding_balance > 0) {
            return response()->json([
                'message' => 'Cannot delete supplier with outstanding balance.',
            ], 422);
        }

        $supplier->delete();

        return response()->json([
            'message' => 'Supplier deleted successfully',
        ]);
    }

    /**
     * Get purchase orders for a supplier.
     */
    public function purchaseOrders(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $query = $supplier->purchaseOrders();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = $request->input('per_page', 15);
        $orders = $query->with(['warehouse', 'creator'])
            ->latest('order_date')
            ->paginate($perPage);

        return response()->json($orders);
    }

    /**
     * Get payments for a supplier.
     */
    public function payments(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $query = $supplier->payments();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = $request->input('per_page', 15);
        $payments = $query->with(['recorder'])
            ->latest('payment_date')
            ->paginate($perPage);

        return response()->json($payments);
    }

    /**
     * Get supplier statement/summary.
     */
    public function statement(int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $summary = [
            'supplier' => $supplier,
            'total_purchases' => $supplier->total_purchases,
            'outstanding_balance' => $supplier->outstanding_balance,
            'total_orders' => $supplier->purchaseOrders()->count(),
            'completed_orders' => $supplier->purchaseOrders()->where('status', 'completed')->count(),
            'pending_orders' => $supplier->purchaseOrders()->whereIn('status', ['pending', 'approved'])->count(),
            'total_payments' => $supplier->payments()->where('status', 'completed')->sum('amount'),
        ];

        return response()->json(['data' => $summary]);
    }

    /**
     * Toggle supplier active status.
     */
    public function toggleActive(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);
        
        $supplier->update(['is_active' => !$supplier->is_active]);

        return response()->json([
            'message' => $supplier->is_active ? 'Supplier activated successfully' : 'Supplier deactivated successfully',
            'data' => $supplier->fresh(),
        ]);
    }

    /**
     * Generate a unique supplier code.
     */
    protected function generateSupplierCode(): string
    {
        $prefix = 'SUP';
        $lastSupplier = Supplier::orderBy('id', 'desc')->first();
        $sequence = $lastSupplier ? ($lastSupplier->id + 1) : 1;
        
        return $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}
