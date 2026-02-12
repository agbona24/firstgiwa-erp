<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles, Auditable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'department',
        'status',
        'tenant_id',
        'branch_id',
        'last_login_at',
        'pin_code',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'pin_code',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if user is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if user is super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('Super Admin');
    }

    /**
     * Check if user is an auditor (read-only access).
     */
    public function isAuditor(): bool
    {
        return $this->hasRole('Auditor');
    }

    /**
     * Check if user has a specific permission.
     * Alias for Spatie's can() method for backwards compatibility.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->can($permission);
    }

    /**
     * Get tenant relationship.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get branch relationship.
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get staff profile relationship.
     */
    public function staff()
    {
        return $this->hasOne(Staff::class);
    }
}
