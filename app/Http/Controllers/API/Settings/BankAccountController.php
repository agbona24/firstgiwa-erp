<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BankAccountController extends Controller
{
    protected $table = 'bank_accounts';

    /**
     * Get all bank accounts
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;

        $accounts = DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->orderBy('is_default', 'desc')
            ->orderBy('bank_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'bank_accounts' => $accounts
            ]
        ]);
    }

    /**
     * Create a new bank account
     */
    public function store(Request $request)
    {
        $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'account_type' => 'required|in:current,savings,domiciliary',
            'is_default' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        // If setting as default, unset other defaults
        if ($request->is_default) {
            DB::table($this->table)
                ->where('tenant_id', $tenantId)
                ->update(['is_default' => false]);
        }

        $id = DB::table($this->table)->insertGetId([
            'tenant_id' => $tenantId,
            'bank_name' => $request->bank_name,
            'account_name' => $request->account_name,
            'account_number' => $request->account_number,
            'account_type' => $request->account_type,
            'is_default' => $request->is_default ?? false,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $account = DB::table($this->table)->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Bank account created successfully',
            'data' => [
                'bank_account' => $account
            ]
        ], 201);
    }

    /**
     * Update a bank account
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'account_type' => 'required|in:current,savings,domiciliary',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $tenantId = Auth::user()->tenant_id;

        // If setting as default, unset other defaults
        if ($request->is_default) {
            DB::table($this->table)
                ->where('tenant_id', $tenantId)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->update([
                'bank_name' => $request->bank_name,
                'account_name' => $request->account_name,
                'account_number' => $request->account_number,
                'account_type' => $request->account_type,
                'is_default' => $request->is_default ?? false,
                'is_active' => $request->is_active ?? true,
                'updated_at' => now(),
            ]);

        $account = DB::table($this->table)->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Bank account updated successfully',
            'data' => $account
        ]);
    }

    /**
     * Delete a bank account
     */
    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;

        $account = DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();

        if ($account && $account->is_default) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete default bank account'
            ], 422);
        }

        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bank account deleted successfully'
        ]);
    }

    /**
     * Set as default
     */
    public function setDefault($id)
    {
        $tenantId = Auth::user()->tenant_id;

        // Unset all defaults
        DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->update(['is_default' => false]);

        // Set this one as default
        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->update(['is_default' => true, 'updated_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Default bank account updated'
        ]);
    }
}
