<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FormulaItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'formula_id',
        'product_id',
        'percentage',
        'sequence',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'sequence' => 'integer',
    ];

    // Relationships
    public function formula()
    {
        return $this->belongsTo(Formula::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
