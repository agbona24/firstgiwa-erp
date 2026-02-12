<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip - {{ $staff->first_name ?? $staff->name ?? 'Employee' }} {{ $staff->last_name ?? '' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.4; }
        .container { padding: 30px; max-width: 800px; margin: 0 auto; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo { max-height: 60px; max-width: 180px; }
        .company-name { font-size: 20px; font-weight: bold; color: #059669; }
        .document-title { text-align: right; }
        .document-title h1 { font-size: 24px; color: #059669; font-weight: bold; margin-bottom: 5px; }
        .document-title .period { font-size: 14px; color: #64748b; }
        
        /* Employee Info */
        .employee-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
        .employee-grid { display: table; width: 100%; }
        .employee-row { display: table-row; }
        .employee-cell { display: table-cell; width: 50%; padding: 5px 0; }
        .employee-cell label { font-size: 10px; text-transform: uppercase; color: #64748b; display: block; }
        .employee-cell .value { font-weight: 500; color: #1e293b; }
        .employee-name { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 15px; }
        
        /* Earnings & Deductions */
        .pay-section { display: table; width: 100%; margin-bottom: 25px; }
        .pay-column { display: table-cell; width: 50%; padding: 0 10px; vertical-align: top; }
        .pay-column:first-child { padding-left: 0; }
        .pay-column:last-child { padding-right: 0; }
        .pay-box { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .pay-box-header { padding: 12px 15px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .earnings-header { background: #dcfce7; color: #166534; }
        .deductions-header { background: #fee2e2; color: #991b1b; }
        .pay-box-content { padding: 15px; }
        .pay-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
        .pay-item:last-child { border-bottom: none; }
        .pay-item .label { color: #64748b; }
        .pay-item .amount { font-weight: 500; }
        .pay-total { display: flex; justify-content: space-between; padding: 12px 0 0 0; margin-top: 10px; border-top: 2px solid #e2e8f0; font-weight: bold; }
        
        /* Net Pay */
        .net-pay-section { background: linear-gradient(135deg, #059669, #10b981); color: white; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 25px; }
        .net-pay-label { font-size: 12px; text-transform: uppercase; opacity: 0.9; margin-bottom: 5px; }
        .net-pay-amount { font-size: 36px; font-weight: bold; }
        .net-pay-words { font-size: 11px; opacity: 0.85; margin-top: 8px; font-style: italic; }
        
        /* YTD Summary */
        .ytd-section { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
        .ytd-header { font-size: 11px; text-transform: uppercase; color: #0369a1; margin-bottom: 12px; font-weight: bold; }
        .ytd-grid { display: table; width: 100%; }
        .ytd-item { display: table-cell; text-align: center; padding: 10px; }
        .ytd-item .value { font-size: 18px; font-weight: bold; color: #1e293b; }
        .ytd-item .label { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 3px; }
        
        /* Footer */
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 10px; color: #64748b; text-align: center; margin-bottom: 3px; }
        .confidential { background: #fef3c7; color: #92400e; padding: 8px 12px; border-radius: 4px; text-align: center; font-size: 10px; margin-bottom: 15px; }
        
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
                <h1>PAYSLIP</h1>
                <div class="period">{{ $payrollRun->period ?? $period ?? 'Month Year' }}</div>
            </div>
        </div>
        
        <!-- Employee Details -->
        @if($template['show_employee_details'])
        <div class="employee-section">
            @php
                $staffName = $staff->name ?? ($staff->first_name ?? '') . ' ' . ($staff->last_name ?? '');
            @endphp
            <div class="employee-name">{{ trim($staffName) ?: 'Employee Name' }}</div>
            <div class="employee-grid">
                <div class="employee-row">
                    <div class="employee-cell">
                        <label>Employee ID</label>
                        <div class="value">{{ $staff->employee_id ?? $staff->id ?? 'N/A' }}</div>
                    </div>
                    <div class="employee-cell">
                        <label>Department</label>
                        <div class="value">{{ $staff->department->name ?? 'N/A' }}</div>
                    </div>
                </div>
                <div class="employee-row">
                    <div class="employee-cell">
                        <label>Position</label>
                        <div class="value">{{ $staff->position ?? 'N/A' }}</div>
                    </div>
                    <div class="employee-cell">
                        <label>Bank Account</label>
                        <div class="value">{{ $staff->bank_name ?? 'N/A' }} - {{ $staff->account_number ?? 'N/A' }}</div>
                    </div>
                </div>
            </div>
        </div>
        @endif
        
        <!-- Earnings & Deductions -->
        <div class="pay-section">
            @if($template['show_earnings'])
            <div class="pay-column">
                <div class="pay-box">
                    <div class="pay-box-header earnings-header">Earnings</div>
                    <div class="pay-box-content">
                        <div class="pay-item">
                            <span class="label">Basic Salary</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->basic_salary ?? $staff->basic_salary ?? 0, 2) }}</span>
                        </div>
                        @if(($payrollItem->housing_allowance ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">Housing Allowance</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->housing_allowance, 2) }}</span>
                        </div>
                        @endif
                        @if(($payrollItem->transport_allowance ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">Transport Allowance</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->transport_allowance, 2) }}</span>
                        </div>
                        @endif
                        @if(($payrollItem->meal_allowance ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">Meal Allowance</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->meal_allowance, 2) }}</span>
                        </div>
                        @endif
                        @if(($payrollItem->overtime ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">Overtime</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->overtime, 2) }}</span>
                        </div>
                        @endif
                        @if(($payrollItem->bonus ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">Bonus</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->bonus, 2) }}</span>
                        </div>
                        @endif
                        <div class="pay-total">
                            <span>Total Earnings</span>
                            <span style="color: #16a34a;">{{ $currency }}{{ number_format($payrollItem->gross_amount ?? 0, 2) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            @endif
            
            @if($template['show_deductions'])
            <div class="pay-column">
                <div class="pay-box">
                    <div class="pay-box-header deductions-header">Deductions</div>
                    <div class="pay-box-content">
                        @if(($payrollItem->tax ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">PAYE Tax</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->tax, 2) }}</span>
                        </div>
                        @endif
                        @if(($payrollItem->pension ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">Pension (Employee)</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->pension, 2) }}</span>
                        </div>
                        @endif
                        @if(($payrollItem->nhf ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">NHF</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->nhf, 2) }}</span>
                        </div>
                        @endif
                        @if(($payrollItem->loan_deduction ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">Loan Repayment</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->loan_deduction, 2) }}</span>
                        </div>
                        @endif
                        @if(($payrollItem->other_deductions ?? 0) > 0)
                        <div class="pay-item">
                            <span class="label">Other Deductions</span>
                            <span class="amount">{{ $currency }}{{ number_format($payrollItem->other_deductions, 2) }}</span>
                        </div>
                        @endif
                        <div class="pay-total">
                            <span>Total Deductions</span>
                            <span style="color: #dc2626;">{{ $currency }}{{ number_format($payrollItem->total_deductions ?? 0, 2) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            @endif
        </div>
        
        <!-- Net Pay -->
        @if($template['show_net_pay'])
        <div class="net-pay-section">
            <div class="net-pay-label">Net Pay</div>
            <div class="net-pay-amount">{{ $currency }}{{ number_format($payrollItem->net_amount ?? 0, 2) }}</div>
            @if(isset($netPayInWords))
            <div class="net-pay-words">{{ $netPayInWords }}</div>
            @endif
        </div>
        @endif
        
        <!-- YTD Summary -->
        @if($template['show_ytd_summary'] && isset($ytdSummary))
        <div class="ytd-section">
            <div class="ytd-header">Year-to-Date Summary</div>
            <div class="ytd-grid">
                <div class="ytd-item">
                    <div class="value">{{ $currency }}{{ number_format($ytdSummary['gross'] ?? 0, 0) }}</div>
                    <div class="label">Gross Earnings</div>
                </div>
                <div class="ytd-item">
                    <div class="value">{{ $currency }}{{ number_format($ytdSummary['tax'] ?? 0, 0) }}</div>
                    <div class="label">Tax Paid</div>
                </div>
                <div class="ytd-item">
                    <div class="value">{{ $currency }}{{ number_format($ytdSummary['pension'] ?? 0, 0) }}</div>
                    <div class="label">Pension</div>
                </div>
                <div class="ytd-item">
                    <div class="value">{{ $currency }}{{ number_format($ytdSummary['net'] ?? 0, 0) }}</div>
                    <div class="label">Net Earnings</div>
                </div>
            </div>
        </div>
        @endif
        
        <!-- Footer -->
        <div class="footer">
            <div class="confidential">⚠️ CONFIDENTIAL - This payslip is intended for the named employee only</div>
            <p>This is a computer-generated document and does not require a signature.</p>
            <p>For queries, contact HR at {{ $company['email'] ?? 'hr@company.com' }}</p>
            <p style="margin-top: 10px;">{{ $company['name'] ?? '' }} | {{ $company['phone'] ?? '' }}</p>
        </div>
    </div>
</body>
</html>
