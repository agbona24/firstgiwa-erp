<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class CustomerWalletTransaction extends Model
{
    protected $fillable = [
        'tenant_id',
        'customer_id',
        'reference',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'payment_method',
        'bank_account_id',
        'payment_reference',
        'sales_order_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount'         => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after'  => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateReference(): string
    {
        $year = date('Y');
        $last = static::where('reference', 'like', "WLT-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');
        $next = $last ? ((int) substr($last, -5)) + 1 : 1;
        return sprintf('WLT-%s-%05d', $year, $next);
    }
}
