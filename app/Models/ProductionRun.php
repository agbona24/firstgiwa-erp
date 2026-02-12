<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductionRun extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'production_number',
        'formula_id',
        'finished_product_id',
        'warehouse_id',
        'production_date',
        'target_quantity',
        'actual_output',
        'wastage_quantity',
        'wastage_percentage',
        'batch_number',
        'expiry_date',
        'status',
        'start_time',
        'end_time',
        'duration_minutes',
        'production_line',
        'notes',
        'created_by',
        'completed_by',
        'completed_at',
    ];

    protected $casts = [
        'production_date' => 'date',
        'expiry_date' => 'date',
        'target_quantity' => 'decimal:2',
        'actual_output' => 'decimal:2',
        'wastage_quantity' => 'decimal:2',
        'wastage_percentage' => 'decimal:2',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'completed_at' => 'datetime',
    ];

    public function formula()
    {
        return $this->belongsTo(Formula::class);
    }

    public function finishedProduct()
    {
        return $this->belongsTo(Product::class, 'finished_product_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function items()
    {
        return $this->hasMany(ProductionRunItem::class);
    }

    public function losses()
    {
        return $this->hasMany(ProductionLoss::class);
    }

    public function scopePlanned($query)
    {
        return $query->where('status', 'planned');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('production_date', [$startDate, $endDate]);
    }

    public function getEfficiencyPercentageAttribute(): float
    {
        if ($this->target_quantity <= 0) {
            return 0;
        }
        return round(($this->actual_output / $this->target_quantity) * 100, 2);
    }

    public static function generateProductionNumber(): string
    {
        $prefix = 'PRD';
        $date = now()->format('Ymd');
        $lastRun = static::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastRun ? (intval(substr($lastRun->production_number, -4)) + 1) : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
