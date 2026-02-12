<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'abbreviation',
        'is_base_unit',
        'base_unit_id',
        'conversion_factor',
    ];

    protected $casts = [
        'is_base_unit' => 'boolean',
        'conversion_factor' => 'decimal:6',
    ];

    /**
     * Get the tenant that owns this unit.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the base unit for conversion.
     */
    public function baseUnit()
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    /**
     * Get derived units from this base unit.
     */
    public function derivedUnits()
    {
        return $this->hasMany(Unit::class, 'base_unit_id');
    }

    /**
     * Get products using this unit.
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
