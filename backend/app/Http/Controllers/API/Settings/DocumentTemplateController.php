<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class DocumentTemplateController extends Controller
{
    protected $group = 'templates';
    protected $key = 'documents';

    protected $defaults = [
        [
            'id' => 1,
            'name' => 'Invoice',
            'description' => 'Sales invoice sent to customers',
            'fields' => ['Logo', 'Company Info', 'Customer Details', 'Line Items', 'Tax Summary', 'Total', 'Payment Terms', 'Footer Notes', 'Bank Details'],
            'last_modified' => '2026-01-15',
        ],
        [
            'id' => 2,
            'name' => 'Receipt',
            'description' => 'Payment receipt for customers',
            'fields' => ['Logo', 'Receipt Number', 'Customer', 'Amount Paid', 'Payment Method', 'Balance', 'Footer'],
            'last_modified' => '2026-01-10',
        ],
        [
            'id' => 3,
            'name' => 'Purchase Order',
            'description' => 'Order sent to suppliers',
            'fields' => ['Logo', 'Company Info', 'Supplier Details', 'Line Items', 'Delivery Terms', 'Total', 'Approval Signatures'],
            'last_modified' => '2025-12-20',
        ],
        [
            'id' => 4,
            'name' => 'Delivery Note',
            'description' => 'Accompanies goods delivered to customers',
            'fields' => ['Logo', 'DN Number', 'Customer', 'Items', 'Quantities', 'Driver Info', 'Receiver Signature'],
            'last_modified' => '2025-12-18',
        ],
        [
            'id' => 5,
            'name' => 'Goods Received Note',
            'description' => 'Confirms receipt of goods from suppliers',
            'fields' => ['Logo', 'GRN Number', 'Supplier', 'PO Reference', 'Items Received', 'Condition Notes', 'Receiver Signature'],
            'last_modified' => '2025-11-30',
        ],
        [
            'id' => 6,
            'name' => 'Payslip',
            'description' => 'Monthly salary breakdown for staff',
            'fields' => ['Company Info', 'Employee Details', 'Earnings', 'Deductions', 'Net Pay', 'YTD Summary'],
            'last_modified' => '2026-01-25',
        ],
    ];

    public function index()
    {
        $templates = Setting::get($this->group, $this->key, $this->defaults);

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'templates' => 'required|array',
            'templates.*.name' => 'required|string|max:255',
            'templates.*.description' => 'nullable|string|max:500',
            'templates.*.fields' => 'nullable|array',
            'templates.*.fields.*' => 'string|max:255',
            'templates.*.last_modified' => 'nullable|string|max:20',
        ]);

        $names = collect($request->templates)
            ->pluck('name')
            ->map(fn ($n) => mb_strtolower(trim($n)));
        if ($names->count() !== $names->unique()->count()) {
            return response()->json([
                'success' => false,
                'message' => 'Template names must be unique.',
            ], 422);
        }

        Setting::set($this->group, $this->key, $request->templates);

        return response()->json([
            'success' => true,
            'message' => 'Document templates updated successfully',
        ]);
    }
}
