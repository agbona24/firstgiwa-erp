<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\SalesOrder;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['customer', 'supplier', 'recorder', 'payable', 'bankAccount']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('payment_reference', 'like', "%{$search}%")
                    ->orWhere('transaction_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('supplier', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Payment type filter (receivable/payable)
        if ($request->filled('payment_type')) {
            $query->where('payment_type', $request->input('payment_type'));
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Payment method filter
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }

        // Customer filter
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        // Supplier filter
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        // Date range filter
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('payment_date', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        }

        // Overdue filter
        if ($request->boolean('overdue')) {
            $query->overdue();
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'payment_date');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('per_page', 15);
        $payments = $query->paginate($perPage);

        return response()->json($payments);
    }

    /**
     * Store a newly created payment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_type' => 'required|in:receivable,payable',
            'payment_date' => 'required|date',
            'customer_id' => 'required_if:payment_type,receivable|nullable|exists:customers,id',
            'supplier_id' => 'required_if:payment_type,payable|nullable|exists:suppliers,id',
            'sales_order_id' => 'nullable|exists:sales_orders,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank_transfer,pos,cheque,mobile_money',
            'transaction_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'due_date' => 'nullable|date',
        ]);

        DB::beginTransaction();
        try {
            $paymentData = [
                'payment_reference' => Payment::generatePaymentReference(),
                'payment_date' => $validated['payment_date'],
                'payment_type' => $validated['payment_type'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'due_date' => $validated['due_date'] ?? null,
                'recorded_by' => $request->user()->id,
            ];

            // Handle receivable (from customer)
            if ($validated['payment_type'] === 'receivable') {
                $paymentData['customer_id'] = $validated['customer_id'];
                
                if (!empty($validated['sales_order_id'])) {
                    $paymentData['payable_type'] = SalesOrder::class;
                    $paymentData['payable_id'] = $validated['sales_order_id'];
                }

                // Update customer balance
                $customer = Customer::findOrFail($validated['customer_id']);
                $customer->decrement('outstanding_balance', $validated['amount']);
            }
            // Handle payable (to supplier)
            else {
                $paymentData['supplier_id'] = $validated['supplier_id'];
                
                if (!empty($validated['purchase_order_id'])) {
                    $paymentData['payable_type'] = PurchaseOrder::class;
                    $paymentData['payable_id'] = $validated['purchase_order_id'];
                }

                // Update supplier balance
                $supplier = Supplier::findOrFail($validated['supplier_id']);
                $supplier->decrement('outstanding_balance', $validated['amount']);
            }

            $payment = Payment::create($paymentData);

            DB::commit();

            return response()->json([
                'message' => 'Payment recorded successfully',
                'data' => $payment->load(['customer', 'supplier', 'recorder', 'payable']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to record payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified payment.
     */
    public function show(int $id): JsonResponse
    {
        $payment = Payment::with(['customer', 'supplier', 'recorder', 'reconciler', 'payable'])
            ->findOrFail($id);

        return response()->json(['data' => $payment]);
    }

    /**
     * Update the specified payment.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        // Can only update pending payments
        if ($payment->status !== 'pending') {
            return response()->json([
                'message' => 'Can only update pending payments.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_date' => 'sometimes|required|date',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'payment_method' => 'sometimes|required|in:cash,bank_transfer,pos,cheque,mobile_money',
            'transaction_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'due_date' => 'nullable|date',
        ]);

        $payment->update($validated);

        return response()->json([
            'message' => 'Payment updated successfully',
            'data' => $payment->fresh(['customer', 'supplier', 'recorder']),
        ]);
    }

    /**
     * Remove the specified payment (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        // Can only delete pending payments
        if ($payment->status === 'completed') {
            return response()->json([
                'message' => 'Cannot delete completed payments. Use reversal instead.',
            ], 422);
        }

        $payment->delete();

        return response()->json([
            'message' => 'Payment deleted successfully',
        ]);
    }

    /**
     * Reconcile a payment.
     */
    public function reconcile(Request $request, int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'completed') {
            return response()->json([
                'message' => 'Can only reconcile completed payments.',
            ], 422);
        }

        if ($payment->reconciled_at) {
            return response()->json([
                'message' => 'Payment has already been reconciled.',
            ], 422);
        }

        $payment->update([
            'reconciled_by' => $request->user()->id,
            'reconciled_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payment reconciled successfully',
            'data' => $payment->fresh(['reconciler']),
        ]);
    }

    /**
     * Reverse/void a payment.
     */
    public function reverse(Request $request, int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'completed') {
            return response()->json([
                'message' => 'Can only reverse completed payments.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            // Reverse the balance changes
            if ($payment->payment_type === 'receivable' && $payment->customer_id) {
                $payment->customer->increment('outstanding_balance', $payment->amount);
            } elseif ($payment->payment_type === 'payable' && $payment->supplier_id) {
                $payment->supplier->increment('outstanding_balance', $payment->amount);
            }

            $payment->update([
                'status' => 'cancelled',
                'notes' => $payment->notes . "\nReversed: " . $validated['reason'],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payment reversed successfully',
                'data' => $payment->fresh(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to reverse payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get receivables (payments from customers).
     */
    public function receivables(Request $request): JsonResponse
    {
        $query = Payment::with(['customer', 'recorder', 'payable'])
            ->where('payment_type', 'receivable');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        $payments = $query->orderBy('payment_date', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($payments);
    }

    /**
     * Get payables (payments to suppliers).
     */
    public function payables(Request $request): JsonResponse
    {
        $query = Payment::with(['supplier', 'recorder', 'payable'])
            ->where('payment_type', 'payable');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        $payments = $query->orderBy('payment_date', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($payments);
    }

    /**
     * Get overdue payments.
     */
    public function overdue(Request $request): JsonResponse
    {
        $payments = Payment::with(['customer', 'supplier', 'recorder'])
            ->overdue()
            ->orderBy('due_date', 'asc')
            ->paginate($request->input('per_page', 15));

        return response()->json($payments);
    }

    /**
     * Get payment summary/statistics.
     */
    public function summary(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $summary = [
            'receivables' => [
                'total' => Payment::receivable()
                    ->completed()
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->sum('amount'),
                'count' => Payment::receivable()
                    ->completed()
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->count(),
                'pending' => Payment::receivable()
                    ->pending()
                    ->sum('amount'),
            ],
            'payables' => [
                'total' => Payment::payableType()
                    ->completed()
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->sum('amount'),
                'count' => Payment::payableType()
                    ->completed()
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->count(),
                'pending' => Payment::payableType()
                    ->pending()
                    ->sum('amount'),
            ],
            'by_method' => Payment::completed()
                ->whereBetween('payment_date', [$startDate, $endDate])
                ->select('payment_method', DB::raw('SUM(amount) as total'))
                ->groupBy('payment_method')
                ->pluck('total', 'payment_method'),
            'overdue_count' => Payment::overdue()->count(),
            'overdue_amount' => Payment::overdue()->sum('amount'),
        ];

        return response()->json(['data' => $summary]);
    }
}
