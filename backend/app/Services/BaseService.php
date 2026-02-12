<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Base Service Class
 * 
 * All service classes should extend this base class.
 * Provides common functionality for:
 * - Transaction management
 * - User context
 * - Audit logging helpers
 */
abstract class BaseService
{
    /**
     * Get the currently authenticated user.
     */
    protected function user(): ?User
    {
        return Auth::user();
    }

    /**
     * Get the current user's ID.
     */
    protected function userId(): ?int
    {
        return $this->user()?->id;
    }

    /**
     * Check if the current user has a specific permission.
     */
    protected function hasPermission(string $permission): bool
    {
        return $this->user()?->hasPermission($permission) ?? false;
    }

    /**
     * Check if the current user has a specific role.
     */
    protected function hasRole(string|array $role): bool
    {
        return $this->user()?->hasRole($role) ?? false;
    }

    /**
     * Execute a callback within a database transaction.
     * Automatically rolls back on exception.
     */
    protected function transaction(callable $callback): mixed
    {
        return DB::transaction($callback);
    }

    /**
     * Generate a sequential reference number.
     * Format: PREFIX-YEAR-SEQUENCE (e.g., SO-2026-00001)
     */
    protected function generateReference(string $prefix, string $table, string $column): string
    {
        $year = date('Y');
        $pattern = "{$prefix}-{$year}-%";

        $lastRef = DB::table($table)
            ->where($column, 'like', $pattern)
            ->orderByDesc($column)
            ->value($column);

        if ($lastRef) {
            $lastNumber = (int) substr($lastRef, -5);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%s-%05d', $prefix, $year, $nextNumber);
    }

    /**
     * Set audit reason on a model before saving.
     */
    protected function setAuditReason(Model $model, string $reason): Model
    {
        if (method_exists($model, 'setAuditReason')) {
            $model->setAuditReason($reason);
        }
        return $model;
    }

    /**
     * Check if creator is different from approver (separation of duties).
     */
    protected function canApprove(Model $model, string $creatorField = 'created_by'): bool
    {
        $creatorId = $model->{$creatorField};
        return $this->userId() !== $creatorId;
    }

    /**
     * Validate that a value is greater than zero.
     */
    protected function assertPositive(float|int $value, string $fieldName): void
    {
        if ($value <= 0) {
            throw new \App\Exceptions\BusinessRuleException(
                "{$fieldName} must be greater than zero."
            );
        }
    }

    /**
     * Validate that a model exists and is not null.
     */
    protected function assertExists(?Model $model, string $modelName): void
    {
        if (!$model) {
            throw new \App\Exceptions\BusinessRuleException(
                "{$modelName} not found."
            );
        }
    }

    /**
     * Calculate percentage of a value.
     */
    protected function calculatePercentage(float $value, float $percentage): float
    {
        return round($value * ($percentage / 100), 2);
    }

    /**
     * Round to currency precision (2 decimal places).
     */
    protected function roundCurrency(float $value): float
    {
        return round($value, 2);
    }

    /**
     * Round to quantity precision (3 decimal places for kg/weight).
     */
    protected function roundQuantity(float $value): float
    {
        return round($value, 3);
    }
}
