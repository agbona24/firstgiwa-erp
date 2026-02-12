<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayrollSettingsController extends Controller
{
    protected $group = 'payroll';

    /**
     * Get payroll & HR settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'pay_period' => 'monthly',
            'pay_day' => 28,
            'auto_calculate_tax' => true,
            'pension_rate' => 8,
            'nhf_rate' => 2.5,
            'overtime_rate' => 1.5,
            'late_deduction_rate' => 0.5,
            'absence_deduction_rate' => 100,
            'enable_loan_deductions' => true,
            'max_loan_percentage' => 33,
            'probation_period_months' => 3,
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings)
        ]);
    }

    /**
     * Update payroll & HR settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'pay_period' => 'nullable|in:weekly,biweekly,monthly',
            'pay_day' => 'nullable|integer|min:1|max:31',
            'auto_calculate_tax' => 'boolean',
            'pension_rate' => 'nullable|numeric|min:0|max:100',
            'nhf_rate' => 'nullable|numeric|min:0|max:100',
            'overtime_rate' => 'nullable|numeric|min:1|max:5',
            'late_deduction_rate' => 'nullable|numeric|min:0|max:100',
            'absence_deduction_rate' => 'nullable|numeric|min:0|max:100',
            'enable_loan_deductions' => 'boolean',
            'max_loan_percentage' => 'nullable|numeric|min:0|max:100',
            'probation_period_months' => 'nullable|integer|min:0|max:12',
        ]);

        $fields = [
            'pay_period', 'pay_day', 'auto_calculate_tax',
            'pension_rate', 'nhf_rate', 'overtime_rate',
            'late_deduction_rate', 'absence_deduction_rate',
            'enable_loan_deductions', 'max_loan_percentage',
            'probation_period_months'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Payroll settings updated successfully'
        ]);
    }
}
