<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PayrollRun;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PayrollController extends Controller
{
    /**
     * Display a listing of payroll runs
     */
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        
        $query = DB::table('payroll_runs')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by year
        if ($request->filled('year')) {
            $query->whereYear('period_start', $request->year);
        }

        $runs = $query->get();

        // Get items for each run
        foreach ($runs as $run) {
            $run->items = DB::table('payroll_items')
                ->join('staff', 'payroll_items.staff_id', '=', 'staff.id')
                ->where('payroll_items.payroll_run_id', $run->id)
                ->select(
                    'payroll_items.*',
                    'staff.first_name',
                    'staff.last_name',
                    'staff.department',
                    'staff.staff_number as staff_emp_number'
                )
                ->get();
        }

        return response()->json($runs);
    }

    /**
     * Store a newly created payroll run
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2099',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id;

        $month = $request->month;
        $year = $request->year;

        // Calculate period dates
        $periodStart = Carbon::create($year, $month, 1)->startOfMonth();
        $periodEnd = Carbon::create($year, $month, 1)->endOfMonth();
        $paymentDate = $periodEnd->copy();
        $periodName = $periodStart->format('F Y');
        $payrollNumber = 'PAY-' . $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT);

        // Check if payroll run already exists for this period
        $exists = DB::table('payroll_runs')
            ->where('tenant_id', $tenantId)
            ->where('payroll_number', $payrollNumber)
            ->whereNull('deleted_at')
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Payroll run already exists for this period'], 400);
        }

        // Get all active staff
        $staff = DB::table('staff')
            ->where('tenant_id', $tenantId)
            ->where('employment_status', 'active')
            ->where('is_active', true)
            ->get();

        if ($staff->isEmpty()) {
            return response()->json(['message' => 'No active staff found'], 400);
        }

        // Calculate totals
        $totalGross = 0;
        $totalDeductions = 0;

        $itemsData = [];
        foreach ($staff as $member) {
            $housing = (float) ($member->housing_allowance ?? 0);
            $transport = (float) ($member->transport_allowance ?? 0);
            $otherAllowances = (float) ($member->other_allowances ?? 0);
            $basic = (float) ($member->basic_salary ?? 0);
            $grossPay = $basic + $housing + $transport + $otherAllowances;
            $deductions = 0;
            $netPay = $grossPay - $deductions;

            $totalGross += $grossPay;
            $totalDeductions += $deductions;

            $itemsData[] = [
                'staff_id' => $member->id,
                'staff_number' => $member->staff_number ?? '',
                'staff_name' => trim(($member->first_name ?? '') . ' ' . ($member->last_name ?? '')),
                'position' => $member->position ?? '',
                'basic_salary' => $basic,
                'housing_allowance' => $housing,
                'transport_allowance' => $transport,
                'meal_allowance' => 0,
                'overtime_pay' => 0,
                'bonus' => 0,
                'commission' => 0,
                'other_earnings' => $otherAllowances,
                'gross_pay' => $grossPay,
                'tax_deduction' => 0,
                'pension_deduction' => 0,
                'health_insurance' => 0,
                'loan_deduction' => 0,
                'advance_deduction' => 0,
                'other_deductions' => 0,
                'total_deductions' => $deductions,
                'net_pay' => $netPay,
                'days_worked' => $periodEnd->day,
                'days_absent' => 0,
                'overtime_hours' => 0,
                'bank_name' => $member->bank_name ?? null,
                'account_number' => $member->account_number ?? null,
                'notes' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $totalNet = $totalGross - $totalDeductions;

        // Create payroll run
        $runId = DB::table('payroll_runs')->insertGetId([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'payroll_number' => $payrollNumber,
            'payroll_period' => $periodName,
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'payment_date' => $paymentDate->toDateString(),
            'frequency' => 'monthly',
            'staff_count' => $staff->count(),
            'total_gross_pay' => $totalGross,
            'total_deductions' => $totalDeductions,
            'total_net_pay' => $totalNet,
            'status' => 'draft',
            'notes' => null,
            'prepared_by' => Auth::id(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create payroll items for each staff
        foreach ($itemsData as $item) {
            $item['payroll_run_id'] = $runId;
            DB::table('payroll_items')->insert($item);
        }

        return response()->json([
            'message' => 'Payroll run created successfully',
            'data' => [
                'id' => $runId,
                'payroll_number' => $payrollNumber,
                'payroll_period' => $periodName,
                'staff_count' => $staff->count(),
                'total_gross_pay' => $totalGross,
                'total_net_pay' => $totalNet,
            ]
        ], 201);
    }

    /**
     * Display the specified payroll run
     */
    public function show($id)
    {
        $run = DB::table('payroll_runs')
            ->where('id', $id)
            ->where('tenant_id', Auth::user()->tenant_id)
            ->first();

        if (!$run) {
            return response()->json(['message' => 'Payroll run not found'], 404);
        }

        $items = DB::table('payroll_items')
            ->join('staff', 'payroll_items.staff_id', '=', 'staff.id')
            ->where('payroll_items.payroll_run_id', $id)
            ->select(
                'payroll_items.*',
                'staff.first_name',
                'staff.last_name',
                'staff.department',
                'staff.staff_number as staff_emp_number',
                'staff.bank_name as staff_bank_name',
                'staff.account_number as staff_account_number',
                'staff.account_name as staff_account_name'
            )
            ->get();

        $run->items = $items;

        return response()->json(['data' => $run]);
    }

    /**
     * Approve payroll run
     */
    public function approve(Request $request, $id)
    {
        $run = PayrollRun::where('id', $id)
            ->where('tenant_id', Auth::user()->tenant_id)
            ->first();

        if (!$run) {
            return response()->json(['message' => 'Payroll run not found'], 404);
        }

        if ($run->status !== 'processing' && $run->status !== 'draft') {
            return response()->json(['message' => 'Payroll run cannot be approved in current status'], 400);
        }

        $run->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        // Log custom APPROVE action
        $run->logCustomAudit('APPROVE', null, [
            'approved_by' => Auth::user()->name,
            'total_net_pay' => $run->total_net_pay,
            'staff_count' => $run->staff_count,
        ]);

        return response()->json(['message' => 'Payroll run approved successfully']);
    }

    /**
     * Process payroll run
     */
    public function process(Request $request, $id)
    {
        $run = PayrollRun::where('id', $id)
            ->where('tenant_id', Auth::user()->tenant_id)
            ->first();

        if (!$run) {
            return response()->json(['message' => 'Payroll run not found'], 404);
        }

        if ($run->status !== 'draft') {
            return response()->json(['message' => 'Only draft payroll runs can be processed'], 400);
        }

        $run->update([
            'status' => 'processing',
        ]);

        return response()->json(['message' => 'Payroll run is now processing']);
    }

    /**
     * Mark payroll as paid
     */
    public function markPaid(Request $request, $id)
    {
        $run = PayrollRun::where('id', $id)
            ->where('tenant_id', Auth::user()->tenant_id)
            ->first();

        if (!$run) {
            return response()->json(['message' => 'Payroll run not found'], 404);
        }

        if ($run->status !== 'approved') {
            return response()->json(['message' => 'Payroll must be approved before marking as paid'], 400);
        }

        $run->update([
            'status' => 'paid',
            'paid_by' => Auth::id(),
            'paid_at' => now(),
        ]);

        // Log custom PAYMENT action
        $run->logCustomAudit('PAYMENT', 'Payroll marked as paid', [
            'paid_by' => Auth::user()->name,
            'total_net_pay' => $run->total_net_pay,
            'staff_count' => $run->staff_count,
        ]);

        return response()->json(['message' => 'Payroll marked as paid']);
    }

    /**
     * Get payroll summary
     */
    public function summary(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        $year = $request->get('year', date('Y'));

        $runs = DB::table('payroll_runs')
            ->where('tenant_id', $tenantId)
            ->whereYear('period_start', $year)
            ->whereNull('deleted_at')
            ->get();

        $summary = [
            'year' => $year,
            'total_runs' => $runs->count(),
            'total_paid' => $runs->where('status', 'paid')->sum('total_net_pay'),
            'pending_runs' => $runs->whereIn('status', ['draft', 'processing'])->count(),
            'total_staff' => $runs->max('staff_count') ?? 0,
            'last_run' => $runs->sortByDesc('created_at')->first(),
            'monthly_breakdown' => [],
        ];

        for ($month = 1; $month <= 12; $month++) {
            $run = $runs->first(function ($r) use ($month) {
                return Carbon::parse($r->period_start)->month === $month;
            });
            $summary['monthly_breakdown'][] = [
                'month' => $month,
                'month_name' => Carbon::create($year, $month, 1)->format('F'),
                'status' => $run->status ?? null,
                'total_net_pay' => $run->total_net_pay ?? 0,
            ];
        }

        return response()->json(['data' => $summary]);
    }

    /**
     * Get payslip for a staff member
     */
    public function payslip($runId, $staffId)
    {
        $item = DB::table('payroll_items')
            ->join('payroll_runs', 'payroll_items.payroll_run_id', '=', 'payroll_runs.id')
            ->join('staff', 'payroll_items.staff_id', '=', 'staff.id')
            ->where('payroll_items.payroll_run_id', $runId)
            ->where('payroll_items.staff_id', $staffId)
            ->where('payroll_runs.tenant_id', Auth::user()->tenant_id)
            ->select(
                'payroll_items.*',
                'payroll_runs.payroll_number',
                'payroll_runs.payroll_period',
                'payroll_runs.period_start',
                'payroll_runs.period_end',
                'staff.first_name',
                'staff.last_name',
                'staff.staff_number as staff_emp_number',
                'staff.department',
                'staff.position as staff_position',
                'staff.bank_name as staff_bank_name',
                'staff.account_number as staff_account_number',
                'staff.account_name as staff_account_name'
            )
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Payslip not found'], 404);
        }

        return response()->json(['data' => $item]);
    }
}
