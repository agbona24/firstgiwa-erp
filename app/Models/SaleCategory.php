<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleCategory extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class);
    }
}
