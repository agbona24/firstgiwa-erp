<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerCreditTransaction;
use App\Models\CustomerCreditPayment;
use App\Services\CreditAnalysisService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreditAnalyticsController extends Controller
{
    protected CreditAnalysisService $creditAnalysisService;

    public function __construct(CreditAnalysisService $creditAnalysisService)
    {
        $this->creditAnalysisService = $creditAnalysisService;
    }

    /**
     * Get credit dashboard summary
     */
    public function summary(): JsonResponse
    {
        $summary = $this->creditAnalysisService->getCreditSummary();
        
        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get customer credit analytics
     */
    public function customerAnalytics(int $customerId): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        $analytics = $this->creditAnalysisService->getCustomerAnalytics($customer);

        return response()->json([
            'success' => true,
            'data' => $analytics,
        ]);
    }

    /**
     * Recalculate customer credit score
     */
    public function recalculateScore(int $customerId): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        $creditScore = $this->creditAnalysisService->calculateCreditScore($customer);

        return response()->json([
            'success' => true,
            'message' => 'Credit score recalculated',
            'data' => $creditScore,
        ]);
    }

    /**
     * Get customer credit transactions
     */
    public function transactions(int $customerId, Request $request): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        
        $query = $customer->creditTransactions()
            ->with('salesOrder')
            ->orderBy('transaction_date', 'desc');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $transactions = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Get customer credit payments
     */
    public function payments(int $customerId, Request $request): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        
        $query = $customer->creditPayments()
            ->with('creditTransaction')
            ->orderBy('payment_date', 'desc');

        $payments = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Record a payment against a transaction
     */
    public function recordPayment(Request $request): JsonResponse
    {
        $request->validate([
            'transaction_id' => 'required|exists:customer_credit_transactions,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,transfer,pos,cheque',
            'payment_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $transaction = CustomerCreditTransaction::findOrFail($request->transaction_id);

        // Validate amount doesn't exceed balance
        if ($request->amount > $transaction->balance) {
            return response()->json([
                'success' => false,
                'message' => 'Payment amount exceeds remaining balance of ' . number_format($transaction->balance, 2),
            ], 422);
        }

        $payment = $this->creditAnalysisService->recordPayment($transaction, $request->amount, [
            'payment_method' => $request->payment_method,
            'payment_reference' => $request->payment_reference,
            'notes' => $request->notes,
        ]);

        // Recalculate credit score
        $this->creditAnalysisService->calculateCreditScore($transaction->customer);

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'data' => [
                'payment' => $payment->fresh()->load('creditTransaction'),
                'transaction' => $transaction->fresh(),
            ],
        ]);
    }

    /**
     * Get all overdue transactions
     */
    public function overdueTransactions(Request $request): JsonResponse
    {
        $customerId = $request->get('customer_id');
        $transactions = $this->creditAnalysisService->getOverdueTransactions($customerId);

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Get transaction details with payments
     */
    public function transactionDetails(int $transactionId): JsonResponse
    {
        $transaction = CustomerCreditTransaction::with(['customer', 'salesOrder', 'payments'])
            ->findOrFail($transactionId);

        return response()->json([
            'success' => true,
            'data' => $transaction,
        ]);
    }

    /**
     * Apply credit score recommendations
     */
    public function applyRecommendations(int $customerId): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        $creditScore = $customer->creditScore;

        if (!$creditScore) {
            return response()->json([
                'success' => false,
                'message' => 'No credit score calculated yet',
            ], 404);
        }

        $oldLimit = $customer->credit_limit;
        $oldTerms = $customer->payment_terms_days;

        $customer->update([
            'credit_limit' => $creditScore->recommended_limit,
            'payment_terms_days' => $creditScore->recommended_terms_days,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Recommendations applied successfully',
            'data' => [
                'old_limit' => $oldLimit,
                'new_limit' => $creditScore->recommended_limit,
                'old_terms' => $oldTerms,
                'new_terms' => $creditScore->recommended_terms_days,
            ],
        ]);
    }

    /**
     * Record a customer credit payment (against overall outstanding balance)
     * This is used when customer makes a payment to reduce their credit balance
     */
    public function recordCustomerPayment(Request $request): JsonResponse
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,transfer,pos,cheque',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'transaction_ids' => 'nullable|array',
        ]);

        $customer = Customer::findOrFail($request->customer_id);

        // Validate amount doesn't exceed outstanding balance
        $outstandingBalance = floatval($customer->outstanding_balance);
        if ($request->amount > $outstandingBalance) {
            return response()->json([
                'success' => false,
                'message' => 'Payment amount exceeds outstanding balance of ₦' . number_format($outstandingBalance, 2),
            ], 422);
        }

        $paymentAmount = floatval($request->amount);
        $remainingPayment = $paymentAmount;

        DB::beginTransaction();
        try {
            // Generate payment reference
            $paymentRef = 'CRP-' . date('YmdHis') . '-' . $customer->id;

            // If specific transaction IDs provided, allocate to those first
            $transactionIds = $request->transaction_ids ?? [];
            
            // Get pending sales orders (credit sales) sorted by due date
            $pendingOrders = \App\Models\SalesOrder::where('customer_id', $customer->id)
                ->where('payment_type', 'credit')
                ->whereIn('payment_status', ['pending', 'partial'])
                ->orderBy('created_at', 'asc')
                ->get();

            $paymentsCreated = [];

            foreach ($pendingOrders as $order) {
                if ($remainingPayment <= 0) break;

                $orderBalance = floatval($order->total_amount) - floatval($order->paid_amount ?? 0);
                if ($orderBalance <= 0) continue;

                $paymentForOrder = min($remainingPayment, $orderBalance);
                
                // Update order paid amount
                $newPaidAmount = floatval($order->paid_amount ?? 0) + $paymentForOrder;
                $order->update([
                    'paid_amount' => $newPaidAmount,
                    'payment_status' => $newPaidAmount >= floatval($order->total_amount) ? 'paid' : 'partial',
                ]);

                // Create payment record
                $payment = \App\Models\Payment::create([
                    'payment_reference' => $paymentRef . '-' . $order->id,
                    'payment_date' => now(),
                    'payment_type' => 'customer_credit_payment',
                    'payable_type' => 'App\\Models\\SalesOrder',
                    'payable_id' => $order->id,
                    'customer_id' => $customer->id,
                    'amount' => $paymentForOrder,
                    'payment_method' => $request->payment_method,
                    'bank_account_id' => $request->bank_account_id,
                    'status' => 'completed',
                    'notes' => $request->notes ?? "Credit payment for order {$order->order_number}",
                    'recorded_by' => Auth::id(),
                ]);

                $paymentsCreated[] = $payment;
                $remainingPayment -= $paymentForOrder;
            }

            // Update customer outstanding balance
            $customer->update([
                'outstanding_balance' => max(0, $outstandingBalance - $paymentAmount),
            ]);

            // Recalculate credit score
            $this->creditAnalysisService->calculateCreditScore($customer);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment of ₦' . number_format($paymentAmount, 2) . ' recorded successfully',
                'data' => [
                    'payment_reference' => $paymentRef,
                    'amount_paid' => $paymentAmount,
                    'new_outstanding_balance' => max(0, $outstandingBalance - $paymentAmount),
                    'orders_updated' => count($paymentsCreated),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Credit payment failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record payment: ' . $e->getMessage(),
            ], 500);
        }
    }
}
