<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>GRN #{{ $grn->grn_number ?? 'GRN-' . $purchaseOrder->po_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.4; }
        .container { padding: 30px; max-width: 800px; margin: 0 auto; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #0891b2; padding-bottom: 20px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo { max-height: 60px; max-width: 180px; }
        .company-name { font-size: 20px; font-weight: bold; color: #0891b2; }
        .document-title { text-align: right; }
        .document-title h1 { font-size: 22px; color: #0891b2; font-weight: bold; margin-bottom: 5px; }
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
        th { background: #0891b2; color: white; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        th:first-child { border-radius: 4px 0 0 0; }
        th:last-child { border-radius: 0 4px 0 0; }
        td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        /* Condition Box */
        .condition-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 15px; margin-bottom: 20px; }
        .condition-box h3 { font-size: 10px; text-transform: uppercase; color: #047857; margin-bottom: 8px; }
        .condition-box.warning { background: #fef3c7; border-color: #fcd34d; }
        .condition-box.warning h3 { color: #92400e; }
        
        /* Signature Section */
        .signature-section { display: table; width: 100%; margin-top: 40px; }
        .signature-box { display: table-cell; width: 50%; padding: 0 10px; }
        .signature-box .line { border-bottom: 1px solid #1e293b; margin-bottom: 8px; height: 40px; }
        .signature-box .label { font-size: 10px; color: #64748b; text-transform: uppercase; }
        
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
                <h1>GOODS RECEIVED NOTE</h1>
                <div class="number">#{{ $grn->grn_number ?? 'GRN-' . str_pad($purchaseOrder->id, 6, '0', STR_PAD_LEFT) }}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
                    Date: {{ \Carbon\Carbon::now()->format('d M Y') }}
                </div>
            </div>
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
            <div class="info-row">
                @if($template['show_supplier_details'])
                <div class="info-cell" style="padding-right: 10px;">
                    <div class="info-box">
                        <h3>Received From</h3>
                        <p class="name">{{ $purchaseOrder->supplier->name ?? 'N/A' }}</p>
                        <p>{{ $purchaseOrder->supplier->address ?? '' }}</p>
                        <p>{{ $purchaseOrder->supplier->phone ?? '' }}</p>
                    </div>
                </div>
                @endif
                @if($template['show_po_reference'])
                <div class="info-cell" style="padding-left: 10px;">
                    <div class="info-box">
                        <h3>PO Reference</h3>
                        <p><strong>PO #:</strong> {{ $purchaseOrder->po_number }}</p>
                        <p><strong>PO Date:</strong> {{ $purchaseOrder->created_at->format('d M Y') }}</p>
                        <p><strong>Expected:</strong> {{ $purchaseOrder->expected_date ? \Carbon\Carbon::parse($purchaseOrder->expected_date)->format('d M Y') : 'N/A' }}</p>
                    </div>
                </div>
                @endif
            </div>
        </div>
        
        <!-- Items Received -->
        @if($template['show_items_received'])
        <div class="items-section">
            <h3>Items Received</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 35%;">Description</th>
                        <th class="text-center" style="width: 15%;">Ordered</th>
                        <th class="text-center" style="width: 15%;">Received</th>
                        <th class="text-center" style="width: 15%;">Variance</th>
                        <th style="width: 15%;">Condition</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($purchaseOrder->items as $index => $item)
                    @php
                        $received = $item->received_quantity ?? $item->quantity;
                        $variance = $received - $item->quantity;
                    @endphp
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>
                            <strong>{{ $item->product->name ?? 'Item' }}</strong>
                        </td>
                        <td class="text-center">{{ number_format($item->quantity, 0) }} {{ $item->unit ?? 'pcs' }}</td>
                        <td class="text-center">{{ number_format($received, 0) }} {{ $item->unit ?? 'pcs' }}</td>
                        <td class="text-center" style="color: {{ $variance == 0 ? '#16a34a' : ($variance > 0 ? '#0891b2' : '#dc2626') }}">
                            {{ $variance >= 0 ? '+' : '' }}{{ number_format($variance, 0) }}
                        </td>
                        <td>{{ $item->condition ?? 'Good' }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
        
        <!-- Condition Notes -->
        @if($template['show_condition_notes'])
        <div class="condition-box {{ isset($conditionNotes) && $conditionNotes ? 'warning' : '' }}">
            <h3>Condition Notes / Remarks</h3>
            <p>{{ $conditionNotes ?? 'All items received in good condition.' }}</p>
        </div>
        @endif
        
        <!-- Signatures -->
        @if($template['show_receiver_signature'])
        <div class="signature-section">
            <div class="signature-box">
                <div class="line"></div>
                <div class="label">Received By</div>
                <p style="font-size: 10px; color: #64748b; margin-top: 3px;">Name: ____________________</p>
                <p style="font-size: 10px; color: #64748b;">Date: ____________________</p>
            </div>
            <div class="signature-box">
                <div class="line"></div>
                <div class="label">Verified By (Store Manager)</div>
                <p style="font-size: 10px; color: #64748b; margin-top: 3px;">Name: ____________________</p>
                <p style="font-size: 10px; color: #64748b;">Date: ____________________</p>
            </div>
        </div>
        @endif
        
        <!-- Footer -->
        <div class="footer">
            <p>This document confirms receipt of goods. Any discrepancies must be reported within 24 hours.</p>
            <p style="margin-top: 5px;">{{ $company['phone'] ?? '' }} | {{ $company['email'] ?? '' }}</p>
        </div>
    </div>
</body>
</html>
