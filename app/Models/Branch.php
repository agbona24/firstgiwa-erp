<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Branch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'branch_code',
        'address',
        'phone',
        'email',
        'branch_type',
        'manager_id',
        'is_active',
        'is_main_branch',
        'opening_time',
        'closing_time',
        'operating_days',
        'can_process_sales',
        'can_process_purchases',
        'can_transfer_stock',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_main_branch' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function staff()
    {
        return $this->hasMany(Staff::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function productionRuns()
    {
        return $this->hasMany(ProductionRun::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
