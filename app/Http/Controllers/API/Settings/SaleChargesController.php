<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleChargesController extends Controller
{
    protected $table = 'sale_charges';

    /**
     * List all sale charges for this tenant
     */
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        $query = DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->orderBy('name');

        // Optionally filter by applies_to context
        if ($request->has('context')) {
            $context = $request->context; // 'pos' or 'sales_order'
            $query->where(function ($q) use ($context) {
                $q->where('applies_to', $context)
                  ->orWhere('applies_to', 'both');
            });
        }

        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }

        $charges = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'charges' => $charges,
            ],
        ]);
    }

    /**
     * Create a new sale charge
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'amount_type'    => 'required|in:fixed,percentage',
            'default_amount' => 'required|numeric|min:0',
            'applies_to'     => 'required|in:pos,sales_order,both',
            'add_to_credit'  => 'boolean',
            'allow_override' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        $id = DB::table($this->table)->insertGetId([
            'tenant_id'      => $tenantId,
            'name'           => $request->name,
            'description'    => $request->description,
            'amount_type'    => $request->amount_type,
            'default_amount' => $request->default_amount,
            'applies_to'     => $request->applies_to,
            'add_to_credit'  => $request->boolean('add_to_credit', false),
            'allow_override' => $request->boolean('allow_override', true),
            'is_active'      => true,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $charge = DB::table($this->table)->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Sale charge created successfully',
            'data'    => ['charge' => $charge],
        ], 201);
    }

    /**
     * Update a sale charge
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'amount_type'    => 'required|in:fixed,percentage',
            'default_amount' => 'required|numeric|min:0',
            'applies_to'     => 'required|in:pos,sales_order,both',
            'add_to_credit'  => 'boolean',
            'allow_override' => 'boolean',
            'is_active'      => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->update([
                'name'           => $request->name,
                'description'    => $request->description,
                'amount_type'    => $request->amount_type,
                'default_amount' => $request->default_amount,
                'applies_to'     => $request->applies_to,
                'add_to_credit'  => $request->boolean('add_to_credit', false),
                'allow_override' => $request->boolean('allow_override', true),
                'is_active'      => $request->boolean('is_active', true),
                'updated_at'     => now(),
            ]);

        $charge = DB::table($this->table)->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Sale charge updated successfully',
            'data'    => ['charge' => $charge],
        ]);
    }

    /**
     * Delete a sale charge
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
            'message' => 'Sale charge deleted successfully',
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive($id)
    {
        $tenantId = Auth::user()->tenant_id;

        $charge = DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$charge) {
            return response()->json(['success' => false, 'message' => 'Charge not found'], 404);
        }

        DB::table($this->table)
            ->where('id', $id)
            ->update([
                'is_active'  => !$charge->is_active,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Sale charge status updated',
            'data'    => ['is_active' => !$charge->is_active],
        ]);
    }
}
