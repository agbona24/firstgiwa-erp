<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SalesOrder extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'order_number',
        'order_type',
        'customer_id',
        'payment_type',
        'payment_status',
        'formula_id',
        'warehouse_id',
        'order_date',
        'delivery_date',
        'status',
        'fulfillment_status',
        'subtotal',
        'discount_type',
        'discount_value',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'credit_available',
        'notes',
        'delivery_address',
        'created_by',
        'approved_by',
        'approved_at',
        'cancelled_by',
        'cancelled_at',
    ];

    protected $casts = [
        'order_date' => 'date',
        'delivery_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'credit_available' => 'decimal:2',
        'approved_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function formula()
    {
        return $this->belongsTo(Formula::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function canceller()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function payments()
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeCreditOrders($query)
    {
        return $query->where('payment_type', 'credit');
    }

    public function scopeCashOrders($query)
    {
        return $query->where('payment_type', 'cash');
    }

    // Helper Methods
    public function isCreditOrder()
    {
        return $this->payment_type === 'credit';
    }

    public function isFormulaBasedOrder()
    {
        return $this->formula_id !== null;
    }

    public function requiresApproval()
    {
        $threshold = config('erp.approval_thresholds.sales_order', 1000000);
        return $this->total_amount >= $threshold;
    }
}
