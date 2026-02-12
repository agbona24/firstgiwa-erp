<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            [
                'tenant_id' => 1,
                'branch_code' => 'HQ-001',
                'name' => 'Head Office',
                'email' => 'hq@firstgiwa.com',
                'phone' => '+234-803-123-4567',
                'address' => '123 Industrial Avenue, Kano, Nigeria',
                'branch_type' => 'office',
                'is_main_branch' => true,
                'is_active' => true,
                'manager_id' => null,
                'opening_time' => '08:00',
                'closing_time' => '17:00',
                'operating_days' => json_encode(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
                'can_process_sales' => true,
                'can_process_purchases' => true,
                'can_transfer_stock' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => 1,
                'branch_code' => 'WAR-001',
                'name' => 'Main Warehouse',
                'email' => 'warehouse@firstgiwa.com',
                'phone' => '+234-803-123-4568',
                'address' => '456 Storage Road, Kano, Nigeria',
                'branch_type' => 'warehouse',
                'is_main_branch' => false,
                'is_active' => true,
                'manager_id' => null,
                'opening_time' => '07:00',
                'closing_time' => '18:00',
                'operating_days' => json_encode(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
                'can_process_sales' => false,
                'can_process_purchases' => true,
                'can_transfer_stock' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => 1,
                'branch_code' => 'RET-001',
                'name' => 'Lagos Retail Store',
                'email' => 'lagos@firstgiwa.com',
                'phone' => '+234-803-123-4569',
                'address' => '789 Market Street, Lagos, Nigeria',
                'branch_type' => 'retail',
                'is_main_branch' => false,
                'is_active' => true,
                'manager_id' => null,
                'opening_time' => '08:00',
                'closing_time' => '20:00',
                'operating_days' => json_encode(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
                'can_process_sales' => true,
                'can_process_purchases' => false,
                'can_transfer_stock' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('branches')->insert($branches);
    }
}
