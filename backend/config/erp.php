<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Company Information
    |--------------------------------------------------------------------------
    */
    'company' => [
        'name' => env('COMPANY_NAME', 'FIRSTGIWA Agro-Processing'),
        'address' => env('COMPANY_ADDRESS', ''),
        'phone' => env('COMPANY_PHONE', ''),
        'email' => env('COMPANY_EMAIL', ''),
        'tax_id' => env('COMPANY_TAX_ID', ''),
        'currency' => env('COMPANY_CURRENCY', 'NGN'),
        'currency_symbol' => env('COMPANY_CURRENCY_SYMBOL', '₦'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tax Settings
    |--------------------------------------------------------------------------
    */
    'tax' => [
        'vat_rate' => env('VAT_RATE', 7.5), // Nigerian VAT rate
        'vat_enabled' => env('VAT_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Credit Settings
    |--------------------------------------------------------------------------
    */
    'credit' => [
        // Default credit limit for new customers (0 = no credit)
        'default_limit' => env('DEFAULT_CREDIT_LIMIT', 0),

        // Grace period in days before credit becomes overdue
        'grace_period_days' => env('CREDIT_GRACE_PERIOD', 30),

        // Auto-block credit when this percentage of limit is used
        'warning_threshold' => env('CREDIT_WARNING_THRESHOLD', 80),

        // Block all credit sales when limit reached
        'enforce_limit' => true,

        // Allow cash sales when credit is blocked
        'allow_cash_when_blocked' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Approval Thresholds
    |--------------------------------------------------------------------------
    | Amounts above these thresholds require approval
    */
    'approval_thresholds' => [
        // Sales orders above this amount require approval
        'sales_order' => env('APPROVAL_THRESHOLD_SALES', 500000),

        // Purchase orders above this amount require approval
        'purchase_order' => env('APPROVAL_THRESHOLD_PURCHASE', 1000000),

        // Expenses above this amount require approval
        'expense' => env('APPROVAL_THRESHOLD_EXPENSE', 50000),

        // Inventory adjustments above this quantity require approval
        'inventory_adjustment' => env('APPROVAL_THRESHOLD_INVENTORY', 100),

        // Credit limit changes above this amount require approval
        'credit_limit_change' => env('APPROVAL_THRESHOLD_CREDIT', 500000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Inventory Settings
    |--------------------------------------------------------------------------
    */
    'inventory' => [
        // Types of inventory
        'types' => [
            'raw_material' => 'Raw Material',
            'finished_good' => 'Finished Good',
            'consumable' => 'Consumable',
            'packaging' => 'Packaging',
        ],

        // Default units
        'default_unit' => 'kg',

        // Available units
        'units' => [
            'kg' => 'Kilogram',
            'ton' => 'Metric Ton',
            'bag' => 'Bag',
            'piece' => 'Piece',
            'litre' => 'Litre',
            'unit' => 'Unit',
        ],

        // Conversion factors to base unit (kg)
        'conversions' => [
            'kg' => 1,
            'ton' => 1000,
            'bag' => 50, // Configurable per product
        ],

        // Loss types
        'loss_types' => [
            'drying' => 'Drying Loss',
            'spillage' => 'Spillage',
            'damage' => 'Damage',
            'expiry' => 'Expiry',
            'theft' => 'Theft/Missing',
            'count_correction' => 'Count Correction',
        ],

        // Maximum allowed loss percentage before alert
        'max_loss_percentage' => env('MAX_LOSS_PERCENTAGE', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Production Settings
    |--------------------------------------------------------------------------
    */
    'production' => [
        // Maximum acceptable loss percentage in production
        'max_loss_percentage' => env('PRODUCTION_MAX_LOSS', 10),

        // Alert when loss exceeds this percentage
        'loss_alert_threshold' => env('PRODUCTION_LOSS_ALERT', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Number Prefixes
    |--------------------------------------------------------------------------
    */
    'prefixes' => [
        'sales_order' => 'SO',
        'invoice' => 'INV',
        'purchase_order' => 'PO',
        'delivery' => 'DEL',
        'payment' => 'PAY',
        'expense' => 'EXP',
        'production_run' => 'PR',
        'stock_adjustment' => 'ADJ',
        'stock_transfer' => 'TRF',
        'batch' => 'BAT',
        'payroll' => 'PAY',
        'customer' => 'CUS',
        'supplier' => 'SUP',
    ],

    /*
    |--------------------------------------------------------------------------
    | Payroll Settings
    |--------------------------------------------------------------------------
    */
    'payroll' => [
        // Standard deductions
        'pension_rate' => env('PENSION_RATE', 8), // Employee contribution
        'pension_employer_rate' => env('PENSION_EMPLOYER_RATE', 10),
        'nhf_rate' => env('NHF_RATE', 2.5), // National Housing Fund

        // Tax settings (PAYE)
        'paye_enabled' => env('PAYE_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */
    'pagination' => [
        'default' => 15,
        'max' => 100,
    ],

    /*
    |--------------------------------------------------------------------------
    | Audit Settings
    |--------------------------------------------------------------------------
    */
    'audit' => [
        // Days to retain audit logs (0 = forever)
        'retention_days' => env('AUDIT_RETENTION_DAYS', 0),

        // Log these actions
        'log_actions' => ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'CANCEL', 'LOGIN', 'LOGOUT'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Role Separation Rules
    |--------------------------------------------------------------------------
    | Defines which roles cannot coexist on the same user
    */
    'role_separation' => [
        'booking_officer' => ['cashier'],
        'cashier' => ['booking_officer', 'accountant'],
    ],
];
