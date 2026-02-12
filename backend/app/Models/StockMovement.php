<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    use Auditable;

    protected $fillable = [
        'reference_number',
        'product_id',
        'warehouse_id',
        'batch_id',
        'movement_type',
        'quantity',
        'unit_cost',
        'total_value',
        'quantity_before',
        'quantity_after',
        'reference_type',
        'reference_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'reason',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'total_value' => 'decimal:2',
        'quantity_before' => 'decimal:3',
        'quantity_after' => 'decimal:3',
    ];

    /**
     * Movement type constants.
     */
    public const TYPE_PURCHASE_IN = 'purchase_in';
    public const TYPE_PRODUCTION_IN = 'production_in';
    public const TYPE_PRODUCTION_OUT = 'production_out';
    public const TYPE_SALE_OUT = 'sale_out';
    public const TYPE_ADJUSTMENT_IN = 'adjustment_in';
    public const TYPE_ADJUSTMENT_OUT = 'adjustment_out';
    public const TYPE_TRANSFER_IN = 'transfer_in';
    public const TYPE_TRANSFER_OUT = 'transfer_out';
    public const TYPE_LOSS = 'loss';
    public const TYPE_DRYING = 'drying';
    public const TYPE_RETURN_IN = 'return_in';
    public const TYPE_RETURN_OUT = 'return_out';

    /**
     * Inbound movement types.
     */
    public const INBOUND_TYPES = [
        self::TYPE_PURCHASE_IN,
        self::TYPE_PRODUCTION_IN,
        self::TYPE_ADJUSTMENT_IN,
        self::TYPE_TRANSFER_IN,
        self::TYPE_RETURN_IN,
    ];

    /**
     * Outbound movement types.
     */
    public const OUTBOUND_TYPES = [
        self::TYPE_PRODUCTION_OUT,
        self::TYPE_SALE_OUT,
        self::TYPE_ADJUSTMENT_OUT,
        self::TYPE_TRANSFER_OUT,
        self::TYPE_LOSS,
        self::TYPE_DRYING,
        self::TYPE_RETURN_OUT,
    ];

    /**
     * Get the audit reference for this model.
     */
    public function getAuditReference(): ?string
    {
        return $this->reference_number;
    }

    /**
     * Get the product for this movement.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the warehouse for this movement.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the batch for this movement.
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(InventoryBatch::class, 'batch_id');
    }

    /**
     * Get the source document (polymorphic).
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the source warehouse (for transfers).
     */
    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    /**
     * Get the destination warehouse (for transfers).
     */
    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    /**
     * Get the user who created this movement.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if movement is inbound.
     */
    public function isInbound(): bool
    {
        return in_array($this->movement_type, self::INBOUND_TYPES);
    }

    /**
     * Check if movement is outbound.
     */
    public function isOutbound(): bool
    {
        return in_array($this->movement_type, self::OUTBOUND_TYPES);
    }

    /**
     * Scope to filter by movement type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('movement_type', $type);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope to get inbound movements.
     */
    public function scopeInbound($query)
    {
        return $query->whereIn('movement_type', self::INBOUND_TYPES);
    }

    /**
     * Scope to get outbound movements.
     */
    public function scopeOutbound($query)
    {
        return $query->whereIn('movement_type', self::OUTBOUND_TYPES);
    }

    /**
     * Get human-readable movement type label.
     */
    public function getMovementTypeLabelAttribute(): string
    {
        return match ($this->movement_type) {
            self::TYPE_PURCHASE_IN => 'Purchase Receipt',
            self::TYPE_PRODUCTION_IN => 'Production Output',
            self::TYPE_PRODUCTION_OUT => 'Production Consumption',
            self::TYPE_SALE_OUT => 'Sales',
            self::TYPE_ADJUSTMENT_IN => 'Stock Adjustment (+)',
            self::TYPE_ADJUSTMENT_OUT => 'Stock Adjustment (-)',
            self::TYPE_TRANSFER_IN => 'Transfer In',
            self::TYPE_TRANSFER_OUT => 'Transfer Out',
            self::TYPE_LOSS => 'Stock Loss',
            self::TYPE_DRYING => 'Drying Loss',
            self::TYPE_RETURN_IN => 'Customer Return',
            self::TYPE_RETURN_OUT => 'Supplier Return',
            default => $this->movement_type,
        };
    }
}
