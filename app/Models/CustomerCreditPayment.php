<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerCreditPayment extends Model
{
    protected $fillable = [
        'tenant_id',
        'customer_id',
        'credit_transaction_id',
        'reference',
        'amount',
        'payment_date',
        'payment_method',
        'payment_reference',
        'is_on_time',
        'days_late',
        'notes',
        'received_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'is_on_time' => 'boolean',
    ];

    /**
     * Customer relationship
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Credit transaction relationship
     */
    public function creditTransaction(): BelongsTo
    {
        return $this->belongsTo(CustomerCreditTransaction::class, 'credit_transaction_id');
    }

    /**
     * User who received the payment
     */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * Payment status badge
     */
    public function getPaymentStatusAttribute(): string
    {
        if ($this->is_on_time) {
            return 'on_time';
        }
        if ($this->days_late <= 7) {
            return 'slightly_late';
        }
        if ($this->days_late <= 30) {
            return 'late';
        }
        return 'very_late';
    }
}
