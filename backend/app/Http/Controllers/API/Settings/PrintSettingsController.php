<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrintSettingsController extends Controller
{
    protected $group = 'print';

    /**
     * Get print & receipt settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'receipt_printer' => 'thermal',
            'receipt_width' => 80,
            'print_logo_on_receipt' => true,
            'receipt_header' => '',
            'receipt_footer' => 'Thank you for your patronage!',
            'auto_print_receipt' => false,
            'print_copies' => 1,
            'invoice_paper_size' => 'A4',
            'show_bank_details_on_invoice' => true,
            'show_terms_on_invoice' => true,
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings)
        ]);
    }

    /**
     * Update print & receipt settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'receipt_printer' => 'nullable|in:thermal,standard,none',
            'receipt_width' => 'nullable|integer|in:58,80',
            'print_logo_on_receipt' => 'boolean',
            'receipt_header' => 'nullable|string|max:500',
            'receipt_footer' => 'nullable|string|max:500',
            'auto_print_receipt' => 'boolean',
            'print_copies' => 'nullable|integer|min:1|max:5',
            'invoice_paper_size' => 'nullable|in:A4,Letter,A5',
            'show_bank_details_on_invoice' => 'boolean',
            'show_terms_on_invoice' => 'boolean',
        ]);

        $fields = [
            'receipt_printer', 'receipt_width', 'print_logo_on_receipt',
            'receipt_header', 'receipt_footer', 'auto_print_receipt',
            'print_copies', 'invoice_paper_size',
            'show_bank_details_on_invoice', 'show_terms_on_invoice'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Print settings updated successfully'
        ]);
    }
}
