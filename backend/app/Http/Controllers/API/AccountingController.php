<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\PurchaseOrder;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Asset;
use App\Models\Liability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AccountingController extends Controller
{
    /**
     * Get transaction ledger - all financial transactions
     */
    public function ledger(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $category = $request->input('category');
        $type = $request->input('type');

        $transactions = collect();

        // 1. Sales Orders (Revenue - Debit)
        $salesQuery = SalesOrder::with('customer')
            ->where('status', 'completed');
        
        if ($startDate) $salesQuery->whereDate('created_at', '>=', $startDate);
        if ($endDate) $salesQuery->whereDate('created_at', '<=', $endDate);
        
        $sales = $salesQuery->get()->map(function ($order) {
            return [
                'id' => 'SO-' . $order->id,
                'date' => $order->created_at->format('Y-m-d'),
                'reference' => $order->order_number ?? 'SO-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'description' => 'Sales Order - ' . ($order->customer->business_name ?? $order->customer->name ?? 'Customer'),
                'category' => 'Sales Revenue',
                'type' => 'Revenue',
                'debit' => floatval($order->total_amount),
                'credit' => 0,
                'created_at' => $order->created_at,
            ];
        });
        $transactions = $transactions->merge($sales);

        // 2. Payments Received (Cash receipts - already captured in sales, skip to avoid double counting)
        // We track sales as revenue, not individual payments

        // 3. Expenses (Credits/Expenses)
        $expenseQuery = Expense::with('category');
        
        if ($startDate) $expenseQuery->whereDate('expense_date', '>=', $startDate);
        if ($endDate) $expenseQuery->whereDate('expense_date', '<=', $endDate);
        
        $expenses = $expenseQuery->get()->map(function ($expense) {
            $categoryName = $expense->category->name ?? $expense->expense_type ?? 'Operating Expenses';
            return [
                'id' => 'EXP-' . $expense->id,
                'date' => $expense->expense_date ?? $expense->created_at->format('Y-m-d'),
                'reference' => $expense->reference_number ?? 'EXP-' . str_pad($expense->id, 3, '0', STR_PAD_LEFT),
                'description' => $expense->description ?? $categoryName,
                'category' => $categoryName,
                'type' => 'Expense',
                'debit' => 0,
                'credit' => floatval($expense->amount),
                'created_at' => $expense->created_at,
            ];
        });
        $transactions = $transactions->merge($expenses);

        // 4. Purchase Orders (COGS - Credits)
        $poQuery = PurchaseOrder::with('supplier')
            ->whereIn('status', ['received', 'completed', 'partial']);
        
        if ($startDate) $poQuery->whereDate('created_at', '>=', $startDate);
        if ($endDate) $poQuery->whereDate('created_at', '<=', $endDate);
        
        $purchases = $poQuery->get()->map(function ($po) {
            return [
                'id' => 'PO-' . $po->id,
                'date' => $po->created_at->format('Y-m-d'),
                'reference' => $po->po_number ?? 'PO-' . str_pad($po->id, 4, '0', STR_PAD_LEFT),
                'description' => 'Purchase Order - ' . ($po->supplier->name ?? 'Supplier'),
                'category' => 'Cost of Goods Sold',
                'type' => 'Expense',
                'debit' => 0,
                'credit' => floatval($po->total_amount),
                'created_at' => $po->created_at,
            ];
        });
        $transactions = $transactions->merge($purchases);

        // Sort by date descending
        $transactions = $transactions->sortByDesc('created_at')->values();

        // Apply filters
        if ($category) {
            $transactions = $transactions->filter(fn($t) => $t['category'] === $category)->values();
        }
        if ($type) {
            $transactions = $transactions->filter(fn($t) => $t['type'] === $type)->values();
        }

        // Calculate running balance
        $balance = 0;
        $transactions = $transactions->reverse()->map(function ($t) use (&$balance) {
            $balance += $t['debit'] - $t['credit'];
            $t['balance'] = $balance;
            return $t;
        })->reverse()->values();

        // Calculate totals
        $totalRevenue = $transactions->sum('debit');
        $totalExpenses = $transactions->sum('credit');
        $netBalance = $totalRevenue - $totalExpenses;

        return response()->json([
            'transactions' => $transactions,
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'net_balance' => $netBalance,
                'transaction_count' => $transactions->count(),
            ],
            'categories' => $transactions->pluck('category')->unique()->values(),
        ]);
    }

    /**
     * Get Profit & Loss statement
     */
    public function profitAndLoss(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));
        $period = $request->input('period', 'monthly'); // monthly, quarterly, yearly

        // Current period data
        $revenue = $this->calculateRevenue($startDate, $endDate);
        $cogs = $this->calculateCOGS($startDate, $endDate);
        $expenses = $this->calculateExpenses($startDate, $endDate);
        $payroll = $this->calculatePayroll($startDate, $endDate);

        $grossProfit = $revenue['total'] - $cogs['total'];
        $operatingProfit = $grossProfit - $expenses['total'] - $payroll['total'];
        // Net profit = Operating profit (no hardcoded tax deduction)
        // VAT/Tax is handled separately in POS and VAT Report
        $netProfit = $operatingProfit;

        // Monthly trend data (last 6 months)
        $monthlyData = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();
            
            $monthRevenue = $this->calculateRevenue($monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d'));
            $monthCogs = $this->calculateCOGS($monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d'));
            $monthExpenses = $this->calculateExpenses($monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d'));
            $monthPayroll = $this->calculatePayroll($monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d'));
            
            $monthProfit = $monthRevenue['total'] - $monthCogs['total'] - $monthExpenses['total'] - $monthPayroll['total'];
            
            $monthlyData[] = [
                'month' => $monthStart->format('M Y'),
                'revenue' => $monthRevenue['total'],
                'cogs' => $monthCogs['total'],
                'expenses' => $monthExpenses['total'],
                'payroll' => $monthPayroll['total'],
                'profit' => $monthProfit,
            ];
        }

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'label' => Carbon::parse($startDate)->format('M Y'),
            ],
            'current_month' => [
                'revenue' => $revenue,
                'cogs' => $cogs,
                'gross_profit' => $grossProfit,
                'operating_expenses' => $expenses,
                'payroll' => $payroll,
                'operating_profit' => $operatingProfit,
                'net_profit' => $netProfit,
            ],
            'monthly_trend' => $monthlyData,
            'margins' => [
                'gross_margin' => $revenue['total'] > 0 ? round(($grossProfit / $revenue['total']) * 100, 1) : 0,
                'operating_margin' => $revenue['total'] > 0 ? round(($operatingProfit / $revenue['total']) * 100, 1) : 0,
                'net_margin' => $revenue['total'] > 0 ? round(($netProfit / $revenue['total']) * 100, 1) : 0,
            ],
        ]);
    }

    /**
     * Get Balance Sheet
     */
    public function balanceSheet(Request $request)
    {
        $asOfDate = $request->input('as_of_date', Carbon::now()->format('Y-m-d'));

        // ASSETS
        // Cash & Cash Equivalents (Payments received)
        $cashReceived = Payment::whereDate('payment_date', '<=', $asOfDate)->sum('amount');
        $cashPaidOut = Expense::whereDate('expense_date', '<=', $asOfDate)->sum('amount');
        $poPaid = PurchaseOrder::whereIn('status', ['received', 'completed', 'partial'])
            ->whereDate('created_at', '<=', $asOfDate)
            ->sum('total_amount');
        $cashBalance = $cashReceived - $cashPaidOut - $poPaid;

        // Accounts Receivable (Unpaid sales)
        $totalSales = SalesOrder::where('status', 'completed')
            ->whereDate('created_at', '<=', $asOfDate)
            ->sum('total_amount');
        $accountsReceivable = $totalSales - $cashReceived;
        $accountsReceivable = max(0, $accountsReceivable);

        // Inventory (from inventory table joined with products for selling price)
        $inventory = DB::table('inventory')
            ->join('products', 'inventory.product_id', '=', 'products.id')
            ->where('products.is_active', true)
            ->sum(DB::raw('COALESCE(inventory.quantity, 0) * COALESCE(products.selling_price, 0)'));

        $totalCurrentAssets = $cashBalance + $accountsReceivable + $inventory;

        // Fixed Assets from Asset module
        $fixedAssets = Asset::where('status', 'active')
            ->whereDate('purchase_date', '<=', $asOfDate)
            ->sum('current_value');
        
        // Get assets by category for detailed breakdown
        $assetsByCategory = Asset::where('status', 'active')
            ->whereDate('purchase_date', '<=', $asOfDate)
            ->select('category', DB::raw('SUM(current_value) as value'), DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        $totalAssets = $totalCurrentAssets + $fixedAssets;

        // LIABILITIES
        // Accounts Payable (Unpaid purchase orders)
        $accountsPayable = PurchaseOrder::whereIn('status', ['pending', 'approved', 'ordered'])
            ->whereDate('created_at', '<=', $asOfDate)
            ->sum('total_amount');

        // VAT Payable (7.5% of sales - 7.5% of purchases as input credit)
        $vatOnSales = $totalSales * 0.075;
        $vatOnPurchases = PurchaseOrder::whereIn('status', ['received', 'completed', 'partial'])
            ->whereDate('created_at', '<=', $asOfDate)
            ->sum('total_amount') * 0.075;
        $vatPayable = max(0, $vatOnSales - $vatOnPurchases);

        // Accrued Expenses (Placeholder)
        $accruedExpenses = 0;

        $totalCurrentLiabilities = $accountsPayable + $vatPayable + $accruedExpenses;

        // Get Liabilities from Liability module (Short-term)
        $shortTermLiabilities = Liability::where('status', 'active')
            ->where('type', 'short_term')
            ->whereDate('start_date', '<=', $asOfDate)
            ->sum('current_balance');

        // Add short-term liabilities to current liabilities
        $totalCurrentLiabilities += $shortTermLiabilities;

        // Long-term Liabilities from Liability module
        $longTermLiabilities = Liability::where('status', 'active')
            ->where('type', 'long_term')
            ->whereDate('start_date', '<=', $asOfDate)
            ->sum('current_balance');

        // Get liabilities by category for detailed breakdown
        $liabilitiesByCategory = Liability::where('status', 'active')
            ->whereDate('start_date', '<=', $asOfDate)
            ->select('category', 'type', DB::raw('SUM(current_balance) as balance'), DB::raw('COUNT(*) as count'))
            ->groupBy('category', 'type')
            ->get();

        $totalLiabilities = $totalCurrentLiabilities + $longTermLiabilities;

        // EQUITY
        // Calculate retained earnings from all-time profit
        $allTimeRevenue = SalesOrder::where('status', 'completed')->sum('total_amount');
        $allTimeCogs = PurchaseOrder::whereIn('status', ['received', 'completed', 'partial'])->sum('total_amount');
        $allTimeExpenses = Expense::sum('amount');
        $retainedEarnings = $allTimeRevenue - $allTimeCogs - $allTimeExpenses;

        // Opening capital (Placeholder - would be set during company setup)
        $openingCapital = 0;

        $totalEquity = $openingCapital + $retainedEarnings;

        // Balance check
        $totalLiabilitiesAndEquity = $totalLiabilities + $totalEquity;

        return response()->json([
            'as_of_date' => $asOfDate,
            'assets' => [
                'current_assets' => [
                    'cash_and_equivalents' => max(0, $cashBalance),
                    'accounts_receivable' => $accountsReceivable,
                    'inventory' => $inventory,
                    'total' => $totalCurrentAssets,
                ],
                'fixed_assets' => [
                    'property_equipment' => $fixedAssets,
                    'by_category' => $assetsByCategory,
                    'total' => $fixedAssets,
                ],
                'total_assets' => $totalAssets,
            ],
            'liabilities' => [
                'current_liabilities' => [
                    'accounts_payable' => $accountsPayable,
                    'vat_payable' => $vatPayable,
                    'accrued_expenses' => $accruedExpenses,
                    'short_term_loans' => $shortTermLiabilities,
                    'total' => $totalCurrentLiabilities,
                ],
                'long_term_liabilities' => [
                    'loans' => $longTermLiabilities,
                    'by_category' => $liabilitiesByCategory,
                    'total' => $longTermLiabilities,
                ],
                'total_liabilities' => $totalLiabilities,
            ],
            'equity' => [
                'opening_capital' => $openingCapital,
                'retained_earnings' => $retainedEarnings,
                'total_equity' => $totalEquity,
            ],
            'total_liabilities_and_equity' => $totalLiabilitiesAndEquity,
            'is_balanced' => abs($totalAssets - $totalLiabilitiesAndEquity) < 0.01,
        ]);
    }

    /**
     * Get VAT Report
     */
    public function vatReport(Request $request)
    {
        $month = $request->input('month', Carbon::now()->month);
        $year = $request->input('year', Carbon::now()->year);

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        $vatRate = 7.5;

        // Output VAT (Sales)
        $salesOrders = SalesOrder::with('customer')
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $outputVat = $salesOrders->map(function ($order) use ($vatRate) {
            $taxableAmount = floatval($order->total_amount);
            $vatAmount = $taxableAmount * ($vatRate / 100);
            return [
                'id' => $order->id,
                'date' => $order->created_at->format('Y-m-d'),
                'reference' => $order->order_number ?? 'INV-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'customer' => $order->customer->business_name ?? $order->customer->name ?? 'Customer',
                'taxable_amount' => $taxableAmount,
                'vat_rate' => $vatRate,
                'vat_amount' => round($vatAmount, 2),
            ];
        });

        // Input VAT (Purchases & Expenses)
        $purchaseOrders = PurchaseOrder::with('supplier')
            ->whereIn('status', ['received', 'completed', 'partial'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $inputVatPurchases = $purchaseOrders->map(function ($po) use ($vatRate) {
            $taxableAmount = floatval($po->total_amount);
            $vatAmount = $taxableAmount * ($vatRate / 100);
            return [
                'id' => 'PO-' . $po->id,
                'date' => $po->created_at->format('Y-m-d'),
                'reference' => $po->po_number ?? 'PO-' . str_pad($po->id, 4, '0', STR_PAD_LEFT),
                'supplier' => $po->supplier->name ?? 'Supplier',
                'taxable_amount' => $taxableAmount,
                'vat_rate' => $vatRate,
                'vat_amount' => round($vatAmount, 2),
            ];
        });

        // VATable expenses
        $expenses = Expense::with('category')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->get();

        $inputVatExpenses = $expenses->map(function ($expense) use ($vatRate) {
            $taxableAmount = floatval($expense->amount);
            $vatAmount = $taxableAmount * ($vatRate / 100);
            return [
                'id' => 'EXP-' . $expense->id,
                'date' => $expense->expense_date ?? $expense->created_at->format('Y-m-d'),
                'reference' => $expense->reference_number ?? 'EXP-' . str_pad($expense->id, 3, '0', STR_PAD_LEFT),
                'supplier' => $expense->vendor ?? ($expense->category->name ?? 'Vendor'),
                'taxable_amount' => $taxableAmount,
                'vat_rate' => $vatRate,
                'vat_amount' => round($vatAmount, 2),
            ];
        });

        $inputVat = $inputVatPurchases->merge($inputVatExpenses);

        // Calculate totals
        $outputTotal = $outputVat->sum('vat_amount');
        $outputTaxableTotal = $outputVat->sum('taxable_amount');
        $inputTotal = $inputVat->sum('vat_amount');
        $inputTaxableTotal = $inputVat->sum('taxable_amount');
        $netVat = $outputTotal - $inputTotal;

        return response()->json([
            'period' => [
                'month' => $month,
                'year' => $year,
                'label' => $startDate->format('F Y'),
            ],
            'output_vat' => $outputVat->values(),
            'input_vat' => $inputVat->values(),
            'summary' => [
                'output_taxable_total' => $outputTaxableTotal,
                'output_vat_total' => $outputTotal,
                'input_taxable_total' => $inputTaxableTotal,
                'input_vat_total' => $inputTotal,
                'net_vat_payable' => $netVat,
                'vat_rate' => $vatRate,
            ],
        ]);
    }

    /**
     * Helper: Calculate revenue
     */
    private function calculateRevenue($startDate, $endDate)
    {
        $salesRevenue = SalesOrder::where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->sum('total_amount');

        return [
            'sales_revenue' => floatval($salesRevenue),
            'other_income' => 0,
            'total' => floatval($salesRevenue),
        ];
    }

    /**
     * Helper: Calculate COGS
     */
    private function calculateCOGS($startDate, $endDate)
    {
        $rawMaterials = PurchaseOrder::whereIn('status', ['received', 'completed', 'partial'])
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->sum('total_amount');

        return [
            'raw_materials' => floatval($rawMaterials),
            'production_labor' => 0,
            'production_overhead' => 0,
            'total' => floatval($rawMaterials),
        ];
    }

    /**
     * Helper: Calculate operating expenses
     */
    private function calculateExpenses($startDate, $endDate)
    {
        $expenses = Expense::with('category')
            ->whereDate('expense_date', '>=', $startDate)
            ->whereDate('expense_date', '<=', $endDate)
            ->get();

        // Group by category
        $byCategory = $expenses->groupBy(function ($e) {
            return $e->category->name ?? $e->expense_type ?? 'Other';
        })->map(fn($group) => $group->sum('amount'));

        $total = $expenses->sum('amount');

        return [
            'breakdown' => $byCategory,
            'total' => floatval($total),
        ];
    }

    /**
     * Helper: Calculate payroll (from payroll expenses)
     */
    private function calculatePayroll($startDate, $endDate)
    {
        // Look for expenses categorized as payroll/salary
        $payrollExpenses = Expense::with('category')
            ->whereDate('expense_date', '>=', $startDate)
            ->whereDate('expense_date', '<=', $endDate)
            ->whereHas('category', function ($q) {
                $q->whereIn('name', ['Payroll', 'Salary', 'Salaries', 'Wages', 'Staff Salaries']);
            })
            ->sum('amount');

        return [
            'salaries' => floatval($payrollExpenses),
            'allowances' => 0,
            'deductions' => 0,
            'total' => floatval($payrollExpenses),
        ];
    }
}
