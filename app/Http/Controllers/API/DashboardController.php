<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\ProductionRun;
use App\Models\Customer;
use App\Models\PurchaseOrder;
use App\Models\AuditLog;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get main dashboard KPIs
     */
    public function kpiSummary()
    {
        $tenantId = Auth::user()->tenant_id;
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // Revenue this month (from fulfilled/approved sales orders)
        $revenueThisMonth = SalesOrder::where('tenant_id', $tenantId)
            ->whereIn('status', ['approved', 'fulfilled', 'completed'])
            ->where('created_at', '>=', $currentMonth)
            ->sum('total_amount');

        $revenueLastMonth = SalesOrder::where('tenant_id', $tenantId)
            ->whereIn('status', ['approved', 'fulfilled', 'completed'])
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('total_amount');

        $revenueChange = $revenueLastMonth > 0 
            ? round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1)
            : 0;

        // Production output this month
        $productionOutput = ProductionRun::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $currentMonth)
            ->sum('actual_output');

        $productionLoss = ProductionRun::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $currentMonth)
            ->sum('wastage_quantity');

        $avgLoss = $productionOutput > 0 
            ? round(($productionLoss / ($productionOutput + $productionLoss)) * 100, 1) 
            : 0;

        // Outstanding receivables
        $receivables = Customer::where('tenant_id', $tenantId)
            ->sum('outstanding_balance');

        $overdueCount = Customer::where('tenant_id', $tenantId)
            ->where('outstanding_balance', '>', 0)
            ->where('credit_blocked', true)
            ->count();

        // Expenses this month
        $expensesThisMonth = Expense::where('tenant_id', $tenantId)
            ->where('status', 'approved')
            ->where('created_at', '>=', $currentMonth)
            ->sum('amount');

        $pendingExpenses = Expense::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'revenue' => [
                    'amount' => $revenueThisMonth,
                    'change' => $revenueChange,
                    'month' => Carbon::now()->format('M'),
                ],
                'production' => [
                    'output' => $productionOutput,
                    'avg_loss' => $avgLoss,
                ],
                'receivables' => [
                    'amount' => $receivables,
                    'overdue_count' => $overdueCount,
                ],
                'expenses' => [
                    'amount' => $expensesThisMonth,
                    'pending_count' => $pendingExpenses,
                ],
            ]
        ]);
    }

    /**
     * Get today's snapshot stats
     */
    public function todaySnapshot()
    {
        $tenantId = Auth::user()->tenant_id;
        $today = Carbon::today();

        // Sales orders today
        $salesCount = SalesOrder::where('tenant_id', $tenantId)
            ->whereDate('created_at', $today)
            ->count();

        $salesTotal = SalesOrder::where('tenant_id', $tenantId)
            ->whereDate('created_at', $today)
            ->sum('total_amount');

        // Payments collected today
        $paymentsCollected = Payment::where('tenant_id', $tenantId)
            ->whereDate('payment_date', $today)
            ->where('payment_type', 'receivable')
            ->where('status', 'completed')
            ->sum('amount');

        // POS transactions today
        $posCount = SalesOrder::where('tenant_id', $tenantId)
            ->whereDate('created_at', $today)
            ->where('source', 'pos')
            ->count();

        // Pending tickets (expenses)
        $pendingTickets = Expense::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->count();

        // Production runs today
        $productionRuns = ProductionRun::where('tenant_id', $tenantId)
            ->whereIn('status', ['in_progress', 'completed'])
            ->whereDate('production_date', $today)
            ->count();

        $productionOutput = ProductionRun::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereDate('completed_at', $today)
            ->sum('actual_output');

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $today->format('l, F j, Y'),
                'sales_count' => $salesCount,
                'sales_total' => $salesTotal,
                'payments_collected' => $paymentsCollected,
                'pos_transactions' => $posCount,
                'tickets_pending' => $pendingTickets,
                'production_runs' => $productionRuns,
                'production_output' => $productionOutput,
            ]
        ]);
    }

    /**
     * Get sales trend for last 7 days
     */
    public function salesTrend()
    {
        $tenantId = Auth::user()->tenant_id;
        $data = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $sales = SalesOrder::where('tenant_id', $tenantId)
                ->whereDate('created_at', $date)
                ->whereIn('status', ['approved', 'fulfilled', 'completed', 'pending'])
                ->sum('total_amount');

            $data[] = [
                'date' => $date->format('M d'),
                'sales' => $sales,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get revenue vs expenses for last 5 months
     */
    public function revenueExpenses()
    {
        $tenantId = Auth::user()->tenant_id;
        $data = [];

        for ($i = 4; $i >= 0; $i--) {
            $startOfMonth = Carbon::now()->subMonths($i)->startOfMonth();
            $endOfMonth = Carbon::now()->subMonths($i)->endOfMonth();

            $revenue = SalesOrder::where('tenant_id', $tenantId)
                ->whereIn('status', ['approved', 'fulfilled', 'completed'])
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('total_amount');

            $expenses = Expense::where('tenant_id', $tenantId)
                ->where('status', 'approved')
                ->whereBetween('expense_date', [$startOfMonth, $endOfMonth])
                ->sum('amount');

            $data[] = [
                'month' => $startOfMonth->format('M'),
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $revenue - $expenses,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get production output for last 5 days
     */
    public function productionHistory()
    {
        $tenantId = Auth::user()->tenant_id;
        $data = [];

        for ($i = 4; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);

            $output = ProductionRun::where('tenant_id', $tenantId)
                ->where('status', 'completed')
                ->whereDate('completed_at', $date)
                ->sum('actual_output');

            $loss = ProductionRun::where('tenant_id', $tenantId)
                ->where('status', 'completed')
                ->whereDate('completed_at', $date)
                ->sum('wastage_quantity');

            $data[] = [
                'date' => $date->format('M d'),
                'output' => $output,
                'loss' => $loss,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get recent activities from audit log
     */
    public function recentActivities()
    {
        $tenantId = Auth::user()->tenant_id;

        $activities = AuditLog::with('user:id,name')
            ->whereHas('user', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->whereIn('action', ['CREATE', 'APPROVE', 'PAYMENT', 'PRODUCTION'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                $icon = match($log->action) {
                    'PRODUCTION' => '⚙️',
                    'PAYMENT' => '💰',
                    'CREATE' => $this->getEntityIcon($log->auditable_type_display),
                    'APPROVE' => '✅',
                    default => '📋'
                };

                $action = match($log->action) {
                    'PRODUCTION' => 'Completed production run',
                    'PAYMENT' => 'Recorded payment',
                    'CREATE' => 'Created ' . strtolower($log->auditable_type_display ?? 'record'),
                    'APPROVE' => 'Approved ' . strtolower($log->auditable_type_display ?? 'item'),
                    default => strtolower($log->action)
                };

                return [
                    'id' => $log->id,
                    'user' => $log->user?->name ?? 'System',
                    'action' => $action,
                    'entity' => $log->auditable_reference ?? "#{$log->auditable_id}",
                    'time' => Carbon::parse($log->created_at)->diffForHumans(),
                    'type' => strtolower($log->action),
                    'icon' => $icon,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }

    private function getEntityIcon($entityType)
    {
        return match($entityType) {
            'SalesOrder' => '📋',
            'PurchaseOrder' => '📦',
            'Expense' => '💳',
            'Payment' => '💰',
            'Production', 'ProductionRun' => '⚙️',
            'Customer' => '👤',
            'Product' => '📦',
            default => '📄'
        };
    }

    /**
     * Get credit alerts (high usage customers)
     */
    public function creditAlerts()
    {
        $tenantId = Auth::user()->tenant_id;

        $alerts = Customer::where('tenant_id', $tenantId)
            ->where('credit_limit', '>', 0)
            ->whereRaw('outstanding_balance >= credit_limit * 0.8')
            ->orderByRaw('outstanding_balance / credit_limit DESC')
            ->limit(5)
            ->get()
            ->map(function ($customer) {
                $usage = $customer->credit_limit > 0 
                    ? round(($customer->outstanding_balance / $customer->credit_limit) * 100)
                    : 0;

                return [
                    'id' => $customer->id,
                    'customer' => $customer->name,
                    'credit_limit' => $customer->credit_limit,
                    'credit_used' => $customer->outstanding_balance,
                    'status' => $customer->credit_blocked ? 'blocked' : ($usage >= 100 ? 'blocked' : 'high_usage'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $alerts
        ]);
    }

    /**
     * Get pending items counts
     */
    public function pendingItems()
    {
        $tenantId = Auth::user()->tenant_id;

        $pendingSales = SalesOrder::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->count();

        $pendingExpenses = Expense::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->count();

        $pendingPurchases = PurchaseOrder::where('tenant_id', $tenantId)
            ->whereIn('status', ['approved', 'partial'])
            ->count();

        $inProgressProduction = ProductionRun::where('tenant_id', $tenantId)
            ->where('status', 'in_progress')
            ->count();

        $overduePayments = Customer::where('tenant_id', $tenantId)
            ->where('outstanding_balance', '>', 0)
            ->where('credit_blocked', true)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                ['label' => 'Sales orders pending approval', 'count' => $pendingSales, 'path' => '/sales-orders', 'color' => 'blue'],
                ['label' => 'Expenses awaiting approval', 'count' => $pendingExpenses, 'path' => '/expenses', 'color' => 'orange'],
                ['label' => 'Purchase orders to receive', 'count' => $pendingPurchases, 'path' => '/purchase-orders', 'color' => 'purple'],
                ['label' => 'Production runs in progress', 'count' => $inProgressProduction, 'path' => '/production', 'color' => 'green'],
                ['label' => 'Overdue customer payments', 'count' => $overduePayments, 'path' => '/customers', 'color' => 'red'],
            ]
        ]);
    }

    /**
     * Get P&L summary for current month
     */
    public function plSummary()
    {
        $tenantId = Auth::user()->tenant_id;
        $currentMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // Revenue
        $revenue = SalesOrder::where('tenant_id', $tenantId)
            ->whereIn('status', ['approved', 'fulfilled', 'completed'])
            ->whereBetween('created_at', [$currentMonth, $endOfMonth])
            ->sum('total_amount');

        // COGS (estimated at 60% of revenue for now - ideally from production costs)
        $cogs = $revenue * 0.60;

        // Expenses
        $expenses = Expense::where('tenant_id', $tenantId)
            ->where('status', 'approved')
            ->whereBetween('expense_date', [$currentMonth, $endOfMonth])
            ->sum('amount');

        // Payroll (from payroll runs)
        $payroll = DB::table('payroll_runs')
            ->where('tenant_id', $tenantId)
            ->whereBetween('period_start', [$currentMonth, $endOfMonth])
            ->where('status', 'paid')
            ->sum('gross_amount');

        $netProfit = $revenue - $cogs - $expenses - $payroll;

        return response()->json([
            'success' => true,
            'data' => [
                'month' => Carbon::now()->format('F'),
                'revenue' => $revenue,
                'cogs' => $cogs,
                'expenses' => $expenses,
                'payroll' => $payroll,
                'net_profit' => $netProfit,
            ]
        ]);
    }
}
