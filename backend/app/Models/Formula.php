<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Formula extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'formula_code',
        'name',
        'customer_id',
        'description',
        'is_active',
        'usage_count',
        'last_used_at',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'usage_count' => 'integer',
        'last_used_at' => 'datetime',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(FormulaItem::class)->orderBy('sequence');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeGeneral($query)
    {
        return $query->whereNull('customer_id');
    }

    public function scopeForCustomer($query, $customerId)
    {
        return $query->where(function ($q) use ($customerId) {
            $q->whereNull('customer_id')
              ->orWhere('customer_id', $customerId);
        });
    }

    // Helpers
    public function getTotalPercentage()
    {
        return $this->items->sum('percentage');
    }

    public function isValid()
    {
        $total = $this->getTotalPercentage();
        return abs($total - 100) < 0.01; // Allow 0.01% tolerance
    }

    public function calculateRequirements($totalQuantity)
    {
        $requirements = [];
        foreach ($this->items as $item) {
            $requirements[] = [
                'product_id' => $item->product_id,
                'product' => $item->product,
                'percentage' => $item->percentage,
                'quantity' => ($item->percentage / 100) * $totalQuantity,
            ];
        }
        return $requirements;
    }
}
