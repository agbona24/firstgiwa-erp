<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentMethodController extends Controller
{
    protected $table = 'payment_methods';

    /**
     * Get all payment methods
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;

        $methods = DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'payment_methods' => $methods
            ]
        ]);
    }

    /**
     * Create a new payment method
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'bank_account' => 'nullable|string|max:255',
            'requires_reference' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        $id = DB::table($this->table)->insertGetId([
            'tenant_id' => $tenantId,
            'name' => $request->name,
            'code' => $request->code,
            'bank_account' => $request->bank_account,
            'requires_reference' => $request->requires_reference ?? false,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $method = DB::table($this->table)->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Payment method created successfully',
            'data' => [
                'payment_method' => $method
            ]
        ], 201);
    }

    /**
     * Update a payment method
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'bank_account' => 'nullable|string|max:255',
            'requires_reference' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->update([
                'name' => $request->name,
                'code' => $request->code,
                'bank_account' => $request->bank_account,
                'requires_reference' => $request->requires_reference ?? false,
                'is_active' => $request->is_active ?? true,
                'updated_at' => now(),
            ]);

        $method = DB::table($this->table)->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Payment method updated successfully',
            'data' => $method
        ]);
    }

    /**
     * Delete a payment method
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
            'message' => 'Payment method deleted successfully'
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive($id)
    {
        $tenantId = Auth::user()->tenant_id;

        $method = DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$method) {
            return response()->json([
                'success' => false,
                'message' => 'Payment method not found'
            ], 404);
        }

        DB::table($this->table)
            ->where('id', $id)
            ->update([
                'is_active' => !$method->is_active,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment method status updated'
        ]);
    }
}
