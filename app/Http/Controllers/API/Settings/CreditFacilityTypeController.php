<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\CreditFacilityType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CreditFacilityTypeController extends Controller
{
    /**
     * Get all credit facility types
     */
    public function index()
    {
        $types = CreditFacilityType::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }

    /**
     * Create a new credit facility type
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:credit_facility_types,code',
            'default_limit' => 'required|numeric|min:0',
            'max_limit' => 'required|numeric|min:0',
            'payment_terms' => 'required|integer|min:1',
            'payment_terms_unit' => 'required|in:days,weeks,months',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'grace_period' => 'nullable|integer|min:0',
            'grace_period_unit' => 'nullable|in:days,weeks,months',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $user = Auth::user();
        $validated['tenant_id'] = $user->tenant_id ?? null;
        $validated['interest_rate'] = $validated['interest_rate'] ?? 0;
        $validated['grace_period'] = $validated['grace_period'] ?? 0;
        $validated['grace_period_unit'] = $validated['grace_period_unit'] ?? 'days';
        $validated['is_active'] = $validated['is_active'] ?? true;

        $type = CreditFacilityType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Credit facility type created successfully',
            'data' => $type
        ], 201);
    }

    /**
     * Get a single credit facility type
     */
    public function show(CreditFacilityType $creditFacilityType)
    {
        return response()->json([
            'success' => true,
            'data' => $creditFacilityType
        ]);
    }

    /**
     * Update a credit facility type
     */
    public function update(Request $request, CreditFacilityType $creditFacilityType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:credit_facility_types,code,' . $creditFacilityType->id,
            'default_limit' => 'required|numeric|min:0',
            'max_limit' => 'required|numeric|min:0',
            'payment_terms' => 'required|integer|min:1',
            'payment_terms_unit' => 'required|in:days,weeks,months',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'grace_period' => 'nullable|integer|min:0',
            'grace_period_unit' => 'nullable|in:days,weeks,months',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $creditFacilityType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Credit facility type updated successfully',
            'data' => $creditFacilityType
        ]);
    }

    /**
     * Delete a credit facility type
     */
    public function destroy(CreditFacilityType $creditFacilityType)
    {
        $creditFacilityType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Credit facility type deleted successfully'
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleStatus(CreditFacilityType $creditFacilityType)
    {
        $creditFacilityType->update([
            'is_active' => !$creditFacilityType->is_active
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Credit facility type status updated',
            'data' => $creditFacilityType
        ]);
    }
}
