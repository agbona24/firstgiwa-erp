<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Supplier extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'supplier_code',
        'name',
        'email',
        'phone',
        'address',
        'contact_person',
        'payment_terms_days',
        'total_purchases',
        'outstanding_balance',
        'tax_id',
        'bank_name',
        'account_number',
        'is_active',
    ];

    protected $casts = [
        'total_purchases' => 'decimal:2',
        'outstanding_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
