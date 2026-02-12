<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BranchController extends Controller
{
    /**
     * Get all branches
     */
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        $query = Branch::where('tenant_id', $tenantId);
        
        // Only show active branches unless explicitly requested
        if (!$request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }
        
        $branches = $query->orderBy('is_main_branch', 'desc')
            ->orderBy('name')
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->branch_code,
                    'branch_code' => $branch->branch_code,
                    'address' => $branch->address,
                    'phone' => $branch->phone,
                    'email' => $branch->email,
                    'branch_type' => $branch->branch_type,
                    'is_main_branch' => $branch->is_main_branch,
                    'is_active' => $branch->is_active,
                    'location' => $branch->address,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'branches' => $branches
            ]
        ]);
    }

    /**
     * Create a new branch
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'branch_code' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'branch_type' => 'nullable|string|in:office,warehouse,retail,factory',
            'is_main_branch' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        // If setting as main branch, unset other main branches
        if ($request->is_main_branch) {
            Branch::where('tenant_id', $tenantId)
                ->update(['is_main_branch' => false]);
        }

        $branch = Branch::create([
            'tenant_id' => $tenantId,
            'name' => $request->name,
            'branch_code' => $request->branch_code,
            'address' => $request->address,
            'phone' => $request->phone,
            'email' => $request->email,
            'branch_type' => $request->branch_type ?? 'office',
            'is_main_branch' => $request->is_main_branch ?? false,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Branch created successfully',
            'data' => [
                'branch' => $branch
            ]
        ], 201);
    }

    /**
     * Update a branch
     */
    public function update(Request $request, Branch $branch)
    {
        // Check tenant access
        if ($branch->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'branch_code' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'branch_type' => 'nullable|string|in:office,warehouse,retail,factory',
            'is_main_branch' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        // If setting as main branch, unset other main branches
        if ($request->is_main_branch && !$branch->is_main_branch) {
            Branch::where('tenant_id', $tenantId)
                ->where('id', '!=', $branch->id)
                ->update(['is_main_branch' => false]);
        }

        $branch->update($request->only([
            'name', 'branch_code', 'address', 'phone', 
            'email', 'branch_type', 'is_main_branch', 'is_active'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Branch updated successfully',
            'data' => $branch
        ]);
    }

    /**
     * Delete a branch
     */
    public function destroy(Branch $branch)
    {
        // Check tenant access
        if ($branch->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized');
        }

        if ($branch->is_main_branch) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete main branch'
            ], 422);
        }

        $branch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Branch deleted successfully'
        ]);
    }

    /**
     * Toggle branch active status
     */
    public function toggleActive(Branch $branch)
    {
        // Check tenant access
        if ($branch->tenant_id !== Auth::user()->tenant_id) {
            abort(403, 'Unauthorized');
        }

        if ($branch->is_main_branch && $branch->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot deactivate main branch'
            ], 422);
        }

        $branch->update(['is_active' => !$branch->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Branch status updated',
            'data' => $branch
        ]);
    }
}
