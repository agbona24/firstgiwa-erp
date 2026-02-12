<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CreditSettingsController extends Controller
{
    protected $group = 'credit';

    /**
     * Get credit facility settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'enable_credit_sales' => true,
            'default_credit_limit' => 500000,
            'credit_period_days' => 30,
            'auto_block_overdue' => true,
            'overdue_block_days' => 7,
            'require_approval_over_limit' => true,
            'credit_check_on_order' => true,
            'send_credit_alerts' => true,
            'credit_alert_threshold' => 80,
            'allow_partial_credit' => true,
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings)
        ]);
    }

    /**
     * Update credit facility settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'enable_credit_sales' => 'boolean',
            'default_credit_limit' => 'nullable|numeric|min:0',
            'credit_period_days' => 'nullable|integer|min:1|max:365',
            'auto_block_overdue' => 'boolean',
            'overdue_block_days' => 'nullable|integer|min:1|max:90',
            'require_approval_over_limit' => 'boolean',
            'credit_check_on_order' => 'boolean',
            'send_credit_alerts' => 'boolean',
            'credit_alert_threshold' => 'nullable|integer|min:1|max:100',
            'allow_partial_credit' => 'boolean',
        ]);

        $fields = [
            'enable_credit_sales', 'default_credit_limit', 'credit_period_days',
            'auto_block_overdue', 'overdue_block_days', 'require_approval_over_limit',
            'credit_check_on_order', 'send_credit_alerts', 'credit_alert_threshold',
            'allow_partial_credit'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Credit settings updated successfully'
        ]);
    }
}
