<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    protected $table = 'inventory';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'quantity',
        'reserved_quantity',
        'last_stock_take',
        'last_adjusted_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reserved_quantity' => 'integer',
        'last_stock_take' => 'datetime',
    ];

    protected $appends = ['available_quantity'];

    /**
     * Get the available quantity (quantity - reserved_quantity).
     */
    public function getAvailableQuantityAttribute(): int
    {
        return $this->quantity - $this->reserved_quantity;
    }

    /**
     * Get the product for this inventory record.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the warehouse for this inventory record.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the user who last adjusted this inventory.
     */
    public function lastAdjustedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_adjusted_by');
    }
}
