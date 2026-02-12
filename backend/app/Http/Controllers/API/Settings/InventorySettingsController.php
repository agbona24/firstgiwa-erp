<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventorySettingsController extends Controller
{
    protected $group = 'inventory';

    /**
     * Get inventory settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        // Return with defaults
        $defaults = [
            'default_warehouse' => 'Main Warehouse',
            'sku_prefix_raw' => 'RM',
            'sku_prefix_finished' => 'FG',
            'auto_generate_sku' => true,
            'enable_batch_tracking' => true,
            'enable_expiry_tracking' => true,
            'drying_loss_tolerance' => 5,
            'low_stock_threshold' => 20,
            'critical_stock_threshold' => 10,
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings)
        ]);
    }

    /**
     * Update inventory settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'default_warehouse' => 'nullable|string|max:255',
            'sku_prefix_raw' => 'nullable|string|max:10',
            'sku_prefix_finished' => 'nullable|string|max:10',
            'auto_generate_sku' => 'boolean',
            'enable_batch_tracking' => 'boolean',
            'enable_expiry_tracking' => 'boolean',
            'drying_loss_tolerance' => 'nullable|numeric|min:0|max:100',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'critical_stock_threshold' => 'nullable|integer|min:0',
        ]);

        $fields = [
            'default_warehouse', 'sku_prefix_raw', 'sku_prefix_finished',
            'auto_generate_sku', 'enable_batch_tracking', 'enable_expiry_tracking',
            'drying_loss_tolerance', 'low_stock_threshold', 'critical_stock_threshold'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Inventory settings updated successfully'
        ]);
    }
}
