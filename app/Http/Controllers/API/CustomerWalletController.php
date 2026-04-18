<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerCreditTransaction;
use App\Models\CustomerWalletTransaction;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CustomerWalletController extends Controller
{
    /**
     * Top up a customer's wallet (record an advance payment)
     */
    public function deposit(Request $request, Customer $customer): JsonResponse
    {
        $request->validate([
            'amount'             => 'required|numeric|min:0.01',
            'payment_method'     => 'required|in:cash,bank_transfer,pos,cheque',
            'bank_account_id'    => 'nullable|exists:bank_accounts,id',
            'payment_reference'  => 'nullable|string|max:100',
            'notes'              => 'nullable|string|max:500',
        ]);

        $amount      = floatval($request->amount);
        $tenantId    = Auth::user()->tenant_id;

        // How much of the deposit auto-repays outstanding credit (oldest first)
        $outstanding      = floatval($customer->outstanding_balance);
        $creditRepayment  = min($amount, $outstanding);
        $walletAddition   = $amount - $creditRepayment;

        DB::beginTransaction();
        try {
            $balanceBefore = $customer->getWalletBalance();
            $balanceAfter  = $balanceBefore + $walletAddition;

            // Add only the non-credit portion to wallet balance
            if ($walletAddition > 0) {
                $customer->increment('wallet_balance', $walletAddition);
            }

            // Build notes
            $baseNotes = $request->notes ?? "Wallet top-up via {$request->payment_method}";
            if ($creditRepayment > 0) {
                $baseNotes .= sprintf(
                    ' (₦%s auto-applied to outstanding credit; ₦%s added to wallet)',
                    number_format($creditRepayment, 2),
                    number_format($walletAddition, 2)
                );
            }

            // Log wallet transaction
            $txn = CustomerWalletTransaction::create([
                'tenant_id'          => $tenantId,
                'customer_id'        => $customer->id,
                'reference'          => CustomerWalletTransaction::generateReference(),
                'type'               => 'deposit',
                'amount'             => $amount,
                'balance_before'     => $balanceBefore,
                'balance_after'      => $balanceAfter,
                'payment_method'     => $request->payment_method,
                'bank_account_id'    => $request->bank_account_id,
                'payment_reference'  => $request->payment_reference,
                'notes'              => $baseNotes,
                'created_by'         => Auth::id(),
            ]);

            // Create a Payment record so it appears in the general payments ledger
            Payment::create([
                'tenant_id'             => $tenantId,
                'payment_reference'     => $txn->reference,
                'payable_type'          => Customer::class,
                'payable_id'            => $customer->id,
                'customer_id'           => $customer->id,
                'payment_type'          => 'receivable',
                'payment_method'        => $request->payment_method,
                'bank_account_id'       => $request->bank_account_id,
                'amount'                => $amount,
                'payment_date'          => now(),
                'status'                => 'completed',
                'transaction_reference' => $request->payment_reference,
                'notes'                 => $request->notes ?? 'Wallet top-up',
                'recorded_by'           => Auth::id(),
            ]);

            // Auto-repay outstanding credit transactions (oldest first)
            if ($creditRepayment > 0) {
                $remaining = $creditRepayment;
                $pendingTxns = CustomerCreditTransaction::where('customer_id', $customer->id)
                    ->whereIn('status', ['pending', 'overdue', 'partial'])
                    ->orderBy('transaction_date', 'asc')
                    ->orderBy('id', 'asc')
                    ->get();

                foreach ($pendingTxns as $creditTxn) {
                    if ($remaining <= 0) break;
                    $toPay = min($remaining, floatval($creditTxn->balance));
                    if ($toPay <= 0) continue;

                    $creditTxn->recordPayment($toPay, [
                        'payment_method'    => $request->payment_method,
                        'payment_reference' => $txn->reference,
                        'notes'             => "Auto-applied from wallet top-up ({$txn->reference})",
                        'received_by'       => Auth::id(),
                    ]);
                    $remaining -= $toPay;
                }
            }

            DB::commit();
            $customer->refresh();

            $message = $creditRepayment > 0
                ? sprintf(
                    'Top-up received. ₦%s applied to outstanding credit (available credit now ₦%s). ₦%s added to wallet.',
                    number_format($creditRepayment, 2),
                    number_format(max(0, $customer->credit_limit - $customer->outstanding_balance), 2),
                    number_format($walletAddition, 2)
                )
                : 'Wallet topped up successfully';

            return response()->json([
                'success' => true,
                'message' => $message,
                'data'    => [
                    'transaction'        => $txn,
                    'new_balance'        => $balanceAfter,
                    'customer_name'      => $customer->name,
                    'credit_repaid'      => $creditRepayment,
                    'wallet_added'       => $walletAddition,
                    'available_credit'   => max(0, $customer->credit_limit - $customer->outstanding_balance),
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get wallet transaction history for a customer
     */
    public function transactions(Customer $customer): JsonResponse
    {
        $transactions = $customer->walletTransactions()
            ->with(['salesOrder:id,order_number', 'bankAccount:id,bank_name,account_number', 'createdBy:id,name'])
            ->orderByDesc('created_at')
            ->paginate(25);

        return response()->json([
            'success' => true,
            'data'    => $transactions,
            'balance' => $customer->getWalletBalance(),
        ]);
    }

    /**
     * Get wallet balance for a customer
     */
    public function balance(Customer $customer): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'wallet_balance' => $customer->getWalletBalance(),
                'customer_id'    => $customer->id,
                'customer_name'  => $customer->name,
            ],
        ]);
    }

    /**
     * Edit an existing deposit transaction (corrects mistakes)
     */
    public function updateDeposit(Request $request, Customer $customer, CustomerWalletTransaction $transaction): JsonResponse
    {
        if ($transaction->customer_id !== $customer->id) {
            return response()->json(['success' => false, 'message' => 'Transaction does not belong to this customer.'], 403);
        }

        if ($transaction->type !== 'deposit') {
            return response()->json(['success' => false, 'message' => 'Only deposit transactions can be edited.'], 422);
        }

        $request->validate([
            'amount'             => 'required|numeric|min:0.01',
            'payment_method'     => 'required|in:cash,bank_transfer,pos,cheque',
            'bank_account_id'    => 'nullable|exists:bank_accounts,id',
            'payment_reference'  => 'nullable|string|max:100',
            'notes'              => 'nullable|string|max:500',
        ]);

        $oldAmount = floatval($transaction->amount);
        $newAmount = floatval($request->amount);
        $diff      = $newAmount - $oldAmount;

        DB::beginTransaction();
        try {
            // Adjust wallet balance by the difference
            $customer->increment('wallet_balance', $diff);

            // Update the transaction record
            $transaction->update([
                'amount'             => $newAmount,
                'balance_after'      => floatval($transaction->balance_after) + $diff,
                'payment_method'     => $request->payment_method,
                'bank_account_id'    => $request->bank_account_id,
                'payment_reference'  => $request->payment_reference,
                'notes'              => $request->notes ?? "Wallet top-up via {$request->payment_method}",
            ]);

            // Sync the corresponding Payment ledger record
            Payment::where('payment_reference', $transaction->reference)->update([
                'amount'                => $newAmount,
                'payment_method'        => $request->payment_method,
                'bank_account_id'       => $request->bank_account_id,
                'transaction_reference' => $request->payment_reference,
                'notes'                 => $request->notes ?? 'Wallet top-up',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Wallet transaction updated successfully',
                'data'    => [
                    'transaction' => $transaction->fresh(),
                    'new_balance' => $customer->fresh()->getWalletBalance(),
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
