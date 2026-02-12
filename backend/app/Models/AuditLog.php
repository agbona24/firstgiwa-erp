<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Auth;

class AuditLog extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'audit_logs';

    /**
     * Action constants.
     */
    public const ACTION_CREATE = 'CREATE';
    public const ACTION_UPDATE = 'UPDATE';
    public const ACTION_DELETE = 'DELETE';
    public const ACTION_APPROVE = 'APPROVE';
    public const ACTION_REJECT = 'REJECT';
    public const ACTION_CANCEL = 'CANCEL';
    public const ACTION_LOGIN = 'LOGIN';
    public const ACTION_LOGOUT = 'LOGOUT';
    public const ACTION_RESTORE = 'RESTORE';
    public const ACTION_EXPORT = 'EXPORT';
    public const ACTION_IMPORT = 'IMPORT';
    public const ACTION_PRINT = 'PRINT';
    public const ACTION_EMAIL = 'EMAIL';
    public const ACTION_STATUS_CHANGE = 'STATUS_CHANGE';
    public const ACTION_PAYMENT = 'PAYMENT';
    public const ACTION_STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT';
    public const ACTION_PRODUCTION = 'PRODUCTION';
    public const ACTION_BULK_ACTION = 'BULK_ACTION';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'user_email',
        'action',
        'auditable_type',
        'auditable_id',
        'auditable_type_display',
        'auditable_reference',
        'old_values',
        'new_values',
        'reason',
        'ip_address',
        'user_agent',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Get the user who performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the auditable model.
     */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Create an audit log entry.
     */
    public static function log(
        string $action,
        ?Model $model = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $reason = null,
        ?string $reference = null
    ): self {
        $user = Auth::user();
        $request = request();

        return static::create([
            'user_id' => $user?->id,
            'user_email' => $user?->email ?? 'system',
            'action' => $action,
            'auditable_type' => $model ? get_class($model) : null,
            'auditable_id' => $model?->id,
            'auditable_type_display' => $model ? class_basename($model) : null,
            'auditable_reference' => $reference ?? $model?->getAuditReference(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'reason' => $reason,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Log a login event.
     */
    public static function logLogin(User $user): self
    {
        $request = request();

        return static::create([
            'user_id' => $user->id,
            'user_email' => $user->email,
            'action' => self::ACTION_LOGIN,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Log a logout event.
     */
    public static function logLogout(User $user): self
    {
        $request = request();

        return static::create([
            'user_id' => $user->id,
            'user_email' => $user->email,
            'action' => self::ACTION_LOGOUT,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Scope to filter by action.
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to filter by user.
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by model type.
     */
    public function scopeByModelType($query, string $modelType)
    {
        return $query->where('auditable_type', $modelType);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
