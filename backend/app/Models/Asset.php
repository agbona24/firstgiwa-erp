<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'name',
        'asset_code',
        'description',
        'category',
        'purchase_price',
        'current_value',
        'salvage_value',
        'purchase_date',
        'depreciation_method',
        'useful_life_years',
        'accumulated_depreciation',
        'last_depreciation_date',
        'status',
        'disposal_date',
        'disposal_value',
        'location',
        'assigned_to',
        'serial_number',
        'supplier',
        'warranty_expiry',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'current_value' => 'decimal:2',
        'salvage_value' => 'decimal:2',
        'accumulated_depreciation' => 'decimal:2',
        'disposal_value' => 'decimal:2',
        'purchase_date' => 'date',
        'disposal_date' => 'date',
        'last_depreciation_date' => 'date',
    ];

    protected $appends = ['net_book_value', 'age_years', 'depreciation_per_year'];

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Accessors
    public function getNetBookValueAttribute()
    {
        return $this->purchase_price - $this->accumulated_depreciation;
    }

    public function getAgeYearsAttribute()
    {
        if (!$this->purchase_date) return 0;
        return now()->diffInYears($this->purchase_date);
    }

    public function getDepreciationPerYearAttribute()
    {
        if ($this->depreciation_method === 'none' || $this->useful_life_years <= 0) {
            return 0;
        }
        
        if ($this->depreciation_method === 'straight_line') {
            return ($this->purchase_price - $this->salvage_value) / $this->useful_life_years;
        }
        
        // declining_balance - typically 20-25% of remaining value
        return $this->current_value * 0.20;
    }

    // Methods
    public function calculateDepreciation()
    {
        if ($this->depreciation_method === 'none') {
            return 0;
        }

        $yearsUsed = $this->age_years;
        
        if ($this->depreciation_method === 'straight_line') {
            $annualDepreciation = ($this->purchase_price - $this->salvage_value) / $this->useful_life_years;
            $totalDepreciation = min($annualDepreciation * $yearsUsed, $this->purchase_price - $this->salvage_value);
            return $totalDepreciation;
        }
        
        // declining_balance
        $rate = 2 / $this->useful_life_years; // Double declining
        $value = $this->purchase_price;
        $totalDepreciation = 0;
        
        for ($i = 0; $i < $yearsUsed; $i++) {
            $depreciation = $value * $rate;
            if ($value - $depreciation < $this->salvage_value) {
                $depreciation = $value - $this->salvage_value;
            }
            $totalDepreciation += $depreciation;
            $value -= $depreciation;
        }
        
        return $totalDepreciation;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($asset) {
            if (!$asset->asset_code) {
                $prefix = 'AST';
                $lastAsset = static::withTrashed()->orderBy('id', 'desc')->first();
                $nextNumber = $lastAsset ? $lastAsset->id + 1 : 1;
                $asset->asset_code = $prefix . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            }
            
            if (!$asset->current_value) {
                $asset->current_value = $asset->purchase_price;
            }
        });
    }
}
