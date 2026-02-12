<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Liability;
use App\Models\LiabilityPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssetLiabilityController extends Controller
{
    /**
     * Get all assets with filters
     */
    public function assets(Request $request)
    {
        $query = Asset::query();

        // Filters
        if ($request->category) {
            $query->where('category', $request->category);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('asset_code', 'like', "%{$request->search}%")
                  ->orWhere('serial_number', 'like', "%{$request->search}%");
            });
        }

        $assets = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);

        // Summary stats
        $summary = [
            'total_assets' => Asset::count(),
            'active_assets' => Asset::where('status', 'active')->count(),
            'total_value' => Asset::where('status', 'active')->sum('current_value'),
            'total_depreciation' => Asset::sum('accumulated_depreciation'),
            'by_category' => Asset::where('status', 'active')
                ->select('category', DB::raw('COUNT(*) as count'), DB::raw('SUM(current_value) as value'))
                ->groupBy('category')
                ->get(),
        ];

        return response()->json([
            'assets' => $assets,
            'summary' => $summary,
        ]);
    }

    /**
     * Create a new asset
     */
    public function storeAsset(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:equipment,vehicle,furniture,building,electronics,other',
            'purchase_price' => 'required|numeric|min:0',
            'salvage_value' => 'nullable|numeric|min:0',
            'purchase_date' => 'required|date',
            'depreciation_method' => 'nullable|in:straight_line,declining_balance,none',
            'useful_life_years' => 'nullable|integer|min:1|max:50',
            'status' => 'nullable|in:active,inactive,disposed,maintenance',
            'location' => 'nullable|string|max:255',
            'assigned_to' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'supplier' => 'nullable|string|max:255',
            'warranty_expiry' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();
        $validated['current_value'] = $validated['purchase_price'];

        $asset = Asset::create($validated);

        return response()->json([
            'message' => 'Asset created successfully',
            'asset' => $asset,
        ], 201);
    }

    /**
     * Update an asset
     */
    public function updateAsset(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|in:equipment,vehicle,furniture,building,electronics,other',
            'current_value' => 'sometimes|numeric|min:0',
            'salvage_value' => 'nullable|numeric|min:0',
            'depreciation_method' => 'nullable|in:straight_line,declining_balance,none',
            'useful_life_years' => 'nullable|integer|min:1|max:50',
            'status' => 'nullable|in:active,inactive,disposed,maintenance',
            'disposal_date' => 'nullable|date',
            'disposal_value' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'assigned_to' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $asset->update($validated);

        return response()->json([
            'message' => 'Asset updated successfully',
            'asset' => $asset->fresh(),
        ]);
    }

    /**
     * Delete an asset
     */
    public function destroyAsset(Asset $asset)
    {
        $asset->delete();

        return response()->json([
            'message' => 'Asset deleted successfully',
        ]);
    }

    /**
     * Run depreciation for all assets
     */
    public function runDepreciation(Request $request)
    {
        $assets = Asset::where('status', 'active')
            ->where('depreciation_method', '!=', 'none')
            ->get();

        $updated = 0;
        foreach ($assets as $asset) {
            $newDepreciation = $asset->calculateDepreciation();
            if ($newDepreciation > $asset->accumulated_depreciation) {
                $asset->accumulated_depreciation = $newDepreciation;
                $asset->current_value = $asset->purchase_price - $newDepreciation;
                $asset->last_depreciation_date = now();
                $asset->save();
                $updated++;
            }
        }

        return response()->json([
            'message' => "Depreciation calculated for {$updated} assets",
            'updated_count' => $updated,
        ]);
    }

    // ==================== LIABILITIES ====================

    /**
     * Get all liabilities with filters
     */
    public function liabilities(Request $request)
    {
        $query = Liability::with('payments');

        // Filters
        if ($request->category) {
            $query->where('category', $request->category);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('reference', 'like', "%{$request->search}%")
                  ->orWhere('creditor_name', 'like', "%{$request->search}%");
            });
        }

        $liabilities = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);

        // Summary stats
        $summary = [
            'total_liabilities' => Liability::count(),
            'active_liabilities' => Liability::where('status', 'active')->count(),
            'total_outstanding' => Liability::where('status', 'active')->sum('current_balance'),
            'total_principal' => Liability::sum('principal_amount'),
            'short_term_balance' => Liability::where('status', 'active')->where('type', 'short_term')->sum('current_balance'),
            'long_term_balance' => Liability::where('status', 'active')->where('type', 'long_term')->sum('current_balance'),
            'overdue_count' => Liability::where('status', 'active')
                ->whereNotNull('next_payment_date')
                ->where('next_payment_date', '<', now())
                ->count(),
            'by_category' => Liability::where('status', 'active')
                ->select('category', DB::raw('COUNT(*) as count'), DB::raw('SUM(current_balance) as balance'))
                ->groupBy('category')
                ->get(),
        ];

        return response()->json([
            'liabilities' => $liabilities,
            'summary' => $summary,
        ]);
    }

    /**
     * Create a new liability
     */
    public function storeLiability(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:bank_loan,equipment_loan,vehicle_loan,mortgage,credit_line,supplier_credit,tax_liability,other',
            'type' => 'required|in:short_term,long_term',
            'principal_amount' => 'required|numeric|min:0',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'monthly_payment' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'due_date' => 'nullable|date',
            'next_payment_date' => 'nullable|date',
            'creditor_name' => 'required|string|max:255',
            'creditor_contact' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'is_secured' => 'nullable|boolean',
            'collateral' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();
        $validated['current_balance'] = $validated['principal_amount'];

        $liability = Liability::create($validated);

        return response()->json([
            'message' => 'Liability created successfully',
            'liability' => $liability,
        ], 201);
    }

    /**
     * Update a liability
     */
    public function updateLiability(Request $request, Liability $liability)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|in:bank_loan,equipment_loan,vehicle_loan,mortgage,credit_line,supplier_credit,tax_liability,other',
            'type' => 'sometimes|in:short_term,long_term',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'monthly_payment' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'next_payment_date' => 'nullable|date',
            'status' => 'sometimes|in:active,paid_off,defaulted,restructured',
            'creditor_name' => 'sometimes|string|max:255',
            'creditor_contact' => 'nullable|string|max:255',
            'is_secured' => 'nullable|boolean',
            'collateral' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $liability->update($validated);

        return response()->json([
            'message' => 'Liability updated successfully',
            'liability' => $liability->fresh(),
        ]);
    }

    /**
     * Delete a liability
     */
    public function destroyLiability(Liability $liability)
    {
        $liability->delete();

        return response()->json([
            'message' => 'Liability deleted successfully',
        ]);
    }

    /**
     * Record a payment for a liability
     */
    public function recordPayment(Request $request, Liability $liability)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'nullable|date',
            'payment_method' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $payment = $liability->recordPayment(
            $validated['amount'],
            $validated['payment_date'] ?? now(),
            $validated['payment_method'] ?? null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment,
            'liability' => $liability->fresh(),
        ]);
    }

    /**
     * Get payment history for a liability
     */
    public function paymentHistory(Liability $liability)
    {
        $payments = $liability->payments()
            ->orderBy('payment_date', 'desc')
            ->get();

        return response()->json([
            'liability' => $liability,
            'payments' => $payments,
            'total_paid' => $payments->sum('amount'),
            'total_principal_paid' => $payments->sum('principal_paid'),
            'total_interest_paid' => $payments->sum('interest_paid'),
        ]);
    }

    // ==================== SUMMARY ====================

    /**
     * Get combined summary for balance sheet
     */
    public function summary()
    {
        // Assets summary
        $totalAssets = Asset::where('status', 'active')->sum('current_value');
        $assetsByCategory = Asset::where('status', 'active')
            ->select('category', DB::raw('SUM(current_value) as value'))
            ->groupBy('category')
            ->pluck('value', 'category');

        // Liabilities summary
        $shortTermLiabilities = Liability::where('status', 'active')
            ->where('type', 'short_term')
            ->sum('current_balance');
        $longTermLiabilities = Liability::where('status', 'active')
            ->where('type', 'long_term')
            ->sum('current_balance');
        $totalLiabilities = $shortTermLiabilities + $longTermLiabilities;

        // Equity = Assets - Liabilities
        $equity = $totalAssets - $totalLiabilities;

        return response()->json([
            'assets' => [
                'total' => $totalAssets,
                'by_category' => $assetsByCategory,
                'count' => Asset::where('status', 'active')->count(),
            ],
            'liabilities' => [
                'total' => $totalLiabilities,
                'short_term' => $shortTermLiabilities,
                'long_term' => $longTermLiabilities,
                'count' => Liability::where('status', 'active')->count(),
            ],
            'equity' => $equity,
            'balance_check' => abs($totalAssets - ($totalLiabilities + $equity)) < 0.01,
        ]);
    }
}
