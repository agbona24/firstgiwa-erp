<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductionLoss extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_run_id',
        'loss_type',
        'quantity_lost',
        'unit_of_measure',
        'estimated_value',
        'reason',
        'corrective_action',
        'reported_by',
    ];

    protected $casts = [
        'quantity_lost' => 'decimal:2',
        'estimated_value' => 'decimal:2',
    ];

    public function productionRun()
    {
        return $this->belongsTo(ProductionRun::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
