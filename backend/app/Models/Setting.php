<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Auth;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'group',
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    // Scopes
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeGroup($query, $group)
    {
        return $query->where('group', $group);
    }

    // Static helpers
    public static function get($group, $key, $default = null)
    {
        $tenantId = Auth::user()?->tenant_id;
        if (!$tenantId) return $default;

        $setting = static::where('tenant_id', $tenantId)
            ->where('group', $group)
            ->where('key', $key)
            ->first();

        return $setting ? $setting->value : $default;
    }

    public static function set($group, $key, $value)
    {
        $tenantId = Auth::user()?->tenant_id;
        if (!$tenantId) return null;

        return static::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'group' => $group,
                'key' => $key,
            ],
            ['value' => $value]
        );
    }

    public static function getGroup($group)
    {
        $tenantId = Auth::user()?->tenant_id;
        if (!$tenantId) return [];

        return static::where('tenant_id', $tenantId)
            ->where('group', $group)
            ->pluck('value', 'key')
            ->toArray();
    }

    public static function setGroup($group, array $settings)
    {
        $tenantId = Auth::user()?->tenant_id;
        if (!$tenantId) return false;

        foreach ($settings as $key => $value) {
            static::set($group, $key, $value);
        }

        return true;
    }
}
