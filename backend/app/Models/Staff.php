<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Staff extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $table = 'staff';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'branch_id',
        'staff_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'department',
        'position',
        'employment_type',
        'date_of_birth',
        'date_hired',
        'date_terminated',
        'employment_status',
        'basic_salary',
        'salary_frequency',
        'housing_allowance',
        'transport_allowance',
        'other_allowances',
        'bank_name',
        'account_number',
        'account_name',
        'tax_id',
        'national_id',
        'pension_number',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'is_active',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'date_hired' => 'date',
        'date_terminated' => 'date',
        'basic_salary' => 'decimal:2',
        'housing_allowance' => 'decimal:2',
        'transport_allowance' => 'decimal:2',
        'other_allowances' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = ['full_name', 'total_allowances', 'gross_salary'];

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getTotalAllowancesAttribute(): float
    {
        return $this->housing_allowance + $this->transport_allowance + $this->other_allowances;
    }

    public function getGrossSalaryAttribute(): float
    {
        return $this->basic_salary + $this->total_allowances;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function payrollItems()
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('employment_status', 'active');
    }

    public function scopeByDepartment($query, string $department)
    {
        return $query->where('department', $department);
    }

    public function scopeByBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
