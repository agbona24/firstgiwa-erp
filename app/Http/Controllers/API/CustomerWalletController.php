<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
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

        DB::beginTransaction();
        try {
            $balanceBefore = $customer->getWalletBalance();
            $balanceAfter  = $balanceBefore + $amount;

            // Update customer wallet balance
            $customer->increment('wallet_balance', $amount);

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
                'notes'              => $request->notes ?? "Wallet top-up via {$request->payment_method}",
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

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Wallet topped up successfully',
                'data'    => [
                    'transaction'    => $txn,
                    'new_balance'    => $balanceAfter,
                    'customer_name'  => $customer->name,
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
