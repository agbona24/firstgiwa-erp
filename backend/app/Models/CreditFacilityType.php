<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CreditFacilityType extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'default_limit',
        'max_limit',
        'payment_terms',
        'payment_terms_unit',
        'interest_rate',
        'grace_period',
        'grace_period_unit',
        'description',
        'is_active',
    ];

    protected $casts = [
        'default_limit' => 'decimal:2',
        'max_limit' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get the payment terms in a human-readable format
     */
    public function getPaymentTermsDisplayAttribute(): string
    {
        $unit = $this->payment_terms_unit ?? 'days';
        $value = $this->payment_terms;
        
        if ($value == 1) {
            $unit = rtrim($unit, 's'); // Remove 's' for singular
        }
        
        return "{$value} {$unit}";
    }

    /**
     * Get the grace period in a human-readable format
     */
    public function getGracePeriodDisplayAttribute(): string
    {
        if ($this->grace_period == 0) {
            return 'None';
        }
        
        $unit = $this->grace_period_unit ?? 'days';
        $value = $this->grace_period;
        
        if ($value == 1) {
            $unit = rtrim($unit, 's');
        }
        
        return "{$value} {$unit}";
    }

    /**
     * Convert payment terms to days for calculations
     */
    public function getPaymentTermsInDaysAttribute(): int
    {
        $multipliers = [
            'days' => 1,
            'weeks' => 7,
            'months' => 30,
        ];
        
        return $this->payment_terms * ($multipliers[$this->payment_terms_unit] ?? 1);
    }

    /**
     * Tenant relationship
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope for active facility types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
