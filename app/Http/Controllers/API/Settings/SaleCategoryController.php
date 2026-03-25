<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\SaleCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SaleCategoryController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;

        $categories = SaleCategory::where(function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId)->orWhereNull('tenant_id');
            })
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'is_active'   => 'boolean',
        ]);

        $validated['tenant_id'] = Auth::user()->tenant_id;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $category = SaleCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sale category created successfully',
            'data'    => $category,
        ], 201);
    }

    public function update(Request $request, SaleCategory $saleCategory)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'is_active'   => 'boolean',
        ]);

        $saleCategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sale category updated successfully',
            'data'    => $saleCategory,
        ]);
    }

    public function destroy(SaleCategory $saleCategory)
    {
        $saleCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sale category deleted successfully',
        ]);
    }

    public function toggleStatus(SaleCategory $saleCategory)
    {
        $saleCategory->update(['is_active' => !$saleCategory->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Status updated',
            'data'    => $saleCategory,
        ]);
    }
}
