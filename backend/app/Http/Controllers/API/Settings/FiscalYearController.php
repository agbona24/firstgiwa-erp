<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FiscalYearController extends Controller
{
    protected $group = 'fiscal';

    /**
     * Get fiscal year settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'fiscal_year_start_month' => 1,
            'fiscal_year_start_day' => 1,
            'current_fiscal_year' => date('Y'),
            'auto_close_fiscal_year' => false,
            'lock_closed_periods' => true,
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings)
        ]);
    }

    /**
     * Update fiscal year settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'fiscal_year_start_month' => 'nullable|integer|min:1|max:12',
            'fiscal_year_start_day' => 'nullable|integer|min:1|max:31',
            'current_fiscal_year' => 'nullable|integer|min:2000|max:2100',
            'auto_close_fiscal_year' => 'boolean',
            'lock_closed_periods' => 'boolean',
        ]);

        $fields = [
            'fiscal_year_start_month', 'fiscal_year_start_day',
            'current_fiscal_year', 'auto_close_fiscal_year',
            'lock_closed_periods'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Fiscal year settings updated successfully'
        ]);
    }
}
