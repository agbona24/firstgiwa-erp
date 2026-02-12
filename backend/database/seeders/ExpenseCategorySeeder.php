<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;
        $expenseCategories = [
            // Operational Expenses
            ['tenant_id' => $tenantId, 'code' => 'EXP-001', 'name' => 'Raw Materials Purchase', 'description' => 'Purchase of raw materials for production', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-002', 'name' => 'Utilities', 'description' => 'Electricity, water, and gas expenses', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-003', 'name' => 'Fuel & Transportation', 'description' => 'Fuel, vehicle maintenance, and transportation costs', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-004', 'name' => 'Maintenance & Repairs', 'description' => 'Equipment and facility maintenance', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            
            // Capital Expenses
            ['tenant_id' => $tenantId, 'code' => 'EXP-005', 'name' => 'Equipment Purchase', 'description' => 'Purchase of machinery and equipment', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-006', 'name' => 'Building & Infrastructure', 'description' => 'Construction, renovation, and facility improvements', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            
            // Administrative Expenses
            ['tenant_id' => $tenantId, 'code' => 'EXP-007', 'name' => 'Office Supplies', 'description' => 'Stationery, printing, and office consumables', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-008', 'name' => 'Rent & Lease', 'description' => 'Office and warehouse rent payments', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-009', 'name' => 'Professional Fees', 'description' => 'Consultancy, legal, and professional services', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-010', 'name' => 'Insurance', 'description' => 'Business, vehicle, and equipment insurance', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            
            // HR & Payroll
            ['tenant_id' => $tenantId, 'code' => 'EXP-011', 'name' => 'Salaries & Wages', 'description' => 'Staff salaries and wages', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-012', 'name' => 'Staff Benefits', 'description' => 'Medical, pension, and other staff benefits', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-013', 'name' => 'Training & Development', 'description' => 'Staff training and capacity building', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            
            // Sales & Marketing
            ['tenant_id' => $tenantId, 'code' => 'EXP-014', 'name' => 'Marketing & Advertising', 'description' => 'Promotional activities and advertising', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'code' => 'EXP-015', 'name' => 'Customer Discounts', 'description' => 'Sales discounts and customer incentives', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('expense_categories')->insert($expenseCategories);
    }
}
