<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\ProductionRun;
use App\Models\Staff;
use App\Models\PayrollRun;
use App\Models\Setting;
use App\Services\DocumentTemplateService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    protected $templateService;

    public function __construct(DocumentTemplateService $templateService)
    {
        $this->templateService = $templateService;
    }

    /**
     * Generate Invoice PDF
     */
    public function invoice(SalesOrder $salesOrder)
    {
        $salesOrder->load(['customer', 'items.product', 'formula']);
        
        $data = $this->getCommonData('Invoice');
        $data['salesOrder'] = $salesOrder;
        
        $pdf = Pdf::loadView('pdf.invoice', $data);
        
        $orderNumber = $salesOrder->order_number ?? $salesOrder->so_number ?? $salesOrder->id;
        return $pdf->download("Invoice-{$orderNumber}.pdf");
    }

    /**
     * Preview Invoice PDF
     */
    public function invoicePreview(SalesOrder $salesOrder)
    {
        $salesOrder->load(['customer', 'items.product', 'formula']);
        
        $data = $this->getCommonData('Invoice');
        $data['salesOrder'] = $salesOrder;
        
        $pdf = Pdf::loadView('pdf.invoice', $data);
        
        $orderNumber = $salesOrder->order_number ?? $salesOrder->so_number ?? $salesOrder->id;
        return $pdf->stream("Invoice-{$orderNumber}.pdf");
    }

    /**
     * Generate Receipt PDF
     */
    public function receipt(Payment $payment)
    {
        $payment->load(['customer', 'payable', 'recorder', 'bankAccount']);
        
        $data = $this->getCommonData('Receipt');
        $data['payment'] = $payment;
        $data['balance'] = $payment->payable ? 
            ($payment->payable->total_amount - ($payment->payable->amount_paid ?? 0)) : 0;
        
        $pdf = Pdf::loadView('pdf.receipt', $data);
        
        $reference = $payment->reference ?? $payment->payment_reference ?? $payment->id;
        return $pdf->download("Receipt-{$reference}.pdf");
    }

    /**
     * Preview Receipt PDF
     */
    public function receiptPreview(Payment $payment)
    {
        $payment->load(['customer', 'payable', 'recorder', 'bankAccount']);
        
        $data = $this->getCommonData('Receipt');
        $data['payment'] = $payment;
        $data['balance'] = $payment->payable ? 
            ($payment->payable->total_amount - ($payment->payable->amount_paid ?? 0)) : 0;
        
        $pdf = Pdf::loadView('pdf.receipt', $data);
        
        $reference = $payment->reference ?? $payment->payment_reference ?? $payment->id;
        return $pdf->stream("Receipt-{$reference}.pdf");
    }

    /**
     * Generate Delivery Note PDF
     */
    public function deliveryNote(SalesOrder $salesOrder)
    {
        $salesOrder->load(['customer', 'items.product', 'formula']);
        
        $data = $this->getCommonData('Delivery Note');
        $data['salesOrder'] = $salesOrder;
        $data['deliveryNote'] = null; // Can be extended with DeliveryNote model
        $data['driver'] = [
            'name' => null,
            'vehicle' => null,
            'phone' => null,
        ];
        
        $pdf = Pdf::loadView('pdf.delivery-note', $data);
        
        $orderNumber = $salesOrder->order_number ?? $salesOrder->so_number ?? $salesOrder->id;
        return $pdf->download("DN-{$orderNumber}.pdf");
    }

    /**
     * Preview Delivery Note PDF
     */
    public function deliveryNotePreview(SalesOrder $salesOrder)
    {
        $salesOrder->load(['customer', 'items.product', 'formula']);
        
        $data = $this->getCommonData('Delivery Note');
        $data['salesOrder'] = $salesOrder;
        $data['deliveryNote'] = null;
        $data['driver'] = [
            'name' => null,
            'vehicle' => null,
            'phone' => null,
        ];
        
        $pdf = Pdf::loadView('pdf.delivery-note', $data);
        
        $orderNumber = $salesOrder->order_number ?? $salesOrder->so_number ?? $salesOrder->id;
        return $pdf->stream("DN-{$orderNumber}.pdf");
    }

    /**
     * Generate GRN PDF
     */
    public function grn(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'items.product']);
        
        $data = $this->getCommonData('Goods Received Note');
        $data['purchaseOrder'] = $purchaseOrder;
        $data['grn'] = null; // Can be extended with GRN model
        $data['conditionNotes'] = null;
        
        $pdf = Pdf::loadView('pdf.grn', $data);
        
        return $pdf->download("GRN-{$purchaseOrder->po_number}.pdf");
    }

    /**
     * Preview GRN PDF
     */
    public function grnPreview(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'items.product']);
        
        $data = $this->getCommonData('Goods Received Note');
        $data['purchaseOrder'] = $purchaseOrder;
        $data['grn'] = null;
        $data['conditionNotes'] = null;
        
        $pdf = Pdf::loadView('pdf.grn', $data);
        
        return $pdf->stream("GRN-{$purchaseOrder->po_number}.pdf");
    }

    /**
     * Generate Payslip PDF
     */
    public function payslip(PayrollRun $payrollRun, Staff $staff)
    {
        // department is a string field, not a relationship
        $payrollItem = $payrollRun->items()->where('staff_id', $staff->id)->first();
        
        if (!$payrollItem) {
            return response()->json([
                'success' => false,
                'message' => 'Staff not found in this payroll run'
            ], 404);
        }
        
        $data = $this->getCommonData('Payslip');
        $data['staff'] = $staff;
        $data['payrollRun'] = $payrollRun;
        $data['payrollItem'] = $payrollItem;
        $data['period'] = $payrollRun->period_start ? 
            \Carbon\Carbon::parse($payrollRun->period_start)->format('F Y') : 
            ($payrollRun->payroll_period ?? 'N/A');
        $data['netPayInWords'] = $this->numberToWords($payrollItem->net_pay ?? $payrollItem->net_amount ?? 0);
        $data['ytdSummary'] = $this->getYtdSummary($staff, $payrollRun);
        
        $pdf = Pdf::loadView('pdf.payslip', $data);
        
        $employeeId = $staff->employee_id ?? $staff->id;
        return $pdf->download("Payslip-{$employeeId}-{$payrollRun->id}.pdf");
    }

    /**
     * Generate Production Sheet PDF
     */
    public function productionSheet(ProductionRun $productionRun)
    {
        $productionRun->load(['formula', 'finishedProduct', 'warehouse', 'items.product', 'creator']);
        
        $data = $this->getCommonData('Production Sheet');
        $data['run'] = $productionRun;
        
        $pdf = Pdf::loadView('documents.production-sheet', $data);
        
        return $pdf->download("Production-Sheet-{$productionRun->production_number}.pdf");
    }

    /**
     * Preview Production Sheet PDF
     */
    public function productionSheetPreview(ProductionRun $productionRun)
    {
        $productionRun->load(['formula', 'finishedProduct', 'warehouse', 'items.product', 'creator']);
        
        $data = $this->getCommonData('Production Sheet');
        $data['run'] = $productionRun;
        
        $pdf = Pdf::loadView('documents.production-sheet', $data);
        
        return $pdf->stream("Production-Sheet-{$productionRun->production_number}.pdf");
    }

    /**
     * Preview Payslip PDF
     */
    public function payslipPreview(PayrollRun $payrollRun, Staff $staff)
    {
        // department is a string field, not a relationship
        $payrollItem = $payrollRun->items()->where('staff_id', $staff->id)->first();
        
        if (!$payrollItem) {
            return response()->json([
                'success' => false,
                'message' => 'Staff not found in this payroll run'
            ], 404);
        }
        
        $data = $this->getCommonData('Payslip');
        $data['staff'] = $staff;
        $data['payrollRun'] = $payrollRun;
        $data['payrollItem'] = $payrollItem;
        $data['period'] = $payrollRun->period_start ? 
            \Carbon\Carbon::parse($payrollRun->period_start)->format('F Y') : 
            ($payrollRun->payroll_period ?? 'N/A');
        $data['netPayInWords'] = $this->numberToWords($payrollItem->net_pay ?? $payrollItem->net_amount ?? 0);
        $data['ytdSummary'] = $this->getYtdSummary($staff, $payrollRun);
        
        $pdf = Pdf::loadView('pdf.payslip', $data);
        
        $employeeId = $staff->employee_id ?? $staff->id;
        return $pdf->stream("Payslip-{$employeeId}-{$payrollRun->id}.pdf");
    }

    /**
     * Get common data for all document templates
     */
    protected function getCommonData(string $templateName): array
    {
        $tenantId = Auth::user()->tenant_id;
        
        // Get company info
        $company = Setting::where('tenant_id', $tenantId)
            ->where('group', 'company')
            ->pluck('value', 'key')
            ->toArray();
        
        // Get bank details
        $bankDetails = Setting::where('tenant_id', $tenantId)
            ->where('group', 'bank_accounts')
            ->where('key', 'primary')
            ->first()?->value;
        
        // Get currency - Use NGN for Naira as DomPDF doesn't support ₦ symbol
        $currencySymbol = Setting::get('company', 'currency_symbol', '₦');
        $currency = ($currencySymbol === '₦' || $currencySymbol === 'NGN') ? 'NGN ' : $currencySymbol;
        
        // Get logo as base64
        $logoBase64 = $this->getLogoBase64($tenantId);
        
        // Get template settings
        $template = $this->templateService->getTemplateData($templateName);
        
        return [
            'company' => $company,
            'bankDetails' => $bankDetails,
            'currency' => $currency,
            'logoBase64' => $logoBase64,
            'template' => $template,
        ];
    }

    /**
     * Get logo as base64 for PDF rendering
     */
    protected function getLogoBase64($tenantId): ?string
    {
        $logoPath = Setting::where('tenant_id', $tenantId)
            ->where('group', 'company')
            ->where('key', 'logo')
            ->first()?->value;
        
        if (!$logoPath) {
            return null;
        }
        
        // Handle different storage paths
        $fullPath = Storage::disk('public')->path($logoPath);
        
        if (!file_exists($fullPath)) {
            // Try without disk prefix
            $fullPath = storage_path('app/public/' . $logoPath);
        }
        
        if (!file_exists($fullPath)) {
            return null;
        }
        
        $imageData = file_get_contents($fullPath);
        $mimeType = mime_content_type($fullPath);
        
        return 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
    }

    /**
     * Get YTD summary for payslip
     */
    protected function getYtdSummary(Staff $staff, PayrollRun $currentRun): array
    {
        $year = \Carbon\Carbon::parse($currentRun->period_start)->year;
        
        $items = \DB::table('payroll_items')
            ->join('payroll_runs', 'payroll_items.payroll_run_id', '=', 'payroll_runs.id')
            ->where('payroll_items.staff_id', $staff->id)
            ->whereYear('payroll_runs.period_start', $year)
            ->where('payroll_runs.status', 'paid')
            ->selectRaw('
                SUM(payroll_items.gross_pay) as gross,
                SUM(payroll_items.tax_deduction) as tax,
                SUM(payroll_items.pension_deduction) as pension,
                SUM(payroll_items.net_pay) as net
            ')
            ->first();
        
        return [
            'gross' => $items->gross ?? 0,
            'tax' => $items->tax ?? 0,
            'pension' => $items->pension ?? 0,
            'net' => $items->net ?? 0,
        ];
    }

    /**
     * Convert number to words (Nigerian style)
     */
    protected function numberToWords($number): string
    {
        $number = round($number, 2);
        $naira = floor($number);
        $kobo = round(($number - $naira) * 100);
        
        $words = $this->convertToWords($naira);
        
        if ($kobo > 0) {
            $words .= ' Naira, ' . $this->convertToWords($kobo) . ' Kobo';
        } else {
            $words .= ' Naira Only';
        }
        
        return ucfirst($words);
    }

    /**
     * Convert integer to words
     */
    protected function convertToWords($number): string
    {
        $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        if ($number == 0) return 'Zero';
        if ($number < 0) return 'Minus ' . $this->convertToWords(-$number);
        
        $words = '';
        
        if (($number / 1000000) >= 1) {
            $words .= $this->convertToWords(floor($number / 1000000)) . ' Million ';
            $number %= 1000000;
        }
        
        if (($number / 1000) >= 1) {
            $words .= $this->convertToWords(floor($number / 1000)) . ' Thousand ';
            $number %= 1000;
        }
        
        if (($number / 100) >= 1) {
            $words .= $ones[floor($number / 100)] . ' Hundred ';
            $number %= 100;
        }
        
        if ($number > 0) {
            if ($words != '') $words .= 'and ';
            
            if ($number < 20) {
                $words .= $ones[$number];
            } else {
                $words .= $tens[floor($number / 10)];
                if ($number % 10) {
                    $words .= '-' . $ones[$number % 10];
                }
            }
        }
        
        return trim($words);
    }

    /**
     * Preview Invoice Template with sample data
     */
    public function templatePreviewInvoice(Request $request)
    {
        $data = $this->getCommonData('Invoice');
        
        // Create sample sales order object
        $data['salesOrder'] = (object) [
            'order_number' => 'SO-2026-00001',
            'so_number' => 'SO-2026-00001',
            'id' => 1,
            'status' => 'approved',
            'order_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'subtotal' => 150000,
            'tax_amount' => 11250,
            'discount' => 0,
            'total_amount' => 161250,
            'notes' => 'Thank you for your business!',
            'customer' => (object) [
                'name' => 'Sample Customer Ltd',
                'address' => '123 Business Street, Lagos',
                'phone' => '08012345678',
                'email' => 'customer@example.com',
            ],
            'items' => collect([
                (object) [
                    'product' => (object) ['name' => 'Premium Feed Mix', 'sku' => 'PFM-001'],
                    'quantity' => 50,
                    'unit_price' => 2000,
                    'total' => 100000,
                    'unit' => 'bags',
                    'notes' => null,
                ],
                (object) [
                    'product' => (object) ['name' => 'Poultry Concentrate', 'sku' => 'PC-002'],
                    'quantity' => 25,
                    'unit_price' => 2000,
                    'total' => 50000,
                    'unit' => 'bags',
                    'notes' => null,
                ],
            ]),
            'formula' => null,
        ];
        
        $pdf = Pdf::loadView('pdf.invoice', $data);
        return $pdf->stream("Invoice-Preview.pdf");
    }

    /**
     * Preview Receipt Template with sample data
     */
    public function templatePreviewReceipt(Request $request)
    {
        $data = $this->getCommonData('Receipt');
        
        $data['payment'] = (object) [
            'reference' => 'RCP-2026-00001',
            'payment_reference' => 'RCP-2026-00001',
            'id' => 1,
            'amount' => 100000,
            'payment_method' => 'bank_transfer',
            'payment_date' => now()->format('Y-m-d H:i:s'),
            'transaction_reference' => 'TXN123456789',
            'status' => 'completed',
            'notes' => 'Partial payment for Invoice INV-2026-00001',
            'bank_name' => 'First Bank',
            'payable_type' => 'sales_order',
            'customer' => (object) [
                'name' => 'Sample Customer Ltd',
                'address' => '123 Business Street, Lagos',
                'phone' => '08012345678',
            ],
            'payable' => (object) [
                'order_number' => 'SO-2026-00001',
                'total_amount' => 161250,
            ],
            'user' => (object) [
                'name' => 'John Cashier',
            ],
        ];
        $data['balance'] = 61250;
        
        $pdf = Pdf::loadView('pdf.receipt', $data);
        return $pdf->stream("Receipt-Preview.pdf");
    }

    /**
     * Preview Delivery Note Template with sample data
     */
    public function templatePreviewDeliveryNote(Request $request)
    {
        $data = $this->getCommonData('Delivery Note');
        
        $data['salesOrder'] = (object) [
            'order_number' => 'SO-2026-00001',
            'so_number' => 'SO-2026-00001',
            'id' => 1,
            'status' => 'fulfilled',
            'order_date' => now()->format('Y-m-d'),
            'created_at' => now(),
            'delivery_address' => null,
            'customer' => (object) [
                'name' => 'Sample Customer Ltd',
                'address' => '123 Business Street, Lagos',
                'phone' => '08012345678',
            ],
            'items' => collect([
                (object) [
                    'product' => (object) ['name' => 'Premium Feed Mix', 'sku' => 'PFM-001', 'unit' => 'bags'],
                    'quantity' => 50,
                    'notes' => null,
                ],
                (object) [
                    'product' => (object) ['name' => 'Poultry Concentrate', 'sku' => 'PC-002', 'unit' => 'bags'],
                    'quantity' => 25,
                    'notes' => null,
                ],
            ]),
            'formula' => null,
            'notes' => 'Handle with care',
        ];
        $data['deliveryNote'] = (object) [
            'dn_number' => 'DN-2026-00001',
            'delivery_date' => now()->format('Y-m-d'),
        ];
        $data['driver'] = [
            'name' => 'Ibrahim Driver',
            'vehicle' => 'Toyota Hilux - ABC 123 XY',
            'phone' => '08098765432',
        ];
        
        $pdf = Pdf::loadView('pdf.delivery-note', $data);
        return $pdf->stream("DeliveryNote-Preview.pdf");
    }

    /**
     * Preview GRN Template with sample data
     */
    public function templatePreviewGRN(Request $request)
    {
        $data = $this->getCommonData('Goods Received Note');
        
        $data['purchaseOrder'] = (object) [
            'po_number' => 'PO-2026-00001',
            'id' => 1,
            'status' => 'received',
            'order_date' => now()->subDays(7)->format('Y-m-d'),
            'created_at' => now()->subDays(7),
            'expected_date' => now()->format('Y-m-d'),
            'expected_delivery_date' => now()->format('Y-m-d'),
            'supplier' => (object) [
                'name' => 'Sample Supplier Ltd',
                'address' => '456 Industrial Area, Ikeja',
                'phone' => '08011112222',
                'email' => 'supplier@example.com',
            ],
            'items' => collect([
                (object) [
                    'product' => (object) ['name' => 'Maize', 'sku' => 'RAW-001', 'unit' => 'bags'],
                    'quantity' => 100,
                    'received_quantity' => 100,
                    'unit_price' => 15000,
                    'unit' => 'bags',
                    'condition' => 'Good',
                ],
                (object) [
                    'product' => (object) ['name' => 'Soybean Meal', 'sku' => 'RAW-002', 'unit' => 'bags'],
                    'quantity' => 50,
                    'received_quantity' => 48,
                    'unit_price' => 25000,
                    'unit' => 'bags',
                    'condition' => 'Damaged',
                ],
            ]),
        ];
        $data['grn'] = (object) [
            'grn_number' => 'GRN-2026-00001',
            'received_date' => now()->format('Y-m-d'),
            'received_by' => 'Store Keeper',
        ];
        $data['conditionNotes'] = '2 bags of Soybean Meal damaged during transit. Supplier notified.';
        
        $pdf = Pdf::loadView('pdf.grn', $data);
        return $pdf->stream("GRN-Preview.pdf");
    }

    /**
     * Preview Payslip Template with sample data
     */
    public function templatePreviewPayslip(Request $request)
    {
        $data = $this->getCommonData('Payslip');
        
        $data['staff'] = (object) [
            'id' => 1,
            'employee_id' => 'EMP-001',
            'first_name' => 'John',
            'last_name' => 'Employee',
            'email' => 'john@company.com',
            'phone' => '08012345678',
            'department' => (object) ['name' => 'Operations'],
            'position' => 'Senior Operator',
            'date_of_joining' => '2023-01-15',
            'bank_name' => 'First Bank',
            'bank_account_number' => '0123456789',
        ];
        
        $data['payrollRun'] = (object) [
            'id' => 1,
            'payroll_number' => 'PAY-2026-01',
            'payroll_period' => 'January 2026',
            'period_start' => '2026-01-01',
            'period_end' => '2026-01-31',
            'payment_date' => '2026-01-25',
        ];
        
        $data['payrollItem'] = (object) [
            'basic_salary' => 150000,
            'housing_allowance' => 30000,
            'transport_allowance' => 15000,
            'other_earnings' => 5000,
            'gross_pay' => 200000,
            'tax' => 15000,
            'pension' => 16000,
            'other_deductions' => 2000,
            'total_deductions' => 33000,
            'net_pay' => 167000,
        ];
        
        $data['period'] = 'January 2026';
        $data['netPayInWords'] = $this->numberToWords(167000);
        $data['ytdSummary'] = [
            'gross' => 200000,
            'tax' => 15000,
            'pension' => 16000,
            'net' => 167000,
        ];
        
        $pdf = Pdf::loadView('pdf.payslip', $data);
        return $pdf->stream("Payslip-Preview.pdf");
    }

    /**
     * Preview Purchase Order Template with sample data
     */
    public function templatePreviewPurchaseOrder(Request $request)
    {
        $data = $this->getCommonData('Purchase Order');
        
        // Create a mock tenant object for the existing PO template
        $data['tenant'] = (object) [
            'name' => $data['company']['name'] ?? 'Company Name',
            'address' => $data['company']['address'] ?? '',
            'phone' => $data['company']['phone'] ?? '',
            'email' => $data['company']['email'] ?? '',
            'logo_url' => null,
        ];
        
        // PO with proper Carbon date objects
        $data['purchaseOrder'] = (object) [
            'po_number' => 'PO-2026-00001',
            'id' => 1,
            'status' => 'approved',
            'order_date' => now(),
            'expected_delivery_date' => now()->addDays(7),
            'subtotal' => 2750000,
            'tax_amount' => 206250,
            'total_amount' => 2956250,
            'notes' => 'Please deliver to our main warehouse. Contact store keeper on arrival.',
            'warehouse' => (object) [
                'name' => 'Main Warehouse',
                'address' => 'Industrial Estate, Lagos',
                'phone' => '08099998888',
            ],
        ];
        
        // Separate supplier object for the existing template
        $data['supplier'] = (object) [
            'name' => 'Sample Supplier Ltd',
            'address' => '456 Industrial Area, Ikeja, Lagos',
            'phone' => '08011112222',
            'email' => 'supplier@example.com',
            'contact_person' => 'Mr. Supplier Contact',
        ];
        
        // Separate items array for the existing template
        $data['items'] = collect([
            (object) [
                'product' => (object) ['name' => 'Maize', 'sku' => 'RAW-001', 'unit_of_measure' => 'bags'],
                'quantity' => 100,
                'unit_price' => 15000,
                'tax_rate' => 7.5,
                'total' => 1500000,
            ],
            (object) [
                'product' => (object) ['name' => 'Soybean Meal', 'sku' => 'RAW-002', 'unit_of_measure' => 'bags'],
                'quantity' => 50,
                'unit_price' => 25000,
                'tax_rate' => 7.5,
                'total' => 1250000,
            ],
        ]);
        
        $pdf = Pdf::loadView('pdf.purchase-order', $data);
        return $pdf->stream("PurchaseOrder-Preview.pdf");
    }
}
