<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'module',
    ];

    /**
     * Permission module constants.
     */
    public const MODULE_USERS = 'users';
    public const MODULE_INVENTORY = 'inventory';
    public const MODULE_SALES = 'sales';
    public const MODULE_PURCHASES = 'purchases';
    public const MODULE_PRODUCTION = 'production';
    public const MODULE_PAYMENTS = 'payments';
    public const MODULE_EXPENSES = 'expenses';
    public const MODULE_PAYROLL = 'payroll';
    public const MODULE_ACCOUNTING = 'accounting';
    public const MODULE_REPORTS = 'reports';
    public const MODULE_SETTINGS = 'settings';

    /**
     * Get the roles that have this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'permission_role');
    }

    /**
     * Find permission by name.
     */
    public static function findByName(string $name): ?self
    {
        return static::where('name', $name)->first();
    }
}
