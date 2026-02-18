<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name', 'slug', 'price', 'billing_period', 'description',
        'features', 'max_users', 'max_branches', 'max_products',
        'max_monthly_transactions', 'is_active', 'sort_order',
        'is_highlighted', 'badge', 'button_text',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
        'is_highlighted' => 'boolean',
        'max_users' => 'integer',
        'max_branches' => 'integer',
        'max_products' => 'integer',
        'max_monthly_transactions' => 'integer',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
