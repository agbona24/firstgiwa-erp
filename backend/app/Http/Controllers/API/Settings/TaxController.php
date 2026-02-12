<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TaxController extends Controller
{
    protected $table = 'taxes';

    /**
     * Get all taxes
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;

        $taxes = DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'taxes' => $taxes
            ]
        ]);
    }

    /**
     * Create a new tax
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'rate' => 'required|numeric|min:0',
            'type' => 'required|in:percentage,fixed',
            'applies_to' => 'required|in:sales,purchases,both',
            'is_compound' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        $id = DB::table($this->table)->insertGetId([
            'tenant_id' => $tenantId,
            'name' => $request->name,
            'code' => $request->code,
            'rate' => $request->rate,
            'type' => $request->type,
            'applies_to' => $request->applies_to,
            'is_compound' => $request->is_compound ?? false,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $tax = DB::table($this->table)->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Tax created successfully',
            'data' => [
                'tax' => $tax
            ]
        ], 201);
    }

    /**
     * Update a tax
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'rate' => 'required|numeric|min:0',
            'type' => 'required|in:percentage,fixed',
            'applies_to' => 'required|in:sales,purchases,both',
            'is_compound' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->update([
                'name' => $request->name,
                'code' => $request->code,
                'rate' => $request->rate,
                'type' => $request->type,
                'applies_to' => $request->applies_to,
                'is_compound' => $request->is_compound ?? false,
                'is_active' => $request->is_active ?? true,
                'updated_at' => now(),
            ]);

        $tax = DB::table($this->table)->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Tax updated successfully',
            'data' => $tax
        ]);
    }

    /**
     * Delete a tax
     */
    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;

        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tax deleted successfully'
        ]);
    }

    /**
     * Toggle tax active status
     */
    public function toggleActive($id)
    {
        $tenantId = Auth::user()->tenant_id;

        $tax = DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$tax) {
            return response()->json([
                'success' => false,
                'message' => 'Tax not found'
            ], 404);
        }

        DB::table($this->table)
            ->where('id', $id)
            ->update([
                'is_active' => !$tax->is_active,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Tax status updated'
        ]);
    }
}
