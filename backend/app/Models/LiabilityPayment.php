<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LiabilityPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'liability_id',
        'amount',
        'principal_paid',
        'interest_paid',
        'payment_date',
        'payment_method',
        'reference',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'principal_paid' => 'decimal:2',
        'interest_paid' => 'decimal:2',
        'payment_date' => 'date',
    ];

    // Relationships
    public function liability()
    {
        return $this->belongsTo(Liability::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
