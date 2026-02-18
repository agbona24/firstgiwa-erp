<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'subdomain',
        'email',
        'phone',
        'address',
        'plan',
        'logo_url',
        'is_active',
        'settings',
        'status',
        'suspended_at',
        'suspended_reason',
        'storage_used',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
        'suspended_at' => 'datetime',
        'storage_used' => 'integer',
    ];

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function staff()
    {
        return $this->hasMany(Staff::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function suspend(string $reason = null): void
    {
        $this->update([
            'status' => 'suspended',
            'is_active' => false,
            'suspended_at' => now(),
            'suspended_reason' => $reason,
        ]);
    }

    public function activate(): void
    {
        $this->update([
            'status' => 'active',
            'is_active' => true,
            'suspended_at' => null,
            'suspended_reason' => null,
        ]);
    }
}
