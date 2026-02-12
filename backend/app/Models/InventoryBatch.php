<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryBatch extends Model
{
    use Auditable;

    protected $fillable = [
        'batch_number',
        'product_id',
        'warehouse_id',
        'production_date',
        'expiry_date',
        'initial_quantity',
        'current_quantity',
        'unit_cost',
        'source_type',
        'source_id',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'production_date' => 'date',
        'expiry_date' => 'date',
        'initial_quantity' => 'decimal:3',
        'current_quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
    ];

    /**
     * Status constants.
     */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_DEPLETED = 'depleted';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_QUARANTINE = 'quarantine';

    /**
     * Get the audit reference for this model.
     */
    public function getAuditReference(): ?string
    {
        return $this->batch_number;
    }

    /**
     * Get the product for this batch.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the warehouse for this batch.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the user who created this batch.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get stock movements for this batch.
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'batch_id');
    }

    /**
     * Scope to get active batches.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope to get batches with available stock.
     */
    public function scopeWithStock($query)
    {
        return $query->where('current_quantity', '>', 0);
    }

    /**
     * Scope to get batches expiring soon.
     */
    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->where('expiry_date', '<=', now()->addDays($days))
            ->where('expiry_date', '>', now())
            ->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope to get expired batches.
     */
    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now())
            ->where('status', '!=', self::STATUS_EXPIRED);
    }

    /**
     * Check if batch is expired.
     */
    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    /**
     * Check if batch has available stock.
     */
    public function hasStock(): bool
    {
        return $this->current_quantity > 0;
    }

    /**
     * Get total value of remaining stock.
     */
    public function getTotalValueAttribute(): float
    {
        return round($this->current_quantity * $this->unit_cost, 2);
    }

    /**
     * Deduct quantity from batch.
     */
    public function deductQuantity(float $quantity): void
    {
        $this->current_quantity -= $quantity;

        if ($this->current_quantity <= 0) {
            $this->current_quantity = 0;
            $this->status = self::STATUS_DEPLETED;
        }

        $this->save();
    }

    /**
     * Add quantity to batch.
     */
    public function addQuantity(float $quantity): void
    {
        $this->current_quantity += $quantity;

        if ($this->status === self::STATUS_DEPLETED && $this->current_quantity > 0) {
            $this->status = self::STATUS_ACTIVE;
        }

        $this->save();
    }
}
