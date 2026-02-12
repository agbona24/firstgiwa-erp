<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerCreditScore extends Model
{
    protected $fillable = [
        'tenant_id',
        'customer_id',
        'credit_score',
        'risk_level',
        'total_transactions',
        'on_time_payments',
        'late_payments',
        'on_time_payment_rate',
        'average_days_to_pay',
        'total_credit_used',
        'total_credit_paid',
        'current_overdue_count',
        'current_overdue_amount',
        'longest_overdue_days',
        'recommended_limit',
        'recommended_terms_days',
        'recommendations',
        'last_calculated_at',
    ];

    protected $casts = [
        'credit_score' => 'integer',
        'total_transactions' => 'integer',
        'on_time_payments' => 'integer',
        'late_payments' => 'integer',
        'on_time_payment_rate' => 'decimal:2',
        'average_days_to_pay' => 'decimal:2',
        'total_credit_used' => 'decimal:2',
        'total_credit_paid' => 'decimal:2',
        'current_overdue_count' => 'integer',
        'current_overdue_amount' => 'decimal:2',
        'longest_overdue_days' => 'integer',
        'recommended_limit' => 'decimal:2',
        'recommended_terms_days' => 'integer',
        'last_calculated_at' => 'datetime',
    ];

    /**
     * Customer relationship
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get on-time payment rate
     */
    public function getOnTimeRateAttribute(): float
    {
        if ($this->total_transactions === 0) return 100;
        return round(($this->on_time_payments / $this->total_transactions) * 100, 1);
    }

    /**
     * Get score color for UI
     */
    public function getScoreColorAttribute(): string
    {
        if ($this->credit_score >= 80) return 'green';
        if ($this->credit_score >= 60) return 'yellow';
        if ($this->credit_score >= 40) return 'orange';
        return 'red';
    }

    /**
     * Get risk badge variant
     */
    public function getRiskBadgeAttribute(): string
    {
        return match($this->risk_level) {
            'low' => 'success',
            'medium' => 'warning',
            'high' => 'danger',
            'critical' => 'danger',
            default => 'secondary',
        };
    }

    /**
     * Get score label
     */
    public function getScoreLabelAttribute(): string
    {
        if ($this->credit_score >= 90) return 'Excellent';
        if ($this->credit_score >= 80) return 'Very Good';
        if ($this->credit_score >= 70) return 'Good';
        if ($this->credit_score >= 60) return 'Fair';
        if ($this->credit_score >= 40) return 'Poor';
        return 'Very Poor';
    }
}
