<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationSettingsController extends Controller
{
    protected $group = 'notifications';

    /**
     * Get notification settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            // Stock Alerts
            'low_stock_alert' => true,
            'low_stock_email' => true,
            'critical_stock_alert' => true,
            
            // Sales & Orders
            'new_sales_order' => true,
            'sales_order_approved' => true,
            'sales_order_cancelled' => true,
            'order_confirmation' => true,
            
            // POS
            'pos_sale_complete' => true,
            'pos_refund_processed' => true,
            'pos_shift_end_summary' => true,
            
            // Payments
            'payment_received' => true,
            'payment_overdue' => true,
            'payment_due_reminder' => true,
            'payment_due_days_before' => 3,
            
            // Credit
            'credit_limit_warning' => true,
            'credit_limit_exceeded' => true,
            
            // Production
            'production_started' => true,
            'production_complete' => true,
            'production_materials_low' => true,
            
            // Purchases
            'purchase_order_created' => true,
            'purchase_order_received' => true,
            
            // Workflow
            'approval_request_notify' => true,
            'expense_approved_notify' => true,
            'payroll_ready' => true,
            'payroll_processed_notify' => true,
            
            // Summaries
            'daily_summary' => false,
            'daily_summary_email' => false,
            'weekly_summary' => true,
            'notification_email' => '',
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings)
        ]);
    }

    /**
     * Update notification settings
     */
    public function update(Request $request)
    {
        $request->validate([
            // Stock
            'low_stock_alert' => 'boolean',
            'low_stock_email' => 'boolean',
            'critical_stock_alert' => 'boolean',
            
            // Sales
            'new_sales_order' => 'boolean',
            'sales_order_approved' => 'boolean',
            'sales_order_cancelled' => 'boolean',
            'order_confirmation' => 'boolean',
            
            // POS
            'pos_sale_complete' => 'boolean',
            'pos_refund_processed' => 'boolean',
            'pos_shift_end_summary' => 'boolean',
            
            // Payments
            'payment_received' => 'boolean',
            'payment_overdue' => 'boolean',
            'payment_due_reminder' => 'boolean',
            'payment_due_days_before' => 'nullable|integer|min:1|max:30',
            
            // Credit
            'credit_limit_warning' => 'boolean',
            'credit_limit_exceeded' => 'boolean',
            
            // Production
            'production_started' => 'boolean',
            'production_complete' => 'boolean',
            'production_materials_low' => 'boolean',
            
            // Purchases
            'purchase_order_created' => 'boolean',
            'purchase_order_received' => 'boolean',
            
            // Workflow
            'approval_request_notify' => 'boolean',
            'expense_approved_notify' => 'boolean',
            'payroll_ready' => 'boolean',
            'payroll_processed_notify' => 'boolean',
            
            // Summaries
            'daily_summary' => 'boolean',
            'daily_summary_email' => 'boolean',
            'weekly_summary' => 'boolean',
            'notification_email' => 'nullable|email|max:255',
        ]);

        $fields = [
            'low_stock_alert', 'low_stock_email', 'critical_stock_alert',
            'new_sales_order', 'sales_order_approved', 'sales_order_cancelled', 'order_confirmation',
            'pos_sale_complete', 'pos_refund_processed', 'pos_shift_end_summary',
            'payment_received', 'payment_overdue', 'payment_due_reminder', 'payment_due_days_before',
            'credit_limit_warning', 'credit_limit_exceeded',
            'production_started', 'production_complete', 'production_materials_low',
            'purchase_order_created', 'purchase_order_received',
            'approval_request_notify', 'expense_approved_notify', 'payroll_ready', 'payroll_processed_notify',
            'daily_summary', 'daily_summary_email', 'weekly_summary', 'notification_email'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification settings updated successfully'
        ]);
    }
}
