<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenantIds = Tenant::pluck('id')->toArray();

        if (empty($tenantIds)) {
            $tenantIds = [1];
        }

        $template = [
            // Operational Expenses
            ['code' => 'EXP-001', 'name' => 'Raw Materials Purchase',  'description' => 'Purchase of raw materials for production'],
            ['code' => 'EXP-002', 'name' => 'Utilities',               'description' => 'Electricity, water, and gas expenses'],
            ['code' => 'EXP-003', 'name' => 'Fuel & Transportation',   'description' => 'Fuel, vehicle maintenance, and transportation costs'],
            ['code' => 'EXP-004', 'name' => 'Maintenance & Repairs',   'description' => 'Equipment and facility maintenance'],
            // Capital Expenses
            ['code' => 'EXP-005', 'name' => 'Equipment Purchase',      'description' => 'Purchase of machinery and equipment'],
            ['code' => 'EXP-006', 'name' => 'Building & Infrastructure','description' => 'Construction, renovation, and facility improvements'],
            // Administrative Expenses
            ['code' => 'EXP-007', 'name' => 'Office Supplies',         'description' => 'Stationery, printing, and office consumables'],
            ['code' => 'EXP-008', 'name' => 'Rent & Lease',            'description' => 'Office and warehouse rent payments'],
            ['code' => 'EXP-009', 'name' => 'Professional Fees',       'description' => 'Consultancy, legal, and professional services'],
            ['code' => 'EXP-010', 'name' => 'Insurance',               'description' => 'Business, vehicle, and equipment insurance'],
            // HR & Payroll
            ['code' => 'EXP-011', 'name' => 'Salaries & Wages',        'description' => 'Staff salaries and wages'],
            ['code' => 'EXP-012', 'name' => 'Staff Benefits',          'description' => 'Medical, pension, and other staff benefits'],
            ['code' => 'EXP-013', 'name' => 'Training & Development',  'description' => 'Staff training and capacity building'],
            // Sales & Marketing
            ['code' => 'EXP-014', 'name' => 'Marketing & Advertising', 'description' => 'Promotional activities and advertising'],
            ['code' => 'EXP-015', 'name' => 'Customer Discounts',      'description' => 'Sales discounts and customer incentives'],
        ];

        foreach ($tenantIds as $tenantId) {
            $rows = array_map(fn($cat) => array_merge($cat, [
                // Prefix code with tenant ID so the global unique constraint is respected
                // e.g. tenant 1 → EXP-001, tenant 2 → T2-EXP-001
                'code'       => $tenantId === 1 ? $cat['code'] : "T{$tenantId}-{$cat['code']}",
                'tenant_id'  => $tenantId,
                'parent_id'  => null,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]), $template);

            // insertOrIgnore skips rows that violate a unique constraint,
            // so re-running this on production is safe.
            DB::table('expense_categories')->insertOrIgnore($rows);
        }

        $this->command->info('Expense categories seeded for ' . count($tenantIds) . ' tenant(s).');
    }
}
