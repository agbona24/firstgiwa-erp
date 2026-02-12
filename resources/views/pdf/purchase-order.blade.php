<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order - {{ $purchaseOrder->po_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            padding: 20px;
        }
        .header {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .header-left {
            display: table-cell;
            width: 60%;
            vertical-align: top;
        }
        .header-right {
            display: table-cell;
            width: 40%;
            vertical-align: top;
            text-align: right;
        }
        .company-logo {
            max-height: 60px;
            max-width: 200px;
            margin-bottom: 10px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .company-address {
            color: #666;
            font-size: 11px;
        }
        .po-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .po-number {
            font-size: 14px;
            color: #666;
        }
        .info-section {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }
        .info-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 15px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
        }
        .info-box:first-child {
            border-right: none;
        }
        .info-title {
            font-size: 11px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .info-content {
            font-size: 12px;
            color: #334155;
        }
        .info-content strong {
            font-size: 14px;
            color: #1e293b;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .items-table th {
            background: #1e40af;
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
        }
        .items-table th:last-child,
        .items-table th:nth-child(3),
        .items-table th:nth-child(4),
        .items-table th:nth-child(5) {
            text-align: right;
        }
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .items-table td:last-child,
        .items-table td:nth-child(3),
        .items-table td:nth-child(4),
        .items-table td:nth-child(5) {
            text-align: right;
        }
        .items-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }
        .totals-section {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }
        .totals-notes {
            display: table-cell;
            width: 55%;
            vertical-align: top;
            padding-right: 20px;
        }
        .totals-box {
            display: table-cell;
            width: 45%;
            vertical-align: top;
        }
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        .totals-table td:last-child {
            text-align: right;
            font-weight: 600;
        }
        .totals-table .total-row {
            background: #1e40af;
            color: white;
            font-size: 14px;
        }
        .totals-table .total-row td {
            border: none;
            padding: 12px;
        }
        .notes-box {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 4px;
            padding: 12px;
        }
        .notes-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 5px;
        }
        .notes-content {
            color: #78350f;
            font-size: 11px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
        }
        .signature-section {
            display: table;
            width: 100%;
            margin-top: 50px;
        }
        .signature-box {
            display: table-cell;
            width: 45%;
            padding: 20px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 8px;
            font-size: 11px;
            color: #666;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-completed { background: #dbeafe; color: #1e40af; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            @if(!empty($logoBase64))
                <img src="{{ $logoBase64 }}" alt="{{ $tenant?->name ?? 'Company Logo' }}" class="company-logo">
            @elseif($tenant?->logo_url && file_exists(public_path(str_replace('/storage/', 'storage/', $tenant->logo_url))))
                <img src="{{ public_path(str_replace('/storage/', 'storage/', $tenant->logo_url)) }}" alt="{{ $tenant->name }}" class="company-logo">
            @endif
            <div class="company-name">{{ $tenant?->name ?? 'FIRSTGIWA ERP' }}</div>
            <div class="company-address">
                @if($tenant?->address)
                    {{ $tenant->address }}<br>
                @endif
                @if($tenant?->phone)
                    Tel: {{ $tenant->phone }}<br>
                @endif
                @if($tenant?->email)
                    Email: {{ $tenant->email }}
                @endif
            </div>
        </div>
        <div class="header-right">
            <div class="po-title">PURCHASE ORDER</div>
            <div class="po-number">
                <strong>PO #:</strong> {{ $purchaseOrder->po_number }}<br>
                <strong>Date:</strong> {{ $purchaseOrder->order_date?->format('d M Y') }}<br>
                @if($purchaseOrder->expected_delivery_date)
                    <strong>Expected Delivery:</strong> {{ $purchaseOrder->expected_delivery_date->format('d M Y') }}<br>
                @endif
                <span class="status-badge status-{{ $purchaseOrder->status }}">{{ ucfirst($purchaseOrder->status) }}</span>
            </div>
        </div>
    </div>

    <!-- Supplier & Delivery Info -->
    <div class="info-section">
        <div class="info-box">
            <div class="info-title">Supplier</div>
            <div class="info-content">
                <strong>{{ $supplier?->name ?? 'N/A' }}</strong><br>
                @if($supplier?->address)
                    {{ $supplier->address }}<br>
                @endif
                @if($supplier?->phone)
                    Tel: {{ $supplier->phone }}<br>
                @endif
                @if($supplier?->email)
                    Email: {{ $supplier->email }}<br>
                @endif
                @if($supplier?->contact_person)
                    Contact: {{ $supplier->contact_person }}
                @endif
            </div>
        </div>
        <div class="info-box">
            <div class="info-title">Delivery To</div>
            <div class="info-content">
                <strong>{{ $purchaseOrder->warehouse?->name ?? 'Main Warehouse' }}</strong><br>
                @if($purchaseOrder->warehouse?->address)
                    {{ $purchaseOrder->warehouse->address }}<br>
                @endif
                @if($purchaseOrder->warehouse?->phone)
                    Tel: {{ $purchaseOrder->warehouse->phone }}
                @endif
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%">#</th>
                <th style="width: 40%">Item Description</th>
                <th style="width: 15%">Quantity</th>
                <th style="width: 15%">Unit Price</th>
                <th style="width: 10%">Tax</th>
                <th style="width: 15%">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->product?->name ?? 'Unknown Product' }}</strong><br>
                        <span style="color: #666; font-size: 10px;">SKU: {{ $item->product?->sku ?? 'N/A' }}</span>
                    </td>
                    <td>{{ number_format($item->quantity, 2) }} {{ $item->product?->unit_of_measure ?? 'pcs' }}</td>
                    <td>{{ $currency }}{{ number_format($item->unit_price, 2) }}</td>
                    <td>{{ $item->tax_rate ?? 0 }}%</td>
                    <td>{{ $currency }}{{ number_format($item->total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals & Notes -->
    <div class="totals-section">
        <div class="totals-notes">
            @if($purchaseOrder->notes)
                <div class="notes-box">
                    <div class="notes-title">Notes / Instructions</div>
                    <div class="notes-content">{{ $purchaseOrder->notes }}</div>
                </div>
            @endif
        </div>
        <div class="totals-box">
            <table class="totals-table">
                <tr>
                    <td>Subtotal</td>
                    <td>{{ $currency }}{{ number_format($purchaseOrder->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td>Tax</td>
                    <td>{{ $currency }}{{ number_format($purchaseOrder->tax_amount, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td>TOTAL</td>
                    <td>{{ $currency }}{{ number_format($purchaseOrder->total_amount, 2) }}</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">Authorized Signature</div>
        </div>
        <div class="signature-box" style="width: 10%;"></div>
        <div class="signature-box">
            <div class="signature-line">Supplier Acknowledgment</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>This is a computer-generated document. Generated on {{ now()->format('d M Y, H:i') }}</p>
        <p>{{ $tenant?->name ?? 'FIRSTGIWA ERP' }} | {{ $tenant?->email ?? '' }} | {{ $tenant?->phone ?? '' }}</p>
    </div>
</body>
</html>
