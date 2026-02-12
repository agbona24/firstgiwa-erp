<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Auditable Trait
 * 
 * Apply this trait to any model that should have automatic audit logging.
 * It will log CREATE, UPDATE, and DELETE operations with old/new values.
 * 
 * Usage:
 *   use App\Traits\Auditable;
 *   
 *   class Product extends Model
 *   {
 *       use Auditable;
 *       
 *       // Optional: Define which attributes should NOT be audited
 *       protected array $auditExclude = ['updated_at', 'remember_token'];
 *       
 *       // Optional: Define a reference field for easier identification
 *       public function getAuditReference(): ?string
 *       {
 *           return $this->order_number ?? $this->id;
 *       }
 *   }
 */
trait Auditable
{
    /**
     * The audit reason for the current operation.
     */
    protected ?string $auditReason = null;

    /**
     * Boot the Auditable trait.
     */
    public static function bootAuditable(): void
    {
        // Log when a model is created
        static::created(function (Model $model) {
            $model->logAudit(AuditLog::ACTION_CREATE, null, $model->getAuditableAttributes());
        });

        // Log when a model is updated
        static::updated(function (Model $model) {
            $oldValues = $model->getOriginalAuditableAttributes();
            $newValues = $model->getChangedAuditableAttributes();

            // Only log if there are actual changes
            if (!empty($newValues)) {
                $model->logAudit(AuditLog::ACTION_UPDATE, $oldValues, $newValues);
            }
        });

        // Log when a model is deleted
        static::deleted(function (Model $model) {
            $model->logAudit(AuditLog::ACTION_DELETE, $model->getAuditableAttributes(), null);
        });
    }

    /**
     * Set the reason for the audit log.
     */
    public function setAuditReason(string $reason): self
    {
        $this->auditReason = $reason;
        return $this;
    }

    /**
     * Get the reason for the audit log.
     */
    public function getAuditReason(): ?string
    {
        return $this->auditReason;
    }

    /**
     * Clear the audit reason after logging.
     */
    protected function clearAuditReason(): void
    {
        $this->auditReason = null;
    }

    /**
     * Log an audit entry.
     */
    protected function logAudit(string $action, ?array $oldValues, ?array $newValues): void
    {
        AuditLog::log(
            action: $action,
            model: $this,
            oldValues: $oldValues,
            newValues: $newValues,
            reason: $this->getAuditReason(),
            reference: $this->getAuditReference()
        );

        $this->clearAuditReason();
    }

    /**
     * Log a custom audit action (e.g., APPROVE, CANCEL).
     */
    public function logCustomAudit(string $action, ?string $reason = null, ?array $additionalData = null): void
    {
        if ($reason) {
            $this->setAuditReason($reason);
        }

        AuditLog::log(
            action: $action,
            model: $this,
            oldValues: null,
            newValues: $additionalData,
            reason: $this->getAuditReason(),
            reference: $this->getAuditReference()
        );

        $this->clearAuditReason();
    }

    /**
     * Get the reference identifier for this model in audit logs.
     * Override in your model to provide a meaningful reference.
     */
    public function getAuditReference(): ?string
    {
        // Try common reference fields
        if (isset($this->order_number)) {
            return $this->order_number;
        }
        if (isset($this->invoice_number)) {
            return $this->invoice_number;
        }
        if (isset($this->code)) {
            return $this->code;
        }
        if (isset($this->sku)) {
            return $this->sku;
        }
        if (isset($this->name)) {
            return $this->name;
        }

        return (string) $this->id;
    }

    /**
     * Get attributes that should be audited.
     */
    protected function getAuditableAttributes(): array
    {
        $attributes = $this->getAttributes();
        return $this->filterAuditableAttributes($attributes);
    }

    /**
     * Get original values of auditable attributes before update.
     */
    protected function getOriginalAuditableAttributes(): array
    {
        $dirty = $this->getDirty();
        $original = [];

        foreach (array_keys($dirty) as $key) {
            if (!$this->isExcludedFromAudit($key)) {
                $original[$key] = $this->getOriginal($key);
            }
        }

        return $original;
    }

    /**
     * Get changed auditable attributes after update.
     */
    protected function getChangedAuditableAttributes(): array
    {
        $dirty = $this->getDirty();
        return $this->filterAuditableAttributes($dirty);
    }

    /**
     * Filter out excluded attributes from audit logging.
     */
    protected function filterAuditableAttributes(array $attributes): array
    {
        $filtered = [];

        foreach ($attributes as $key => $value) {
            if (!$this->isExcludedFromAudit($key)) {
                // Don't log sensitive data
                if ($this->isSensitiveAttribute($key)) {
                    $filtered[$key] = '[REDACTED]';
                } else {
                    $filtered[$key] = $value;
                }
            }
        }

        return $filtered;
    }

    /**
     * Check if an attribute should be excluded from audit.
     */
    protected function isExcludedFromAudit(string $key): bool
    {
        $defaultExclude = [
            'updated_at',
            'remember_token',
        ];

        $modelExclude = property_exists($this, 'auditExclude') ? $this->auditExclude : [];

        return in_array($key, array_merge($defaultExclude, $modelExclude));
    }

    /**
     * Check if an attribute contains sensitive data that should be redacted.
     */
    protected function isSensitiveAttribute(string $key): bool
    {
        $sensitiveFields = [
            'password',
            'password_hash',
            'secret',
            'api_key',
            'token',
            'credit_card',
            'cvv',
        ];

        foreach ($sensitiveFields as $field) {
            if (str_contains(strtolower($key), $field)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get audit logs for this model.
     */
    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
