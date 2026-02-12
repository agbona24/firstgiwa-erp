<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'payment_reference',
        'payment_date',
        'payment_type',
        'payable_type',
        'payable_id',
        'customer_id',
        'supplier_id',
        'amount',
        'payment_method',
        'bank_account_id',
        'status',
        'transaction_reference',
        'notes',
        'due_date',
        'recorded_by',
        'reconciled_by',
        'reconciled_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'due_date' => 'date',
        'amount' => 'decimal:2',
        'reconciled_at' => 'datetime',
    ];

    public function payable()
    {
        return $this->morphTo();
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function reconciler()
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    public function scopeReceivable($query)
    {
        return $query->where('payment_type', 'receivable');
    }

    public function scopePayableType($query)
    {
        return $query->where('payment_type', 'payable');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('payment_date', [$startDate, $endDate]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'pending')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now());
    }

    public static function generatePaymentReference(): string
    {
        $prefix = 'PAY';
        $date = now()->format('Ymd');
        $lastPayment = static::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastPayment ? (intval(substr($lastPayment->payment_reference, -4)) + 1) : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
