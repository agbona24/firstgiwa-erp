<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $salesOrder->order_number ?? $salesOrder->so_number ?? $salesOrder->id }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.4; }
        .container { padding: 30px; max-width: 800px; margin: 0 auto; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo { max-height: 60px; max-width: 180px; }
        .company-name { font-size: 20px; font-weight: bold; color: #1e40af; }
        .document-title { text-align: right; }
        .document-title h1 { font-size: 28px; color: #1e40af; font-weight: bold; margin-bottom: 5px; }
        .document-title .number { font-size: 14px; color: #64748b; }
        .document-title .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
        .status-approved { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-fulfilled { background: #dbeafe; color: #1e40af; }
        
        /* Info Grid */
        .info-grid { display: table; width: 100%; margin-bottom: 25px; }
        .info-row { display: table-row; }
        .info-cell { display: table-cell; width: 50%; vertical-align: top; padding: 10px 0; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
        .info-box h3 { font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
        .info-box p { margin-bottom: 3px; }
        .info-box .name { font-weight: bold; font-size: 14px; color: #1e293b; }
        
        /* Items Table */
        .items-section { margin-bottom: 25px; }
        .items-section h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 10px; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e40af; color: white; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        th:first-child { border-radius: 4px 0 0 0; }
        th:last-child { border-radius: 0 4px 0 0; text-align: right; }
        td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        /* Totals */
        .totals-section { display: table; width: 100%; margin-bottom: 25px; }
        .totals-left { display: table-cell; width: 60%; vertical-align: top; }
        .totals-right { display: table-cell; width: 40%; vertical-align: top; }
        .totals-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
        .totals-box table { margin: 0; }
        .totals-box td { border: none; padding: 5px 0; }
        .totals-box .grand-total { font-size: 16px; font-weight: bold; color: #1e40af; border-top: 2px solid #1e40af; padding-top: 10px; margin-top: 5px; }
        
        /* Footer */
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .bank-details { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; margin-bottom: 15px; }
        .bank-details h3 { font-size: 11px; text-transform: uppercase; color: #1e40af; margin-bottom: 8px; }
        .bank-details p { margin-bottom: 3px; font-size: 11px; }
        .payment-terms { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-bottom: 15px; }
        .payment-terms h3 { font-size: 11px; text-transform: uppercase; color: #92400e; margin-bottom: 5px; }
        .notes { font-size: 10px; color: #64748b; text-align: center; margin-top: 20px; }
        
        /* Print styles */
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .container { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                @if($template['show_logo'] && $logoBase64)
                    <img src="{{ $logoBase64 }}" alt="Logo" class="logo">
                @endif
                @if($template['show_company_info'])
                    <div>
                        <div class="company-name">{{ $company['name'] ?? 'Company Name' }}</div>
                        <div style="font-size: 10px; color: #64748b;">{{ $company['address'] ?? '' }}</div>
                    </div>
                @endif
            </div>
            <div class="document-title">
                <h1>INVOICE</h1>
                <div class="number">#{{ $salesOrder->order_number ?? $salesOrder->so_number ?? $salesOrder->id }}</div>
                <span class="status status-{{ strtolower($salesOrder->status ?? 'pending') }}">{{ ucfirst($salesOrder->status ?? 'pending') }}</span>
            </div>
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
            <div class="info-row">
                @if($template['show_customer_details'])
                <div class="info-cell" style="padding-right: 10px;">
                    <div class="info-box">
                        <h3>Bill To</h3>
                        <p class="name">{{ $salesOrder->customer->name ?? 'N/A' }}</p>
                        <p>{{ $salesOrder->customer->address ?? '' }}</p>
                        <p>{{ $salesOrder->customer->phone ?? '' }}</p>
                        <p>{{ $salesOrder->customer->email ?? '' }}</p>
                    </div>
                </div>
                @endif
                <div class="info-cell" style="padding-left: 10px;">
                    <div class="info-box">
                        <h3>Invoice Details</h3>
                        @php
                            $orderDate = $salesOrder->order_date ?? $salesOrder->created_at ?? now();
                            $orderDateFormatted = $orderDate instanceof \Carbon\Carbon ? $orderDate->format('d M Y') : \Carbon\Carbon::parse($orderDate)->format('d M Y');
                            $dueDate = $salesOrder->due_date ?? null;
                            $dueDateFormatted = $dueDate ? \Carbon\Carbon::parse($dueDate)->format('d M Y') : 'N/A';
                        @endphp
                        <p><strong>Date:</strong> {{ $orderDateFormatted }}</p>
                        <p><strong>Due Date:</strong> {{ $dueDateFormatted }}</p>
                        <p><strong>Payment:</strong> {{ ucfirst($salesOrder->payment_type ?? 'N/A') }}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Line Items -->
        @if($template['show_line_items'])
        <div class="items-section">
            <h3>Items</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 40%;">Description</th>
                        <th class="text-center" style="width: 15%;">Qty</th>
                        <th class="text-right" style="width: 20%;">Unit Price</th>
                        <th class="text-right" style="width: 20%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($salesOrder->items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>
                            <strong>{{ $item->product->name ?? $item->formula->name ?? 'Item' }}</strong>
                            @if($item->notes)<br><span style="font-size: 10px; color: #64748b;">{{ $item->notes }}</span>@endif
                        </td>
                        <td class="text-center">{{ number_format($item->quantity, 0) }} {{ $item->unit ?? 'pcs' }}</td>
                        <td class="text-right">{{ $currency }}{{ number_format($item->unit_price, 2) }}</td>
                        <td class="text-right">{{ $currency }}{{ number_format($item->quantity * $item->unit_price, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
        
        <!-- Totals -->
        <div class="totals-section">
            <div class="totals-left">
                @if($template['show_payment_terms'] && isset($salesOrder->notes))
                <div class="payment-terms">
                    <h3>Notes</h3>
                    <p>{{ $salesOrder->notes }}</p>
                </div>
                @endif
            </div>
            @if($template['show_total'])
            <div class="totals-right">
                <div class="totals-box">
                    <table>
                        <tr>
                            <td>Subtotal</td>
                            <td class="text-right">{{ $currency }}{{ number_format($salesOrder->subtotal ?? $salesOrder->total_amount, 2) }}</td>
                        </tr>
                        @if($template['show_tax_summary'] && ($salesOrder->tax_amount ?? 0) > 0)
                        <tr>
                            <td>Tax ({{ $salesOrder->tax_rate ?? 0 }}%)</td>
                            <td class="text-right">{{ $currency }}{{ number_format($salesOrder->tax_amount, 2) }}</td>
                        </tr>
                        @endif
                        @if(($salesOrder->discount_amount ?? 0) > 0)
                        <tr>
                            <td>Discount</td>
                            <td class="text-right" style="color: #dc2626;">-{{ $currency }}{{ number_format($salesOrder->discount_amount, 2) }}</td>
                        </tr>
                        @endif
                        <tr class="grand-total">
                            <td><strong>Total</strong></td>
                            <td class="text-right"><strong>{{ $currency }}{{ number_format($salesOrder->total_amount, 2) }}</strong></td>
                        </tr>
                        @if(($salesOrder->amount_paid ?? 0) > 0)
                        <tr>
                            <td>Amount Paid</td>
                            <td class="text-right" style="color: #16a34a;">{{ $currency }}{{ number_format($salesOrder->amount_paid, 2) }}</td>
                        </tr>
                        <tr>
                            <td><strong>Balance Due</strong></td>
                            <td class="text-right"><strong>{{ $currency }}{{ number_format($salesOrder->total_amount - ($salesOrder->amount_paid ?? 0), 2) }}</strong></td>
                        </tr>
                        @endif
                    </table>
                </div>
            </div>
            @endif
        </div>
        
        <!-- Footer -->
        <div class="footer">
            @if($template['show_bank_details'] && isset($bankDetails))
            <div class="bank-details">
                <h3>Bank Details</h3>
                <p><strong>Bank:</strong> {{ $bankDetails['bank_name'] ?? 'N/A' }}</p>
                <p><strong>Account Name:</strong> {{ $bankDetails['account_name'] ?? 'N/A' }}</p>
                <p><strong>Account Number:</strong> {{ $bankDetails['account_number'] ?? 'N/A' }}</p>
            </div>
            @endif
            
            @if($template['show_footer_notes'])
            <div class="notes">
                <p>Thank you for your business!</p>
                <p style="margin-top: 5px;">{{ $company['phone'] ?? '' }} | {{ $company['email'] ?? '' }}</p>
            </div>
            @endif
        </div>
    </div>
</body>
</html>
