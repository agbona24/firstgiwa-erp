<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model
{
    use SoftDeletes, Auditable;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'code',
        'name',
        'location',
        'address',
        'phone',
        'type',
        'manager_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the audit reference for this model.
     */
    public function getAuditReference(): ?string
    {
        return $this->code;
    }

    /**
     * Get the manager for this warehouse.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get inventory records for this warehouse.
     */
    public function inventory(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * Get batches stored in this warehouse.
     */
    public function batches(): HasMany
    {
        return $this->hasMany(InventoryBatch::class);
    }

    /**
     * Get stock movements in this warehouse.
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Scope for active warehouses.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get total stock value in this warehouse.
     */
    public function getTotalStockValueAttribute(): float
    {
        return $this->batches()
            ->active()
            ->withStock()
            ->get()
            ->sum('total_value');
    }

    /**
     * Get total item count in this warehouse.
     */
    public function getTotalItemCountAttribute(): int
    {
        return $this->inventory()->sum('quantity');
    }
}
