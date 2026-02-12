<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order - {{ $purchaseOrder->po_number }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
            margin-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .po-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: bold;
            margin: 15px 0;
        }
        .greeting {
            margin-bottom: 20px;
        }
        .details-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #64748b;
        }
        .detail-value {
            font-weight: 600;
            color: #1e293b;
        }
        .total-row {
            background: #1e40af;
            color: white;
            padding: 12px;
            border-radius: 6px;
            margin-top: 15px;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
        }
        .note {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $tenant?->name ?? 'FactoryPulse' }}</div>
        @if($tenant?->address)
            <div style="color: #666; font-size: 14px;">{{ $tenant->address }}</div>
        @endif
    </div>

    <div class="po-badge">
        Purchase Order #{{ $purchaseOrder->po_number }}
    </div>

    <div class="greeting">
        <p>Dear <strong>{{ $supplier?->contact_person ?? $supplier?->name ?? 'Supplier' }}</strong>,</p>
        <p>Please find attached the Purchase Order from <strong>{{ $tenant?->name ?? 'our company' }}</strong>. We kindly request you to review and process this order at your earliest convenience.</p>
    </div>

    <div class="details-box">
        <h3 style="margin-top: 0; color: #1e40af;">Order Summary</h3>
        
        <div class="detail-row">
            <span class="detail-label">PO Number</span>
            <span class="detail-value">{{ $purchaseOrder->po_number }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Order Date</span>
            <span class="detail-value">{{ $purchaseOrder->order_date?->format('d M Y') }}</span>
        </div>
        @if($purchaseOrder->expected_delivery_date)
        <div class="detail-row">
            <span class="detail-label">Expected Delivery</span>
            <span class="detail-value">{{ $purchaseOrder->expected_delivery_date->format('d M Y') }}</span>
        </div>
        @endif
        <div class="detail-row">
            <span class="detail-label">Items Count</span>
            <span class="detail-value">{{ count($items) }} item(s)</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Subtotal</span>
            <span class="detail-value">NGN {{ number_format($purchaseOrder->subtotal, 2) }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Tax</span>
            <span class="detail-value">NGN {{ number_format($purchaseOrder->tax_amount, 2) }}</span>
        </div>
        
        <div class="total-row" style="display: flex; justify-content: space-between;">
            <span>Total Amount</span>
            <span style="font-size: 18px;">NGN {{ number_format($purchaseOrder->total_amount, 2) }}</span>
        </div>
    </div>

    <div class="note">
        <strong>📎 Attachment:</strong> Please find the detailed Purchase Order PDF attached to this email.
    </div>

    @if($purchaseOrder->notes)
    <div style="margin: 20px 0;">
        <strong>Additional Notes:</strong>
        <p style="color: #666;">{{ $purchaseOrder->notes }}</p>
    </div>
    @endif

    <p>If you have any questions or require clarification, please don't hesitate to contact us.</p>

    <p>Thank you for your continued partnership.</p>

    <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>{{ $tenant?->name ?? 'FactoryPulse' }}</strong><br>
        @if($tenant?->phone)
            Tel: {{ $tenant->phone }}<br>
        @endif
        @if($tenant?->email)
            Email: {{ $tenant->email }}
        @endif
    </p>

    <div class="footer">
        <p>This is an automated email from {{ $tenant?->name ?? 'FactoryPulse' }}</p>
        <p>© {{ date('Y') }} {{ $tenant?->name ?? 'FactoryPulse' }}. All rights reserved.</p>
    </div>
</body>
</html>
