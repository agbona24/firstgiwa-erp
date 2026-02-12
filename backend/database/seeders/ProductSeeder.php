<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;
        $products = [
            // Raw Materials - Grains
            ['tenant_id' => $tenantId, 'sku' => 'RM-001', 'name' => 'Maize (Yellow Corn)', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 380, 'selling_price' => 0, 'reorder_level' => 10000, 'critical_level' => 5000, 'barcode' => '8901234001', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-002', 'name' => 'Wheat Bran', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 420, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234014', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // Protein Sources
            ['tenant_id' => $tenantId, 'sku' => 'RM-003', 'name' => 'Soybean Meal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 520, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000, 'barcode' => '8901234002', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-004', 'name' => 'Fish Meal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 1200, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234003', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-005', 'name' => 'Groundnut Cake', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 450, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234007', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // Oils
            ['tenant_id' => $tenantId, 'sku' => 'RM-006', 'name' => 'Palm Oil (Crude)', 'category_id' => 2, 'unit_of_measure' => 'litres', 'cost_price' => 950, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234004', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-007', 'name' => 'Soybean Oil', 'category_id' => 2, 'unit_of_measure' => 'litres', 'cost_price' => 1100, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234015', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // Minerals & Additives
            ['tenant_id' => $tenantId, 'sku' => 'RM-008', 'name' => 'Bone Meal', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 280, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234005', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-009', 'name' => 'Premix/Vitamins', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 2500, 'selling_price' => 0, 'reorder_level' => 500, 'critical_level' => 200, 'barcode' => '8901234006', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-010', 'name' => 'Oyster Shell', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 150, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234008', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-011', 'name' => 'Salt', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 100, 'selling_price' => 0, 'reorder_level' => 1000, 'critical_level' => 400, 'barcode' => '8901234016', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // Finished Goods
            ['tenant_id' => $tenantId, 'sku' => 'FG-001', 'name' => 'Standard Poultry Feed', 'category_id' => 5, 'unit_of_measure' => 'kg', 'cost_price' => 486.50, 'selling_price' => 650, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234009', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'finished_good', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'FG-002', 'name' => 'Broiler Starter Feed', 'category_id' => 5, 'unit_of_measure' => 'kg', 'cost_price' => 520, 'selling_price' => 720, 'reorder_level' => 4000, 'critical_level' => 1500, 'barcode' => '8901234010', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'finished_good', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'FG-003', 'name' => 'Layer Feed Premium', 'category_id' => 5, 'unit_of_measure' => 'kg', 'cost_price' => 442.20, 'selling_price' => 600, 'reorder_level' => 4000, 'critical_level' => 1500, 'barcode' => '8901234011', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'finished_good', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'FG-004', 'name' => 'KFM Special Mix', 'category_id' => 5, 'unit_of_measure' => 'kg', 'cost_price' => 510.80, 'selling_price' => 680, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234012', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'finished_good', 'created_at' => now(), 'updated_at' => now()],
            
            // Packaging
            ['tenant_id' => $tenantId, 'sku' => 'PK-001', 'name' => 'Feed Bags (25kg)', 'category_id' => 6, 'unit_of_measure' => 'pcs', 'cost_price' => 120, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234013', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'PK-002', 'name' => 'Feed Bags (50kg)', 'category_id' => 6, 'unit_of_measure' => 'pcs', 'cost_price' => 180, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234017', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('products')->insert($products);
    }
}
