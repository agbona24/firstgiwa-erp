<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Delivery Note #{{ $deliveryNote->dn_number ?? $salesOrder->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.4; }
        .container { padding: 30px; max-width: 800px; margin: 0 auto; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo { max-height: 60px; max-width: 180px; }
        .company-name { font-size: 20px; font-weight: bold; color: #7c3aed; }
        .document-title { text-align: right; }
        .document-title h1 { font-size: 24px; color: #7c3aed; font-weight: bold; margin-bottom: 5px; }
        .document-title .number { font-size: 14px; color: #64748b; }
        
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
        th { background: #7c3aed; color: white; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        th:first-child { border-radius: 4px 0 0 0; }
        th:last-child { border-radius: 0 4px 0 0; }
        td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        /* Driver Info */
        .driver-section { background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 6px; padding: 15px; margin-bottom: 25px; }
        .driver-section h3 { font-size: 10px; text-transform: uppercase; color: #7c3aed; margin-bottom: 10px; }
        .driver-grid { display: table; width: 100%; }
        .driver-cell { display: table-cell; width: 33%; }
        
        /* Signature Section */
        .signature-section { display: table; width: 100%; margin-top: 40px; }
        .signature-box { display: table-cell; width: 50%; padding: 0 10px; }
        .signature-box .line { border-bottom: 1px solid #1e293b; margin-bottom: 8px; height: 40px; }
        .signature-box .label { font-size: 10px; color: #64748b; text-transform: uppercase; }
        
        /* Notes */
        .notes-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-bottom: 20px; }
        .notes-box h3 { font-size: 10px; text-transform: uppercase; color: #92400e; margin-bottom: 5px; }
        
        /* Footer */
        .footer { margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 10px; color: #64748b; }
        
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
                <h1>DELIVERY NOTE</h1>
                <div class="number">#{{ $deliveryNote->dn_number ?? 'DN-' . $salesOrder->order_number }}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
                    Date: {{ \Carbon\Carbon::now()->format('d M Y') }}
                </div>
            </div>
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
            <div class="info-row">
                @if($template['show_customer_details'])
                <div class="info-cell" style="padding-right: 10px;">
                    <div class="info-box">
                        <h3>Deliver To</h3>
                        <p class="name">{{ $salesOrder->customer->name ?? 'N/A' }}</p>
                        <p>{{ $salesOrder->delivery_address ?? $salesOrder->customer->address ?? '' }}</p>
                        <p>{{ $salesOrder->customer->phone ?? '' }}</p>
                    </div>
                </div>
                @endif
                <div class="info-cell" style="padding-left: 10px;">
                    <div class="info-box">
                        <h3>Order Reference</h3>
                        <p><strong>Order #:</strong> {{ $salesOrder->order_number }}</p>
                        <p><strong>Order Date:</strong> {{ $salesOrder->created_at->format('d M Y') }}</p>
                        <p><strong>Formula:</strong> {{ $salesOrder->formula->name ?? 'N/A' }}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Items -->
        @if($template['show_line_items'])
        <div class="items-section">
            <h3>Items for Delivery</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 50%;">Description</th>
                        @if($template['show_quantities'])
                        <th class="text-center" style="width: 20%;">Quantity</th>
                        <th class="text-center" style="width: 25%;">Unit</th>
                        @endif
                    </tr>
                </thead>
                <tbody>
                    @foreach($salesOrder->items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>
                            <strong>{{ $item->product->name ?? $item->formula->name ?? 'Item' }}</strong>
                        </td>
                        @if($template['show_quantities'])
                        <td class="text-center">{{ number_format($item->quantity, 0) }}</td>
                        <td class="text-center">{{ $item->unit ?? 'pcs' }}</td>
                        @endif
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
        
        <!-- Driver Info -->
        @if($template['show_driver_info'])
        <div class="driver-section">
            <h3>Delivery Information</h3>
            <div class="driver-grid">
                <div class="driver-cell">
                    <p><strong>Driver Name:</strong></p>
                    <p>{{ $driver['name'] ?? '____________________' }}</p>
                </div>
                <div class="driver-cell">
                    <p><strong>Vehicle No:</strong></p>
                    <p>{{ $driver['vehicle'] ?? '____________________' }}</p>
                </div>
                <div class="driver-cell">
                    <p><strong>Phone:</strong></p>
                    <p>{{ $driver['phone'] ?? '____________________' }}</p>
                </div>
            </div>
        </div>
        @endif
        
        <!-- Notes -->
        @if(isset($salesOrder->delivery_notes) && $salesOrder->delivery_notes)
        <div class="notes-box">
            <h3>Delivery Notes</h3>
            <p>{{ $salesOrder->delivery_notes }}</p>
        </div>
        @endif
        
        <!-- Signatures -->
        @if($template['show_receiver_signature'])
        <div class="signature-section">
            <div class="signature-box">
                <div class="line"></div>
                <div class="label">Dispatcher Signature</div>
                <p style="font-size: 10px; color: #64748b; margin-top: 3px;">Name: ____________________</p>
                <p style="font-size: 10px; color: #64748b;">Date: ____________________</p>
            </div>
            <div class="signature-box">
                <div class="line"></div>
                <div class="label">Receiver Signature</div>
                <p style="font-size: 10px; color: #64748b; margin-top: 3px;">Name: ____________________</p>
                <p style="font-size: 10px; color: #64748b;">Date: ____________________</p>
            </div>
        </div>
        @endif
        
        <!-- Footer -->
        <div class="footer">
            <p>Please check all items before signing. Report any discrepancies immediately.</p>
            <p style="margin-top: 5px;">{{ $company['phone'] ?? '' }} | {{ $company['email'] ?? '' }}</p>
        </div>
    </div>
</body>
</html>
