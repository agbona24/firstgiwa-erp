<?php

namespace App\Http\Traits;

use Illuminate\Support\Facades\Auth;

trait UsesBranch
{
    /**
     * Get the current branch ID from request, header, or user default.
     * Falls back to 1 (primary branch) if none found.
     *
     * @param \Illuminate\Http\Request $request
     * @return int
     */
    protected function getBranchId($request = null): int
    {
        if ($request) {
            // Check query parameter first
            if ($request->has('branch_id') && $request->input('branch_id')) {
                return (int) $request->input('branch_id');
            }
            
            // Check header
            $headerBranchId = $request->header('X-Branch-ID');
            if ($headerBranchId) {
                return (int) $headerBranchId;
            }
        }
        
        // Fall back to user's branch
        $user = Auth::user();
        if ($user && $user->branch_id) {
            return (int) $user->branch_id;
        }
        
        // Default to primary branch
        return 1;
    }

    /**
     * Get the current tenant ID from the authenticated user.
     *
     * @return int|null
     */
    protected function getTenantId(): ?int
    {
        return Auth::user()?->tenant_id;
    }
}
