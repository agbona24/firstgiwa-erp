<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;
        $warehouses = [
            ['tenant_id' => $tenantId, 'branch_id' => 2, 'code' => 'WH-001', 'name' => 'Main Warehouse - Raw Materials', 'location' => 'Industrial Estate, Ikeja', 'address' => 'Plot 23, Industrial Estate, Ikeja, Lagos', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'branch_id' => 2, 'code' => 'WH-002', 'name' => 'Finished Goods Warehouse', 'location' => 'Industrial Estate, Ikeja', 'address' => 'Plot 24, Industrial Estate, Ikeja, Lagos', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'branch_id' => 3, 'code' => 'WH-003', 'name' => 'Lagos Retail Store', 'location' => 'Victoria Island, Lagos', 'address' => '45 Commercial Avenue, Victoria Island, Lagos', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'branch_id' => 1, 'code' => 'WH-004', 'name' => 'Head Office Storage', 'location' => 'Ikoyi, Lagos', 'address' => '12 Corporate Drive, Ikoyi, Lagos', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('warehouses')->insert($warehouses);
    }
}
