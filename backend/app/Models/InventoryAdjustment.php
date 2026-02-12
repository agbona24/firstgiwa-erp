<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAdjustment extends Model
{
    use Auditable;

    protected $fillable = [
        'adjustment_number',
        'product_id',
        'warehouse_id',
        'batch_id',
        'adjustment_type',
        'quantity_change',
        'quantity_before',
        'quantity_after',
        'unit_cost',
        'total_value_impact',
        'reason',
        'notes',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'approval_notes',
    ];

    protected $casts = [
        'quantity_change' => 'decimal:3',
        'quantity_before' => 'decimal:3',
        'quantity_after' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'total_value_impact' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    /**
     * Adjustment type constants.
     */
    public const TYPE_LOSS = 'loss';
    public const TYPE_DRYING = 'drying';
    public const TYPE_DAMAGE = 'damage';
    public const TYPE_EXPIRY = 'expiry';
    public const TYPE_COUNT_CORRECTION = 'count_correction';
    public const TYPE_THEFT = 'theft';
    public const TYPE_FOUND = 'found';
    public const TYPE_OTHER = 'other';

    /**
     * Status constants.
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending_approval';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    /**
     * Types that decrease stock.
     */
    public const DECREASE_TYPES = [
        self::TYPE_LOSS,
        self::TYPE_DRYING,
        self::TYPE_DAMAGE,
        self::TYPE_EXPIRY,
        self::TYPE_THEFT,
    ];

    /**
     * Types that increase stock.
     */
    public const INCREASE_TYPES = [
        self::TYPE_FOUND,
        self::TYPE_COUNT_CORRECTION, // can be either
    ];

    /**
     * Get the audit reference for this model.
     */
    public function getAuditReference(): ?string
    {
        return $this->adjustment_number;
    }

    /**
     * Get the product for this adjustment.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the warehouse for this adjustment.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the batch for this adjustment.
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(InventoryBatch::class, 'batch_id');
    }

    /**
     * Get the user who created this adjustment.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who approved this adjustment.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope for pending approval.
     */
    public function scopePendingApproval($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for approved adjustments.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Check if adjustment requires approval based on threshold.
     */
    public function requiresApproval(): bool
    {
        $threshold = config('erp.approval_thresholds.inventory_adjustment', 100);
        return abs($this->quantity_change) >= $threshold;
    }

    /**
     * Check if adjustment is a decrease.
     */
    public function isDecrease(): bool
    {
        return $this->quantity_change < 0;
    }

    /**
     * Check if adjustment is an increase.
     */
    public function isIncrease(): bool
    {
        return $this->quantity_change > 0;
    }

    /**
     * Get human-readable adjustment type label.
     */
    public function getAdjustmentTypeLabelAttribute(): string
    {
        return match ($this->adjustment_type) {
            self::TYPE_LOSS => 'General Loss',
            self::TYPE_DRYING => 'Drying/Moisture Loss',
            self::TYPE_DAMAGE => 'Damaged Goods',
            self::TYPE_EXPIRY => 'Expired Goods',
            self::TYPE_COUNT_CORRECTION => 'Physical Count Correction',
            self::TYPE_THEFT => 'Theft/Missing',
            self::TYPE_FOUND => 'Found/Recovered',
            self::TYPE_OTHER => 'Other',
            default => $this->adjustment_type,
        };
    }

    /**
     * Submit for approval.
     */
    public function submitForApproval(): void
    {
        $this->status = self::STATUS_PENDING;
        $this->save();
    }

    /**
     * Approve the adjustment.
     */
    public function approve(int $approverId, ?string $notes = null): void
    {
        $this->status = self::STATUS_APPROVED;
        $this->approved_by = $approverId;
        $this->approved_at = now();
        $this->approval_notes = $notes;
        $this->save();
    }

    /**
     * Reject the adjustment.
     */
    public function reject(int $approverId, ?string $notes = null): void
    {
        $this->status = self::STATUS_REJECTED;
        $this->approved_by = $approverId;
        $this->approved_at = now();
        $this->approval_notes = $notes;
        $this->save();
    }
}
