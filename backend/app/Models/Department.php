<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Department extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'description',
        'head_of_department',
        'staff_count',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'staff_count' => 'integer',
    ];

    /**
     * Get the tenant that owns this department.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get all staff in this department.
     */
    public function staff()
    {
        return $this->hasMany(Staff::class, 'department', 'name');
    }

    /**
     * Scope to only active departments.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Update the staff count for this department.
     */
    public function updateStaffCount()
    {
        $this->staff_count = Staff::where('department', $this->name)
            ->where('employment_status', 'active')
            ->count();
        $this->save();
    }
}
