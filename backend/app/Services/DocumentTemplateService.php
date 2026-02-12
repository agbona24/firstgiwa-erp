<?php

namespace App\Services;

use App\Models\Setting;

class DocumentTemplateService
{
    protected $group = 'templates';
    protected $key = 'documents';

    protected $defaults = [
        [
            'id' => 1,
            'name' => 'Invoice',
            'description' => 'Sales invoice sent to customers',
            'fields' => ['Logo', 'Company Info', 'Customer Details', 'Line Items', 'Tax Summary', 'Total', 'Payment Terms', 'Footer Notes', 'Bank Details'],
            'last_modified' => '2026-01-15',
        ],
        [
            'id' => 2,
            'name' => 'Receipt',
            'description' => 'Payment receipt for customers',
            'fields' => ['Logo', 'Receipt Number', 'Customer', 'Amount Paid', 'Payment Method', 'Balance', 'Footer'],
            'last_modified' => '2026-01-10',
        ],
        [
            'id' => 3,
            'name' => 'Purchase Order',
            'description' => 'Order sent to suppliers',
            'fields' => ['Logo', 'Company Info', 'Supplier Details', 'Line Items', 'Delivery Terms', 'Total', 'Approval Signatures'],
            'last_modified' => '2025-12-20',
        ],
        [
            'id' => 4,
            'name' => 'Delivery Note',
            'description' => 'Accompanies goods delivered to customers',
            'fields' => ['Logo', 'DN Number', 'Customer', 'Items', 'Quantities', 'Driver Info', 'Receiver Signature'],
            'last_modified' => '2025-12-18',
        ],
        [
            'id' => 5,
            'name' => 'Goods Received Note',
            'description' => 'Confirms receipt of goods from suppliers',
            'fields' => ['Logo', 'GRN Number', 'Supplier', 'PO Reference', 'Items Received', 'Condition Notes', 'Receiver Signature'],
            'last_modified' => '2025-11-30',
        ],
        [
            'id' => 6,
            'name' => 'Payslip',
            'description' => 'Monthly salary breakdown for staff',
            'fields' => ['Company Info', 'Employee Details', 'Earnings', 'Deductions', 'Net Pay', 'YTD Summary'],
            'last_modified' => '2026-01-25',
        ],
    ];

    /**
     * Get all document templates
     */
    public function getAllTemplates(): array
    {
        return Setting::get($this->group, $this->key, $this->defaults);
    }

    /**
     * Get template by name
     */
    public function getTemplate(string $name): ?array
    {
        $templates = $this->getAllTemplates();
        
        foreach ($templates as $template) {
            if (strtolower($template['name']) === strtolower($name)) {
                return $template;
            }
        }
        
        return null;
    }

    /**
     * Check if a field should be shown for a template
     */
    public function hasField(string $templateName, string $fieldName): bool
    {
        $template = $this->getTemplate($templateName);
        
        if (!$template || !isset($template['fields'])) {
            return true; // Default to showing all fields if template not found
        }
        
        return in_array($fieldName, $template['fields']);
    }

    /**
     * Get all fields for a template
     */
    public function getFields(string $templateName): array
    {
        $template = $this->getTemplate($templateName);
        
        if (!$template || !isset($template['fields'])) {
            return [];
        }
        
        return $template['fields'];
    }

    /**
     * Build template data for PDF views
     */
    public function getTemplateData(string $templateName): array
    {
        $template = $this->getTemplate($templateName);
        $fields = $template['fields'] ?? [];
        
        return [
            'template_name' => $templateName,
            'show_logo' => in_array('Logo', $fields),
            'show_company_info' => in_array('Company Info', $fields),
            'show_customer_details' => in_array('Customer Details', $fields) || in_array('Customer', $fields),
            'show_supplier_details' => in_array('Supplier Details', $fields) || in_array('Supplier', $fields),
            'show_line_items' => in_array('Line Items', $fields) || in_array('Items', $fields),
            'show_tax_summary' => in_array('Tax Summary', $fields),
            'show_total' => in_array('Total', $fields),
            'show_payment_terms' => in_array('Payment Terms', $fields),
            'show_footer_notes' => in_array('Footer Notes', $fields) || in_array('Footer', $fields),
            'show_bank_details' => in_array('Bank Details', $fields),
            'show_delivery_terms' => in_array('Delivery Terms', $fields),
            'show_approval_signatures' => in_array('Approval Signatures', $fields),
            'show_driver_info' => in_array('Driver Info', $fields),
            'show_receiver_signature' => in_array('Receiver Signature', $fields),
            'show_condition_notes' => in_array('Condition Notes', $fields),
            'show_employee_details' => in_array('Employee Details', $fields),
            'show_earnings' => in_array('Earnings', $fields),
            'show_deductions' => in_array('Deductions', $fields),
            'show_net_pay' => in_array('Net Pay', $fields),
            'show_ytd_summary' => in_array('YTD Summary', $fields),
            'show_amount_paid' => in_array('Amount Paid', $fields),
            'show_payment_method' => in_array('Payment Method', $fields),
            'show_balance' => in_array('Balance', $fields),
            'show_quantities' => in_array('Quantities', $fields),
            'show_po_reference' => in_array('PO Reference', $fields),
            'show_items_received' => in_array('Items Received', $fields),
        ];
    }
}
