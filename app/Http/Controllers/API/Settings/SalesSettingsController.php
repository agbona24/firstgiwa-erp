<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SalesSettingsController extends Controller
{
    protected $group = 'sales';

    /**
     * Get sales & billing settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'invoice_prefix' => 'INV',
            'invoice_next_number' => 1001,
            'receipt_prefix' => 'RCT',
            'default_payment_terms' => 30,
            'credit_enforcement' => true,
            'global_credit_limit' => 10000000,
            'allow_partial_payments' => true,
            'invoice_footer' => 'Thank you for your patronage. Goods once sold are not returnable.',
            'currency' => 'NGN',
            'currency_symbol' => '₦',
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings)
        ]);
    }

    /**
     * Update sales & billing settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'invoice_prefix' => 'nullable|string|max:10',
            'invoice_next_number' => 'nullable|integer|min:1',
            'receipt_prefix' => 'nullable|string|max:10',
            'default_payment_terms' => 'nullable|integer|min:0',
            'credit_enforcement' => 'boolean',
            'global_credit_limit' => 'nullable|numeric|min:0',
            'allow_partial_payments' => 'boolean',
            'invoice_footer' => 'nullable|string|max:500',
            'currency' => 'nullable|string|max:10',
            'currency_symbol' => 'nullable|string|max:10',
        ]);

        $fields = [
            'invoice_prefix', 'invoice_next_number', 'receipt_prefix',
            'default_payment_terms', 'credit_enforcement', 'global_credit_limit',
            'allow_partial_payments', 'invoice_footer', 'currency', 'currency_symbol'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Sales settings updated successfully'
        ]);
    }
}
