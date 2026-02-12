<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    protected $fillable = [
        'tenant_id',
        'bank_name',
        'account_name',
        'account_number',
        'account_type',
        'is_default',
        'is_active',
        'balance',
        'notes',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'balance' => 'decimal:2',
    ];

    /**
     * Payments made to this bank account
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Format account display
     */
    public function getDisplayNameAttribute(): string
    {
        return "{$this->bank_name} - {$this->account_number}";
    }
}
