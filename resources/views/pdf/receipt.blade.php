<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt #{{ $payment->reference ?? $payment->id }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.4; }
        .container { padding: 30px; max-width: 600px; margin: 0 auto; }
        
        /* Header */
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #16a34a; padding-bottom: 20px; }
        .logo { max-height: 60px; max-width: 180px; margin-bottom: 10px; }
        .company-name { font-size: 20px; font-weight: bold; color: #16a34a; }
        .company-info { font-size: 10px; color: #64748b; margin-top: 5px; }
        
        /* Receipt Title */
        .receipt-title { text-align: center; margin-bottom: 25px; }
        .receipt-title h1 { font-size: 28px; color: #16a34a; font-weight: bold; margin-bottom: 5px; }
        .receipt-title .number { font-size: 14px; color: #64748b; }
        .receipt-title .date { font-size: 12px; color: #64748b; margin-top: 5px; }
        
        /* Success Badge */
        .success-badge { background: #dcfce7; color: #166534; display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 25px; }
        
        /* Info Box */
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .info-box h3 { font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 10px; letter-spacing: 0.5px; }
        .info-box p { margin-bottom: 5px; }
        .info-box .name { font-weight: bold; font-size: 16px; color: #1e293b; }
        
        /* Amount Box */
        .amount-box { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 20px; }
        .amount-box .label { font-size: 12px; text-transform: uppercase; opacity: 0.9; margin-bottom: 5px; }
        .amount-box .amount { font-size: 32px; font-weight: bold; }
        
        /* Details Table */
        .details-table { width: 100%; margin-bottom: 20px; }
        .details-table td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .details-table td:first-child { color: #64748b; }
        .details-table td:last-child { text-align: right; font-weight: 500; }
        
        /* Balance Box */
        .balance-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .balance-box .label { font-size: 11px; text-transform: uppercase; color: #92400e; margin-bottom: 5px; }
        .balance-box .amount { font-size: 18px; font-weight: bold; color: #92400e; }
        
        /* Footer */
        .footer { margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px dashed #e2e8f0; }
        .footer p { font-size: 10px; color: #64748b; margin-bottom: 3px; }
        .footer .thank-you { font-size: 14px; font-weight: bold; color: #16a34a; margin-bottom: 10px; }
        
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
            @if($template['show_logo'] && $logoBase64)
                <img src="{{ $logoBase64 }}" alt="Logo" class="logo"><br>
            @endif
            @if($template['show_company_info'])
                <div class="company-name">{{ $company['name'] ?? 'Company Name' }}</div>
                <div class="company-info">{{ $company['address'] ?? '' }}</div>
                <div class="company-info">{{ $company['phone'] ?? '' }} | {{ $company['email'] ?? '' }}</div>
            @endif
        </div>
        
        <!-- Receipt Title -->
        <div class="receipt-title">
            <h1>PAYMENT RECEIPT</h1>
            <div class="number">#{{ $payment->reference ?? $payment->payment_reference ?? 'RCP-' . str_pad($payment->id ?? 0, 6, '0', STR_PAD_LEFT) }}</div>
            <div class="date">{{ \Carbon\Carbon::parse($payment->payment_date ?? now())->format('l, d F Y') }}</div>
        </div>
        
        <center><span class="success-badge">✓ PAYMENT RECEIVED</span></center>
        
        <!-- Customer Info -->
        @if($template['show_customer_details'])
        <div class="info-box">
            <h3>Received From</h3>
            <p class="name">{{ $payment->customer->name ?? $payment->payable->customer->name ?? 'Customer' }}</p>
            <p>{{ $payment->customer->address ?? $payment->payable->customer->address ?? '' }}</p>
            <p>{{ $payment->customer->phone ?? $payment->payable->customer->phone ?? '' }}</p>
        </div>
        @endif
        
        <!-- Amount Paid -->
        @if($template['show_amount_paid'])
        <div class="amount-box">
            <div class="label">Amount Received</div>
            <div class="amount">{{ $currency }}{{ number_format($payment->amount, 2) }}</div>
        </div>
        @endif
        
        <!-- Payment Details -->
        <table class="details-table">
            @if($template['show_payment_method'])
            <tr>
                <td>Payment Method</td>
                <td>{{ ucfirst($payment->payment_method ?? 'Cash') }}</td>
            </tr>
            @endif
            @if($payment->bankAccount)
            <tr>
                <td>Bank</td>
                <td>{{ $payment->bankAccount->bank_name ?? $payment->bankAccount->name ?? '' }}</td>
            </tr>
            @endif
            @if($payment->transaction_reference)
            <tr>
                <td>Transaction Ref</td>
                <td>{{ $payment->transaction_reference }}</td>
            </tr>
            @endif
            @if($payment->payable_type && $payment->payable)
            <tr>
                <td>For Invoice</td>
                <td>#{{ $payment->payable->order_number ?? $payment->payable->id }}</td>
            </tr>
            @endif
            <tr>
                <td>Received By</td>
                <td>{{ $payment->recorder->name ?? 'System' }}</td>
            </tr>
        </table>
        
        <!-- Balance -->
        @if($template['show_balance'] && isset($balance) && $balance > 0)
        <div class="balance-box">
            <div class="label">Outstanding Balance</div>
            <div class="amount">{{ $currency }}{{ number_format($balance, 2) }}</div>
        </div>
        @endif
        
        <!-- Footer -->
        @if($template['show_footer_notes'])
        <div class="footer">
            <p class="thank-you">Thank you for your payment!</p>
            <p>This is a computer-generated receipt and requires no signature.</p>
            <p>{{ $company['name'] ?? '' }} | {{ $company['phone'] ?? '' }}</p>
        </div>
        @endif
    </div>
</body>
</html>
