<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Liability extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'name',
        'reference',
        'description',
        'category',
        'type',
        'principal_amount',
        'current_balance',
        'interest_rate',
        'monthly_payment',
        'start_date',
        'due_date',
        'next_payment_date',
        'last_payment_date',
        'status',
        'creditor_name',
        'creditor_contact',
        'account_number',
        'is_secured',
        'collateral',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'monthly_payment' => 'decimal:2',
        'start_date' => 'date',
        'due_date' => 'date',
        'next_payment_date' => 'date',
        'last_payment_date' => 'date',
        'is_secured' => 'boolean',
    ];

    protected $appends = ['amount_paid', 'remaining_percentage', 'is_overdue'];

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments()
    {
        return $this->hasMany(LiabilityPayment::class);
    }

    // Accessors
    public function getAmountPaidAttribute()
    {
        return $this->principal_amount - $this->current_balance;
    }

    public function getRemainingPercentageAttribute()
    {
        if ($this->principal_amount <= 0) return 0;
        return round(($this->current_balance / $this->principal_amount) * 100, 1);
    }

    public function getIsOverdueAttribute()
    {
        if (!$this->next_payment_date || $this->status !== 'active') {
            return false;
        }
        return $this->next_payment_date < now();
    }

    // Methods
    public function recordPayment($amount, $paymentDate = null, $paymentMethod = null, $notes = null)
    {
        $paymentDate = $paymentDate ?? now();
        
        // Calculate interest portion (simple monthly interest)
        $monthlyInterest = ($this->current_balance * ($this->interest_rate / 100)) / 12;
        $principalPaid = max(0, $amount - $monthlyInterest);
        $interestPaid = min($amount, $monthlyInterest);
        
        // Create payment record
        $payment = $this->payments()->create([
            'amount' => $amount,
            'principal_paid' => $principalPaid,
            'interest_paid' => $interestPaid,
            'payment_date' => $paymentDate,
            'payment_method' => $paymentMethod,
            'notes' => $notes,
            'created_by' => Auth::id(),
        ]);
        
        // Update balance
        $this->current_balance = max(0, $this->current_balance - $principalPaid);
        $this->last_payment_date = $paymentDate;
        
        // Update next payment date (add 1 month)
        if ($this->next_payment_date) {
            $this->next_payment_date = $this->next_payment_date->addMonth();
        }
        
        // Mark as paid off if balance is zero
        if ($this->current_balance <= 0) {
            $this->status = 'paid_off';
        }
        
        $this->save();
        
        return $payment;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeShortTerm($query)
    {
        return $query->where('type', 'short_term');
    }

    public function scopeLongTerm($query)
    {
        return $query->where('type', 'long_term');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($liability) {
            if (!$liability->reference) {
                $prefix = 'LIA';
                $lastLiability = static::withTrashed()->orderBy('id', 'desc')->first();
                $nextNumber = $lastLiability ? $lastLiability->id + 1 : 1;
                $liability->reference = $prefix . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            }
            
            if (!$liability->current_balance) {
                $liability->current_balance = $liability->principal_amount;
            }
        });
    }
}
