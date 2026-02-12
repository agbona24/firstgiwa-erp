<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductionRunItem extends Model
{
    use HasFactory;

    protected $appends = [
        'quantity_required',
        'quantity_used',
    ];

    protected $fillable = [
        'production_run_id',
        'product_id',
        'planned_quantity',
        'actual_quantity',
        'variance',
        'unit_of_measure',
        'unit_cost',
        'total_cost',
        'batch_number',
    ];

    protected $casts = [
        'planned_quantity' => 'decimal:2',
        'actual_quantity' => 'decimal:2',
        'variance' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function getQuantityRequiredAttribute(): float
    {
        return (float) ($this->planned_quantity ?? 0);
    }

    public function getQuantityUsedAttribute(): float
    {
        return (float) ($this->actual_quantity ?? 0);
    }

    public function productionRun()
    {
        return $this->belongsTo(ProductionRun::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
