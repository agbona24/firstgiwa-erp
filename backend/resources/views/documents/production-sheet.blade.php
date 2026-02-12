<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Production Sheet - {{ $run->production_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1e293b;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .logo-section h1 {
            font-size: 20px;
            color: #1e40af;
            margin-bottom: 3px;
        }
        .logo-section p {
            color: #64748b;
            font-size: 10px;
        }
        .doc-info {
            text-align: right;
        }
        .doc-info h2 {
            font-size: 16px;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .doc-number {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 5px;
        }
        .status-planned { background: #e0e7ff; color: #3730a3; }
        .status-in_progress { background: #fef3c7; color: #92400e; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }

        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .info-row {
            display: table-row;
        }
        .info-cell {
            display: table-cell;
            width: 50%;
            padding: 5px;
            vertical-align: top;
        }
        .info-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
        }
        .info-box h3 {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }
        .info-item {
            margin-bottom: 5px;
        }
        .info-item label {
            color: #64748b;
            font-size: 9px;
            display: block;
        }
        .info-item span {
            font-weight: bold;
            color: #1e293b;
        }

        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e2e8f0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #f1f5f9;
            color: #475569;
            font-size: 10px;
            text-transform: uppercase;
            padding: 10px 8px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
        }
        th.text-right { text-align: right; }
        th.text-center { text-align: center; }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }
        td.text-right { text-align: right; }
        td.text-center { text-align: center; }
        .item-name {
            font-weight: 600;
            color: #1e293b;
        }
        .item-sku {
            font-size: 9px;
            color: #64748b;
        }

        .input-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 8px;
            min-height: 25px;
            background: #fff;
        }

        .checklist {
            margin-top: 20px;
        }
        .checklist-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            padding: 8px;
            background: #f8fafc;
            border-radius: 4px;
        }
        .checkbox {
            width: 16px;
            height: 16px;
            border: 2px solid #cbd5e1;
            border-radius: 3px;
            margin-right: 10px;
            flex-shrink: 0;
        }
        .checklist-text {
            flex: 1;
        }

        .signature-section {
            margin-top: 30px;
            display: table;
            width: 100%;
        }
        .signature-box {
            display: table-cell;
            width: 33%;
            padding: 10px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #1e293b;
            margin-top: 40px;
            padding-top: 5px;
        }
        .signature-label {
            font-size: 10px;
            color: #64748b;
        }

        .notes-section {
            margin-top: 20px;
        }
        .notes-box {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
            min-height: 60px;
            background: #fafafa;
        }

        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #64748b;
            text-align: center;
        }
        
        .highlight-box {
            background: #fffbeb;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
        }
        .highlight-box h4 {
            color: #92400e;
            font-size: 12px;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="logo-section">
            <h1>{{ $companyName ?? 'FactoryPulse' }}</h1>
            <p>{{ $companyAddress ?? 'Lagos, Nigeria' }}</p>
        </div>
        <div class="doc-info">
            <h2>PRODUCTION SHEET</h2>
            <div class="doc-number">{{ $run->production_number }}</div>
            <div class="status-badge status-{{ $run->status }}">{{ ucfirst(str_replace('_', ' ', $run->status)) }}</div>
        </div>
    </div>

    <!-- Production Info -->
    <div class="info-grid">
        <div class="info-row">
            <div class="info-cell">
                <div class="info-box">
                    <h3>Production Details</h3>
                    <div class="info-item">
                        <label>Formula</label>
                        <span>{{ $run->formula->name ?? 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                        <label>Finished Product</label>
                        <span>{{ $run->finishedProduct->name ?? $run->formula->name ?? 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                        <label>Target Quantity</label>
                        <span>{{ number_format($run->target_quantity, 2) }} kg</span>
                    </div>
                    <div class="info-item">
                        <label>Batch Number</label>
                        <span>{{ $run->batch_number ?? 'N/A' }}</span>
                    </div>
                </div>
            </div>
            <div class="info-cell">
                <div class="info-box">
                    <h3>Schedule</h3>
                    <div class="info-item">
                        <label>Production Date</label>
                        <span>{{ \Carbon\Carbon::parse($run->production_date)->format('d M Y') }}</span>
                    </div>
                    <div class="info-item">
                        <label>Warehouse</label>
                        <span>{{ $run->warehouse->name ?? 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                        <label>Created By</label>
                        <span>{{ $run->creator->name ?? 'N/A' }}</span>
                    </div>
                    @if($run->expiry_date)
                    <div class="info-item">
                        <label>Expiry Date</label>
                        <span>{{ \Carbon\Carbon::parse($run->expiry_date)->format('d M Y') }}</span>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>

    <!-- Raw Materials Required -->
    <div class="section">
        <div class="section-title">Raw Materials Required</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 35%;">Material</th>
                    <th style="width: 15%;" class="text-right">Planned Qty</th>
                    <th style="width: 15%;" class="text-center">Unit</th>
                    <th style="width: 15%;" class="text-right">Actual Used</th>
                    <th style="width: 15%;" class="text-right">Wastage</th>
                </tr>
            </thead>
            <tbody>
                @foreach($run->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <div class="item-name">{{ $item->product->name ?? 'Unknown' }}</div>
                        <div class="item-sku">{{ $item->product->sku ?? '' }}</div>
                    </td>
                    <td class="text-right">{{ number_format($item->planned_quantity, 2) }}</td>
                    <td class="text-center">{{ $item->unit_of_measure ?? $item->product->unit_of_measure ?? 'kg' }}</td>
                    <td class="text-right">
                        @if($run->status === 'completed')
                            {{ number_format($item->actual_quantity, 2) }}
                        @else
                            <div class="input-box"></div>
                        @endif
                    </td>
                    <td class="text-right">
                        @if($run->status === 'completed')
                            {{ number_format($item->variance, 2) }}
                        @else
                            <div class="input-box"></div>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Output Section -->
    <div class="highlight-box">
        <h4>Production Output</h4>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-cell">
                    <div class="info-item">
                        <label>Target Output</label>
                        <span>{{ number_format($run->target_quantity, 2) }} kg</span>
                    </div>
                </div>
                <div class="info-cell">
                    <div class="info-item">
                        <label>Actual Output</label>
                        @if($run->status === 'completed')
                            <span>{{ number_format($run->actual_output, 2) }} kg</span>
                        @else
                            <div class="input-box" style="display: inline-block; min-width: 100px;"></div> kg
                        @endif
                    </div>
                </div>
            </div>
            <div class="info-row">
                <div class="info-cell">
                    <div class="info-item">
                        <label>Wastage</label>
                        @if($run->status === 'completed')
                            <span>{{ number_format($run->wastage_quantity, 2) }} kg ({{ number_format($run->wastage_percentage, 1) }}%)</span>
                        @else
                            <div class="input-box" style="display: inline-block; min-width: 100px;"></div> kg
                        @endif
                    </div>
                </div>
                <div class="info-cell">
                    <div class="info-item">
                        <label>Yield</label>
                        @if($run->status === 'completed' && $run->target_quantity > 0)
                            <span>{{ number_format(($run->actual_output / $run->target_quantity) * 100, 1) }}%</span>
                        @else
                            <div class="input-box" style="display: inline-block; min-width: 60px;"></div> %
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Production Checklist -->
    <div class="section">
        <div class="section-title">Production Checklist</div>
        <div class="checklist">
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="checklist-text">All raw materials verified and weighed</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="checklist-text">Equipment cleaned and ready</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="checklist-text">Safety equipment in place</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="checklist-text">Production completed as per formula</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="checklist-text">Quality check performed</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="checklist-text">Output packaged and labeled</div>
            </div>
        </div>
    </div>

    <!-- Notes -->
    <div class="notes-section">
        <div class="section-title">Notes / Observations</div>
        <div class="notes-box">
            @if($run->notes)
                {{ $run->notes }}
            @endif
        </div>
    </div>

    <!-- Signatures -->
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">
                <div class="signature-label">Prepared By</div>
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                <div class="signature-label">Production Supervisor</div>
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                <div class="signature-label">Quality Control</div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        Generated on {{ now()->format('d M Y H:i') }} | {{ $companyName ?? 'FactoryPulse' }} | Production Sheet
    </div>
</body>
</html>
