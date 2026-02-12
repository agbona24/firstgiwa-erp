<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    /**
     * Inventory type constants.
     */
    public const TYPE_RAW_MATERIAL = 'raw_material';
    public const TYPE_FINISHED_GOOD = 'finished_good';
    public const TYPE_CONSUMABLE = 'consumable';
    public const TYPE_PACKAGING = 'packaging';

    protected $fillable = [
        'sku',
        'name',
        'description',
        'category_id',
        'inventory_type',
        'unit_of_measure',
        'secondary_unit',
        'conversion_factor',
        'cost_price',
        'selling_price',
        'minimum_price',
        'reorder_level',
        'critical_level',
        'barcode',
        'image_url',
        'is_active',
        'track_inventory',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'minimum_price' => 'decimal:2',
        'conversion_factor' => 'decimal:4',
        'is_active' => 'boolean',
        'track_inventory' => 'boolean',
    ];

    /**
     * Attributes to exclude from audit logging.
     */
    protected array $auditExclude = ['updated_at'];

    /**
     * Get the audit reference for this model.
     */
    public function getAuditReference(): ?string
    {
        return $this->sku;
    }

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }

    // Alias for inventory relationship
    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public function salesOrderItems()
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function purchaseOrderItems()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereHas('inventory', function ($q) {
            $q->whereRaw('quantity <= reorder_level');
        });
    }

    public function scopeCriticalStock($query)
    {
        return $query->whereHas('inventory', function ($q) {
            $q->whereRaw('quantity <= critical_level');
        });
    }

    // Methods
    public function getTotalStockAttribute()
    {
        return $this->inventory()->sum('quantity');
    }

    public function getTotalAvailableStockAttribute()
    {
        return $this->inventory()->sum('available_quantity');
    }

    public function isLowStock()
    {
        return $this->total_stock <= $this->reorder_level;
    }

    public function isCriticalStock()
    {
        return $this->total_stock <= $this->critical_level;
    }
}
