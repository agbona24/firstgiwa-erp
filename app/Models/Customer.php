<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Customer extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'customer_code',
        'name',
        'email',
        'phone',
        'customer_type',
        'address',
        'contact_person',
        'credit_limit',
        'payment_terms_days',
        'total_purchases',
        'outstanding_balance',
        'credit_blocked',
        'credit_facility_type_id',
        'tax_id',
        'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'total_purchases' => 'decimal:2',
        'outstanding_balance' => 'decimal:2',
        'credit_blocked' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Computed attributes to include in JSON
     */
    protected $appends = [
        'credit_purchases',
        'other_purchases',
    ];

    // Relationships
    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function formulas()
    {
        return $this->hasMany(Formula::class);
    }

    public function creditFacilityType()
    {
        return $this->belongsTo(CreditFacilityType::class);
    }

    public function creditTransactions()
    {
        return $this->hasMany(CustomerCreditTransaction::class);
    }

    public function creditPayments()
    {
        return $this->hasMany(CustomerCreditPayment::class);
    }

    public function creditScore()
    {
        return $this->hasOne(CustomerCreditScore::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCreditCustomers($query)
    {
        return $query->whereIn('customer_type', ['credit', 'both']);
    }

    public function scopeCreditBlocked($query)
    {
        return $query->where('credit_blocked', true);
    }

    // Credit Management Methods
    public function hasAvailableCredit($amount)
    {
        if ($this->customer_type === 'cash') {
            return false;
        }
        
        $availableCredit = $this->credit_limit - $this->outstanding_balance;
        return $availableCredit >= $amount;
    }

    public function getAvailableCredit()
    {
        if ($this->customer_type === 'cash') {
            return 0;
        }
        
        return max(0, $this->credit_limit - $this->outstanding_balance);
    }

    public function isCreditAllowed()
    {
        // Credit is allowed if:
        // 1. Customer has a credit limit > 0 (regardless of customer_type), OR
        // 2. Customer type is explicitly 'credit' or 'both'
        // AND customer is not blocked and is active
        $hasCreditFacility = $this->credit_limit > 0 || in_array($this->customer_type, ['credit', 'both']);
        
        return $hasCreditFacility 
               && !$this->credit_blocked 
               && $this->is_active;
    }

    public function getCreditUsagePercentage()
    {
        if ($this->credit_limit <= 0) {
            return 0;
        }
        
        return ($this->outstanding_balance / $this->credit_limit) * 100;
    }

    /**
     * Calculate total purchases dynamically from all completed sales orders
     */
    public function getTotalPurchasesAttribute($value)
    {
        return $this->salesOrders()
            ->whereIn('status', ['completed', 'fulfilled', 'delivered'])
            ->sum('total_amount') ?: ($value ?? 0);
    }

    /**
     * Calculate credit purchases from completed credit sales orders
     */
    public function getCreditPurchasesAttribute()
    {
        return $this->salesOrders()
            ->where('payment_type', 'credit')
            ->whereIn('status', ['completed', 'fulfilled', 'delivered'])
            ->sum('total_amount') ?: 0;
    }

    /**
     * Calculate other purchases (cash, pos, card, etc.) from completed sales orders
     */
    public function getOtherPurchasesAttribute()
    {
        return $this->salesOrders()
            ->where('payment_type', '!=', 'credit')
            ->whereIn('status', ['completed', 'fulfilled', 'delivered'])
            ->sum('total_amount') ?: 0;
    }
}
