<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class ApprovalWorkflowController extends Controller
{
    protected $group = 'approvals';
    protected $workflowDefault = [
        'sales_order' => [
            ['min' => 0, 'max' => 100000, 'role' => 'Manager'],
            ['min' => 100001, 'max' => 500000, 'role' => 'Finance'],
            ['min' => 500001, 'max' => null, 'role' => 'Admin'],
        ],
        'purchase_order' => [
            ['min' => 0, 'max' => 100000, 'role' => 'Manager'],
            ['min' => 100001, 'max' => 500000, 'role' => 'Finance'],
            ['min' => 500001, 'max' => null, 'role' => 'Admin'],
        ],
        'expense' => [
            ['min' => 0, 'max' => 50000, 'role' => 'Manager'],
            ['min' => 50001, 'max' => 200000, 'role' => 'Finance'],
            ['min' => 200001, 'max' => null, 'role' => 'Admin'],
        ],
    ];

    /**
     * Get approval workflow settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            // Per-module approval toggles & thresholds
            'sales_order_require_approval' => true,
            'sales_order_threshold' => 1000000,
            'purchase_order_require_approval' => true,
            'purchase_order_threshold' => 500000,
            'expense_require_approval' => true,
            'expense_threshold' => 100000,
            'payroll_require_approval' => true,
            'inventory_adjustment_approval' => true,
            'credit_over_limit_approval' => true,
            'production_require_approval' => false,
            'production_threshold' => 0,

            // Discount approval
            'sales_discount_threshold' => 10,

            // Escalation & dual approval
            'require_dual_approval_above' => 2000000,
            'auto_escalate_after_hours' => 24,
            'max_approval_levels' => 2,

            // Role separation rules
            'creator_cannot_approve' => true,
            'booking_cannot_cashier' => true,
            'cashier_cannot_accountant' => true,
            'same_user_cannot_receive_po' => true,

            // Notification settings for approvals
            'notify_on_pending_approval' => true,
            'notify_on_approval_complete' => true,
            'notify_on_rejection' => true,
            'reminder_hours' => 12,

            // Multi-step workflow builder
            'workflow' => $this->workflowDefault,
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings)
        ]);
    }

    /**
     * Update approval workflow settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'sales_order_threshold' => 'nullable|numeric|min:0',
            'purchase_order_threshold' => 'nullable|numeric|min:0',
            'expense_threshold' => 'nullable|numeric|min:0',
            'production_threshold' => 'nullable|numeric|min:0',
            'sales_discount_threshold' => 'nullable|numeric|min:0|max:100',
            'require_dual_approval_above' => 'nullable|numeric|min:0',
            'auto_escalate_after_hours' => 'nullable|integer|min:1|max:168',
            'max_approval_levels' => 'nullable|integer|min:1|max:10',
            'reminder_hours' => 'nullable|integer|min:1|max:168',
            'workflow' => 'nullable|array',
            'workflow.sales_order' => 'nullable|array',
            'workflow.sales_order.*.min' => 'nullable|numeric|min:0',
            'workflow.sales_order.*.max' => 'nullable|numeric|min:0',
            'workflow.sales_order.*.role' => 'nullable|string|max:255',
            'workflow.purchase_order' => 'nullable|array',
            'workflow.purchase_order.*.min' => 'nullable|numeric|min:0',
            'workflow.purchase_order.*.max' => 'nullable|numeric|min:0',
            'workflow.purchase_order.*.role' => 'nullable|string|max:255',
            'workflow.expense' => 'nullable|array',
            'workflow.expense.*.min' => 'nullable|numeric|min:0',
            'workflow.expense.*.max' => 'nullable|numeric|min:0',
            'workflow.expense.*.role' => 'nullable|string|max:255',
        ]);

        $fields = [
            // Module toggles & thresholds
            'sales_order_require_approval', 'sales_order_threshold',
            'purchase_order_require_approval', 'purchase_order_threshold',
            'expense_require_approval', 'expense_threshold',
            'payroll_require_approval', 'inventory_adjustment_approval',
            'credit_over_limit_approval', 'production_require_approval',
            'production_threshold',
            // Discount
            'sales_discount_threshold',
            // Escalation
            'require_dual_approval_above', 'auto_escalate_after_hours', 'max_approval_levels',
            // Role separation
            'creator_cannot_approve', 'booking_cannot_cashier',
            'cashier_cannot_accountant', 'same_user_cannot_receive_po',
            // Notifications
            'notify_on_pending_approval', 'notify_on_approval_complete',
            'notify_on_rejection', 'reminder_hours',
            // Workflow builder
            'workflow',
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Approval workflow settings updated successfully'
        ]);
    }
}
