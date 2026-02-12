<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Expense extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'expense_number',
        'expense_category_id',
        'title',
        'description',
        'expense_date',
        'amount',
        'payment_method',
        'payment_reference',
        'vendor_name',
        'receipt_number',
        'receipt_url',
        'is_recurring',
        'recurring_frequency',
        'status',
        'rejection_reason',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
        'is_recurring' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeByCategory($query, int $categoryId)
    {
        return $query->where('expense_category_id', $categoryId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('expense_date', [$startDate, $endDate]);
    }

    public function scopeRecurring($query)
    {
        return $query->where('is_recurring', true);
    }

    public static function generateExpenseNumber(): string
    {
        $prefix = 'EXP';
        $date = now()->format('Ymd');
        $lastExpense = static::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastExpense ? (intval(substr($lastExpense->expense_number, -4)) + 1) : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
