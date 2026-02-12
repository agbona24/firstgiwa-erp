<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'type',
        'title',
        'message',
        'icon',
        'icon_color',
        'action_url',
        'reference_type',
        'reference_id',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    // Notification types
    const TYPE_STOCK = 'stock';
    const TYPE_APPROVAL = 'approval';
    const TYPE_PAYMENT = 'payment';
    const TYPE_PRODUCTION = 'production';
    const TYPE_ORDER = 'order';
    const TYPE_SYSTEM = 'system';
    const TYPE_EXPENSE = 'expense';

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeForTenant(Builder $query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForUser(Builder $query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->whereNull('user_id')
              ->orWhere('user_id', $userId);
        });
    }

    public function scopeUnread(Builder $query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead(Builder $query)
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeOfType(Builder $query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRecent(Builder $query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Helpers
    public function markAsRead()
    {
        if (!$this->read_at) {
            $this->update(['read_at' => now()]);
        }
        return $this;
    }

    public function markAsUnread()
    {
        $this->update(['read_at' => null]);
        return $this;
    }

    public function isRead()
    {
        return $this->read_at !== null;
    }

    // Icon mapping by type
    public static function getIconForType($type)
    {
        $icons = [
            self::TYPE_STOCK => [
                'icon' => 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                'color' => 'text-orange-500',
            ],
            self::TYPE_APPROVAL => [
                'icon' => 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                'color' => 'text-blue-500',
            ],
            self::TYPE_PAYMENT => [
                'icon' => 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
                'color' => 'text-green-500',
            ],
            self::TYPE_PRODUCTION => [
                'icon' => 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
                'color' => 'text-teal-500',
            ],
            self::TYPE_ORDER => [
                'icon' => 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                'color' => 'text-indigo-500',
            ],
            self::TYPE_EXPENSE => [
                'icon' => 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
                'color' => 'text-red-500',
            ],
            self::TYPE_SYSTEM => [
                'icon' => 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                'color' => 'text-slate-500',
            ],
        ];

        return $icons[$type] ?? $icons[self::TYPE_SYSTEM];
    }

    // Format for API response
    public function toApiArray()
    {
        $iconData = self::getIconForType($this->type);

        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'icon' => $this->icon ?? $iconData['icon'],
            'icon_color' => $this->icon_color ?? $iconData['color'],
            'action_url' => $this->action_url,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'data' => $this->data,
            'read' => $this->isRead(),
            'read_at' => $this->read_at?->toDateTimeString(),
            'created_at' => $this->created_at->toDateTimeString(),
            'time_ago' => $this->created_at->diffForHumans(),
        ];
    }
}
