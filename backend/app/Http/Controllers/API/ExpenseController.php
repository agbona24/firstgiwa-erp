<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Expense::with(['category', 'creator', 'approver', 'branch']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('expense_number', 'like', "%{$search}%")
                    ->orWhere('vendor_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Category filter
        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->input('category_id'));
        }

        // Branch filter - only apply if a specific branch is selected (not 'all' or empty)
        if ($request->filled('branch_id') && $request->input('branch_id') !== 'all') {
            $branchId = $request->input('branch_id');
            // Include expenses with null branch_id (company-wide) or matching branch_id
            $query->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id');
            });
        }

        // Date range filter
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('expense_date', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        }

        // Recurring filter
        if ($request->has('is_recurring')) {
            $query->where('is_recurring', $request->boolean('is_recurring'));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'expense_date');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('per_page', 15);
        $expenses = $query->paginate($perPage);
        
        // Debug logging
        Log::info('ExpenseController@index', [
            'count' => $expenses->count(),
            'total' => $expenses->total(),
            'sql' => $query->toSql(),
        ]);

        return response()->json($expenses);
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'branch_id' => 'nullable|exists:branches,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'nullable|string|in:cash,bank_transfer,card,cheque',
            'payment_reference' => 'nullable|string|max:100',
            'vendor_name' => 'nullable|string|max:255',
            'receipt_number' => 'nullable|string|max:100',
            'receipt_url' => 'nullable|url|max:500',
            'is_recurring' => 'boolean',
            'recurring_frequency' => 'nullable|required_if:is_recurring,true|in:monthly,quarterly,yearly',
        ]);

        $validated['expense_number'] = Expense::generateExpenseNumber();
        $validated['created_by'] = $request->user()->id;
        $validated['tenant_id'] = $request->user()->tenant_id;
        $validated['status'] = 'pending';

        // Check if auto-approval is possible based on global settings
        $globalRequireApproval = Setting::get('approvals', 'expense_require_approval', true);
        $globalThreshold = Setting::get('approvals', 'expense_threshold', 100000);
        
        // Category-specific settings (if set)
        $category = ExpenseCategory::find($validated['expense_category_id']);
        $categoryRequiresApproval = $category->requires_approval ?? true;
        $categoryThreshold = $category->approval_threshold ?? $globalThreshold;
        
        // Auto-approve if:
        // 1. Global approval is disabled, OR
        // 2. Category doesn't require approval, OR
        // 3. Amount is below the effective threshold (category threshold if set, else global)
        $effectiveThreshold = $category->approval_threshold ?? $globalThreshold;
        
        if (!$globalRequireApproval || !$categoryRequiresApproval || $validated['amount'] <= $effectiveThreshold) {
            $validated['status'] = 'approved';
            $validated['approved_by'] = $request->user()->id;
            $validated['approved_at'] = now();
        }

        $expense = Expense::create($validated);

        return response()->json([
            'message' => 'Expense created successfully',
            'data' => $expense->load(['category', 'creator']),
        ], 201);
    }

    /**
     * Display the specified expense.
     */
    public function show(int $id): JsonResponse
    {
        $expense = Expense::with(['category', 'creator', 'approver', 'branch'])
            ->findOrFail($id);

        return response()->json(['data' => $expense]);
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        // Cannot update approved or paid expenses
        if (in_array($expense->status, ['approved', 'paid'])) {
            return response()->json([
                'message' => 'Cannot update an approved or paid expense.',
            ], 422);
        }

        $validated = $request->validate([
            'expense_category_id' => 'sometimes|required|exists:expense_categories,id',
            'branch_id' => 'nullable|exists:branches,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'expense_date' => 'sometimes|required|date',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'payment_method' => 'nullable|string|in:cash,bank_transfer,card,cheque',
            'payment_reference' => 'nullable|string|max:100',
            'vendor_name' => 'nullable|string|max:255',
            'receipt_number' => 'nullable|string|max:100',
            'receipt_url' => 'nullable|url|max:500',
            'is_recurring' => 'boolean',
            'recurring_frequency' => 'nullable|in:monthly,quarterly,yearly',
        ]);

        $expense->update($validated);

        return response()->json([
            'message' => 'Expense updated successfully',
            'data' => $expense->fresh(['category', 'creator', 'approver']),
        ]);
    }

    /**
     * Remove the specified expense (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        // Cannot delete paid expenses
        if ($expense->status === 'paid') {
            return response()->json([
                'message' => 'Cannot delete a paid expense.',
            ], 422);
        }

        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully',
        ]);
    }

    /**
     * Approve an expense.
     */
    public function approve(Request $request, Expense $expense): JsonResponse
    {
        if ($expense->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending expenses can be approved.',
            ], 422);
        }

        $expense->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        // Log custom APPROVE action
        $expense->logCustomAudit('APPROVE', null, [
            'approved_by' => $request->user()->name,
            'amount' => $expense->amount,
        ]);

        return response()->json([
            'message' => 'Expense approved successfully',
            'data' => $expense->fresh(['category', 'creator', 'approver']),
        ]);
    }

    /**
     * Disapprove (revert to pending) an approved expense.
     */
    public function disapprove(Request $request, Expense $expense): JsonResponse
    {
        if ($expense->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved expenses can be disapproved.',
            ], 422);
        }

        $expense->update([
            'status' => 'pending',
            'approved_by' => null,
            'approved_at' => null,
        ]);

        // Log custom STATUS_CHANGE action
        $expense->logCustomAudit('STATUS_CHANGE', 'Reverted to pending', [
            'action' => 'disapprove',
            'performed_by' => $request->user()->name,
        ]);

        return response()->json([
            'message' => 'Expense reverted to pending',
            'data' => $expense->fresh(['category', 'creator']),
        ]);
    }

    /**
     * Reject an expense.
     */
    public function reject(Request $request, Expense $expense): JsonResponse
    {
        if ($expense->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending expenses can be rejected.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $expense->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'],
        ]);

        // Log custom REJECT action
        $expense->logCustomAudit('REJECT', $validated['reason'], [
            'rejected_by' => $request->user()->name,
            'amount' => $expense->amount,
        ]);

        return response()->json([
            'message' => 'Expense rejected successfully',
            'data' => $expense->fresh(['category', 'creator']),
        ]);
    }

    /**
     * Get pending expenses requiring approval.
     */
    public function pending(Request $request): JsonResponse
    {
        $query = Expense::with(['category', 'creator', 'branch'])
            ->where('status', 'pending');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        $expenses = $query->orderBy('expense_date', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($expenses);
    }

    /**
     * Get expense summary/statistics.
     */
    public function summary(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $summary = [
            'total_expenses' => Expense::whereBetween('expense_date', [$startDate, $endDate])
                ->whereIn('status', ['approved', 'paid'])
                ->sum('amount'),
            'pending_count' => Expense::where('status', 'pending')->count(),
            'pending_amount' => Expense::where('status', 'pending')->sum('amount'),
            'by_category' => Expense::with('category')
                ->whereBetween('expense_date', [$startDate, $endDate])
                ->whereIn('status', ['approved', 'paid'])
                ->select('expense_category_id', DB::raw('SUM(amount) as total'))
                ->groupBy('expense_category_id')
                ->get()
                ->map(fn($e) => [
                    'category' => $e->category->name ?? 'Unknown',
                    'total' => $e->total,
                ]),
            'by_payment_method' => Expense::whereBetween('expense_date', [$startDate, $endDate])
                ->whereIn('status', ['approved', 'paid'])
                ->select('payment_method', DB::raw('SUM(amount) as total'))
                ->groupBy('payment_method')
                ->pluck('total', 'payment_method'),
        ];

        return response()->json(['data' => $summary]);
    }

    /**
     * Get expense categories.
     */
    public function categories(Request $request): JsonResponse
    {
        $query = ExpenseCategory::query();

        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }

        if ($request->boolean('root_only')) {
            $query->whereNull('parent_id');
        }

        $categories = $query->with('children')->get();

        return response()->json(['data' => $categories]);
    }

    /**
     * Store a new expense category.
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:expense_categories,code',
            'description' => 'nullable|string|max:500',
            'parent_id' => 'nullable|exists:expense_categories,id',
            'requires_approval' => 'boolean',
            'approval_threshold' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $category = ExpenseCategory::create($validated);

        return response()->json([
            'message' => 'Expense category created successfully',
            'data' => $category,
        ], 201);
    }
}
