<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Printer extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id', 'name', 'type', 'connection_type',
        'network_ip', 'network_port', 'usb_path',
        'is_default', 'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active'  => 'boolean',
        'network_port' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
