<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderCharge extends Model
{
    protected $table = 'order_charges';

    protected $fillable = [
        'chargeable_type',
        'chargeable_id',
        'sale_charge_id',
        'charge_name',
        'charge_amount',
        'add_to_credit',
        'credited',
    ];

    protected $casts = [
        'charge_amount' => 'decimal:2',
        'add_to_credit' => 'boolean',
        'credited' => 'boolean',
    ];

    public function chargeable()
    {
        return $this->morphTo();
    }
}
