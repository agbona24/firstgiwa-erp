<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

class CustomerCreditTransaction extends Model
{
    protected $fillable = [
        'tenant_id',
        'customer_id',
        'sales_order_id',
        'reference',
        'amount',
        'paid_amount',
        'balance',
        'transaction_date',
        'due_date',
        'paid_date',
        'days_overdue',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'transaction_date' => 'date',
        'due_date' => 'date',
        'paid_date' => 'date',
    ];

    /**
     * Customer relationship
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Sales order relationship
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /**
     * Payments for this transaction
     */
    public function payments(): HasMany
    {
        return $this->hasMany(CustomerCreditPayment::class, 'credit_transaction_id');
    }

    /**
     * Check if transaction is overdue
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->status !== 'paid' && $this->due_date < now()->startOfDay();
    }

    /**
     * Get days until due (negative if overdue)
     */
    public function getDaysUntilDueAttribute(): int
    {
        return now()->startOfDay()->diffInDays($this->due_date, false);
    }

    /**
     * Update status based on payments
     */
    public function updateStatus(): void
    {
        $this->balance = $this->amount - $this->paid_amount;

        if ($this->balance <= 0) {
            $this->status = 'paid';
            $this->paid_date = now();
            $this->balance = 0;
        } elseif ($this->paid_amount > 0) {
            $this->status = 'partial';
        } elseif ($this->due_date < now()->startOfDay()) {
            $this->status = 'overdue';
            $this->days_overdue = now()->startOfDay()->diffInDays($this->due_date);
        } else {
            $this->status = 'pending';
        }

        $this->save();
    }

    /**
     * Record a payment
     */
    public function recordPayment(float $amount, array $data = []): CustomerCreditPayment
    {
        $isOnTime = $this->due_date >= now()->startOfDay();
        $daysLate = $isOnTime ? 0 : now()->startOfDay()->diffInDays($this->due_date);

        $payment = $this->payments()->create([
            'tenant_id' => $this->tenant_id,
            'customer_id' => $this->customer_id,
            'reference' => $this->generatePaymentReference(),
            'amount' => $amount,
            'payment_date' => $data['payment_date'] ?? now(),
            'payment_method' => $data['payment_method'] ?? 'cash',
            'payment_reference' => $data['payment_reference'] ?? null,
            'is_on_time' => $isOnTime,
            'days_late' => $daysLate,
            'notes' => $data['notes'] ?? null,
            'received_by' => $data['received_by'] ?? Auth::id(),
        ]);

        $this->paid_amount += $amount;
        $this->updateStatus();

        // Update customer outstanding balance
        $this->customer->decrement('outstanding_balance', $amount);

        return $payment;
    }

    /**
     * Generate payment reference
     */
    protected function generatePaymentReference(): string
    {
        $prefix = 'CPY';
        $year = date('Y');
        $lastPayment = CustomerCreditPayment::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        
        $nextNum = $lastPayment ? (intval(substr($lastPayment->reference, -4)) + 1) : 1;
        
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNum);
    }

    /**
     * Generate transaction reference
     */
    public static function generateReference(): string
    {
        $prefix = 'CTX';
        $year = date('Y');
        $lastTx = self::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        
        $nextNum = $lastTx ? (intval(substr($lastTx->reference, -4)) + 1) : 1;
        
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNum);
    }
}
