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
            // Paper & layout
            'receipt_paper_size'          => '80mm',
            'auto_print_pos'              => false,
            'copies_receipt'              => 1,
            'copies_invoice'              => 2,
            'copies_delivery'             => 3,
            // Header / footer content
            'receipt_header'              => '',
            'receipt_footer'              => 'Thank you for your patronage!',
            // Receipt content toggles
            'show_logo'                   => true,
            'show_company_name'           => true,
            'show_company_address'        => true,
            'show_company_phone'          => true,
            'show_company_email'          => false,
            'show_date_time'              => true,
            'show_cashier_name'           => true,
            'show_item_sku'               => false,
            'show_item_description'       => true,
            'show_quantity'               => true,
            'show_unit_price'             => true,
            'show_subtotal'               => true,
            'show_tax'                    => true,
            'show_discount'               => true,
            'show_payment_method'         => true,
            'show_change_given'           => true,
            'show_barcode'                => false,
            // Invoice settings
            'invoice_paper_size'          => 'A4',
            'show_bank_details_on_invoice' => true,
            'show_terms_on_invoice'       => true,
            'invoice_terms_text'          => 'Goods sold are not returnable.',
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
            'receipt_paper_size'           => 'nullable|in:58mm,80mm,A4',
            'auto_print_pos'               => 'boolean',
            'copies_receipt'               => 'nullable|integer|min:1|max:5',
            'copies_invoice'               => 'nullable|integer|min:1|max:5',
            'copies_delivery'              => 'nullable|integer|min:1|max:5',
            'receipt_header'               => 'nullable|string|max:500',
            'receipt_footer'               => 'nullable|string|max:500',
            'show_logo'                    => 'boolean',
            'show_company_name'            => 'boolean',
            'show_company_address'         => 'boolean',
            'show_company_phone'           => 'boolean',
            'show_company_email'           => 'boolean',
            'show_date_time'               => 'boolean',
            'show_cashier_name'            => 'boolean',
            'show_item_sku'                => 'boolean',
            'show_item_description'        => 'boolean',
            'show_quantity'                => 'boolean',
            'show_unit_price'              => 'boolean',
            'show_subtotal'                => 'boolean',
            'show_tax'                     => 'boolean',
            'show_discount'                => 'boolean',
            'show_payment_method'          => 'boolean',
            'show_change_given'            => 'boolean',
            'show_barcode'                 => 'boolean',
            'invoice_paper_size'           => 'nullable|in:A4,Letter,A5',
            'show_bank_details_on_invoice' => 'boolean',
            'show_terms_on_invoice'        => 'boolean',
            'invoice_terms_text'           => 'nullable|string|max:1000',
        ]);

        $fields = [
            'receipt_paper_size', 'auto_print_pos', 'copies_receipt',
            'copies_invoice', 'copies_delivery',
            'receipt_header', 'receipt_footer',
            'show_logo', 'show_company_name', 'show_company_address',
            'show_company_phone', 'show_company_email', 'show_date_time',
            'show_cashier_name', 'show_item_sku', 'show_item_description',
            'show_quantity', 'show_unit_price', 'show_subtotal', 'show_tax',
            'show_discount', 'show_payment_method', 'show_change_given',
            'show_barcode', 'invoice_paper_size',
            'show_bank_details_on_invoice', 'show_terms_on_invoice',
            'invoice_terms_text',
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
