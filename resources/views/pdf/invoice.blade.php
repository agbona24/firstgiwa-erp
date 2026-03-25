<!DOCTYPE html>
{{-- FIRST GIWA FEEDS – Cash/Sales Invoice format --}}
<html>
<head>
    <meta charset="utf-8">
    <title>Cash/Sales Invoice #{{ $salesOrder->order_number ?? $salesOrder->id }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; }
        .page { padding: 18px 22px; max-width: 780px; margin: 0 auto; }

        /* ── HEADER ── */
        .header { display: table; width: 100%; margin-bottom: 8px; }
        .header-logo { display: table-cell; width: 90px; vertical-align: middle; }
        .header-logo img { max-width: 80px; max-height: 70px; }
        .header-text { display: table-cell; vertical-align: middle; text-align: center; padding: 0 10px; }
        .company-name { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
        .company-address { font-size: 9.5px; margin-top: 3px; line-height: 1.5; }

        /* ── INVOICE TITLE BAR ── */
        .title-bar { display: table; width: 100%; border: 1.5px solid #000; margin-bottom: 0; }
        .title-fdo { display: table-cell; width: 35%; padding: 5px 8px; font-weight: bold; vertical-align: middle; border-right: 1px solid #000; font-size: 11px; }
        .title-center { display: table-cell; text-align: center; vertical-align: middle; padding: 5px 8px; }
        .title-center-text { font-size: 13px; font-weight: bold; border: 1.5px solid #000; padding: 4px 18px; display: inline-block; }

        /* ── INFO ROW ── */
        .info-row { border: 1.5px solid #000; border-top: none; display: table; width: 100%; }
        .info-row-inner { display: table-row; }
        .info-left  { display: table-cell; width: 65%; border-right: 1px solid #000; padding: 5px 8px; vertical-align: middle; }
        .info-right { display: table-cell; width: 35%; padding: 5px 8px; vertical-align: middle; }
        .info-field { margin-bottom: 3px; font-size: 10.5px; }
        .info-field span { font-weight: bold; }
        .category-row { border: 1.5px solid #000; border-top: none; padding: 4px 8px; font-size: 10.5px; }
        .category-row span { font-weight: bold; }

        /* ── ITEMS TABLE ── */
        table { width: 100%; border-collapse: collapse; }
        table.items { border: 1.5px solid #000; border-top: none; }
        table.items th {
            background: #1a1a1a;
            color: #fff;
            padding: 7px 6px;
            text-align: center;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        table.items th.left { text-align: left; }
        table.items td { padding: 5px 6px; border-bottom: 1px solid #ddd; font-size: 10.5px; }
        table.items td.center { text-align: center; }
        table.items td.right  { text-align: right; }
        table.items tr:last-child td { border-bottom: none; }
        .service-row td { font-weight: bold; }

        /* ── TOTALS ── */
        .totals-block { border: 1.5px solid #000; border-top: none; }
        .total-row { display: table; width: 100%; border-bottom: 1px solid #ccc; }
        .total-row:last-child { border-bottom: none; }
        .total-label { display: table-cell; width: 75%; font-weight: bold; font-size: 11px; padding: 5px 8px; border-right: 1px solid #ccc; text-align: right; }
        .total-value { display: table-cell; width: 25%; font-weight: bold; font-size: 11px; padding: 5px 8px; text-align: right; }
        .total-row.outstanding .total-label,
        .total-row.outstanding .total-value { font-size: 12px; background: #f0f0f0; }

        /* ── FOOTER ── */
        .footer-note { border: 1.5px solid #000; border-top: none; padding: 5px 8px; font-size: 9.5px; font-style: italic; text-align: center; }
        .signature-row { display: table; width: 100%; margin-top: 20px; }
        .sig-left  { display: table-cell; width: 50%; font-size: 11px; }
        .sig-right { display: table-cell; width: 50%; font-size: 11px; text-align: right; font-weight: bold; }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
<div class="page">

    {{-- HEADER --}}
    <div class="header">
        <div class="header-logo">
            @if(!empty($logoBase64))
                <img src="{{ $logoBase64 }}" alt="Logo">
            @endif
        </div>
        <div class="header-text">
            <div class="company-name">{{ strtoupper($company['name'] ?? 'COMPANY NAME') }}</div>
            <div class="company-address">
                @if(!empty($company['address'])){{ $company['address'] }}<br>@endif
                @if(!empty($company['phone']))Tel: {{ $company['phone'] }}@endif
            </div>
        </div>
        <div style="width:90px;display:table-cell;"></div>
    </div>

    {{-- TITLE BAR --}}
    <div class="title-bar">
        <div class="title-fdo">F.D.O:&nbsp;&nbsp;{{ strtoupper($salesOrder->fdo_officer ?? '') }}</div>
        <div class="title-center">
            <span class="title-center-text">CASH/SALES INVOICE</span>
        </div>
        <div style="display:table-cell;width:25%;"></div>
    </div>

    {{-- CUSTOMER INFO --}}
    <div class="info-row">
        <div class="info-row-inner">
            <div class="info-left">
                <div class="info-field">CUSTOMER'S NAME:&nbsp; <span>{{ strtoupper($salesOrder->customer->name ?? 'N/A') }}</span></div>
            </div>
            <div class="info-right">
                @php
                    $orderDate = $salesOrder->order_date ?? $salesOrder->created_at ?? now();
                    $dateStr = ($orderDate instanceof \Carbon\Carbon)
                        ? $orderDate->format('d-M-Y H:i:s')
                        : \Carbon\Carbon::parse($orderDate)->format('d-M-Y H:i:s');
                @endphp
                <div class="info-field">DATE:&nbsp; <span>{{ $dateStr }}</span></div>
                <div class="info-field">TEL:&nbsp; <span>{{ $salesOrder->customer->phone ?? '' }}</span></div>
            </div>
        </div>
    </div>

    {{-- CATEGORY (formula name) --}}
    <div class="category-row">
        CATEGORY:&nbsp; <span>{{ $salesOrder->formula->name ?? strtoupper($salesOrder->order_type ?? '') }}</span>
    </div>

    {{-- ITEMS TABLE --}}
    <table class="items">
        <thead>
            <tr>
                <th style="width:14%;">QTY</th>
                <th class="left" style="width:50%;">MATERIALS</th>
                <th style="width:18%;">RATE</th>
                <th style="width:18%;">AMOUNT: {{ $currency }}</th>
            </tr>
        </thead>
        <tbody>
            @php $orderTotal = 0; @endphp
            @foreach($salesOrder->items->sortBy('sequence') as $item)
                @if(($item->item_type ?? 'product') === 'service' || empty($item->product_id))
                    @php $lineTotal = floatval($item->total_amount); $orderTotal += $lineTotal; @endphp
                    <tr class="service-row">
                        <td class="center">{{ number_format(floatval($item->quantity), 2) }}</td>
                        <td>{{ strtoupper($item->service_name ?? 'SERVICE') }}</td>
                        <td class="right"></td>
                        <td class="right">{{ number_format($lineTotal, 2) }}</td>
                    </tr>
                @else
                    @php
                        $unitPrice = floatval($item->unit_price);
                        $qty = floatval($item->quantity);
                        $lineTotal = floatval($item->total_amount ?? ($qty * $unitPrice));
                        $orderTotal += $lineTotal;
                    @endphp
                    <tr>
                        <td class="center">{{ number_format($qty, 2) }}</td>
                        <td>{{ $item->product->name ?? '' }}</td>
                        <td class="right">{{ $unitPrice > 0 ? number_format($unitPrice, 2) : '' }}</td>
                        <td class="right">{{ number_format($lineTotal, 2) }}</td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>

    {{-- TOTALS --}}
    @php
        $chargesTotal = $salesOrder->charges ? $salesOrder->charges->sum('charge_amount') : 0;
        $prevBalance = floatval($previousBalance ?? 0);
        $outstanding = $orderTotal + $chargesTotal + $prevBalance;
    @endphp
    <div class="totals-block">
        <div class="total-row">
            <div class="total-label">SUBTOTAL</div>
            <div class="total-value">{{ number_format($orderTotal, 2) }}</div>
        </div>
        @if($salesOrder->charges && $salesOrder->charges->count() > 0)
            @foreach($salesOrder->charges as $charge)
            <div class="total-row">
                <div class="total-label">{{ strtoupper($charge->charge_name) }}</div>
                <div class="total-value">{{ number_format($charge->charge_amount, 2) }}</div>
            </div>
            @endforeach
        @endif
        <div class="total-row" style="border-top:1.5px solid #000;">
            <div class="total-label">TOTAL</div>
            <div class="total-value">{{ number_format($orderTotal + $chargesTotal, 2) }}</div>
        </div>
        @if($prevBalance > 0)
        <div class="total-row">
            <div class="total-label">PREVIOUS BALANCE</div>
            <div class="total-value">{{ number_format($prevBalance, 2) }}</div>
        </div>
        <div class="total-row outstanding">
            <div class="total-label">OUTSTANDING</div>
            <div class="total-value">{{ number_format($outstanding, 2) }}</div>
        </div>
        @endif
    </div>

    {{-- FOOTER --}}
    <div class="footer-note">
        Goods received in good condition are not returnable &nbsp;&nbsp;&nbsp; Thanks for your patronage
    </div>
    <div class="signature-row" style="margin-top:24px;">
        <div class="sig-left">Customer's Signature ____________________________</div>
        <div class="sig-right">For: {{ strtoupper($company['name'] ?? '') }}</div>
    </div>

</div>
</body>
</html>
