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
            // =====================================================
            // PROTEIN SOURCES - Animal Based
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'RM-001', 'name' => 'Fish Meal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 1200, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234001', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-002', 'name' => 'Fishmeal 72%', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 1500, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234002', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-003', 'name' => 'Poultry Meal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 800, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234003', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-004', 'name' => 'Meat Meal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 750, 'selling_price' => 0, 'reorder_level' => 4000, 'critical_level' => 1500, 'barcode' => '8901234004', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-005', 'name' => 'Feather Meal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 450, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234005', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-006', 'name' => 'Local Bloodmeal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 600, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234006', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-007', 'name' => 'Imported Bloodmeal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 950, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234007', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // =====================================================
            // PROTEIN SOURCES - Plant Based
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'RM-008', 'name' => 'GNC (Groundnut Cake)', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 450, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000, 'barcode' => '8901234008', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-009', 'name' => 'Soya Meal', 'category_id' => 3, 'unit_of_measure' => 'kg', 'cost_price' => 520, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000, 'barcode' => '8901234009', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // =====================================================
            // ENERGY SOURCES - Grains & By-products
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'RM-010', 'name' => 'Roshela', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 350, 'selling_price' => 0, 'reorder_level' => 10000, 'critical_level' => 4000, 'barcode' => '8901234010', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-011', 'name' => 'Wheat Offal', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 380, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000, 'barcode' => '8901234011', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-012', 'name' => 'PKC (Palm Kernel Cake)', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 280, 'selling_price' => 0, 'reorder_level' => 10000, 'critical_level' => 4000, 'barcode' => '8901234012', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-013', 'name' => 'Rice Bran', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 320, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234013', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-014', 'name' => 'Wheat Flour', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 500, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234014', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-015', 'name' => 'Cassava Flour', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 250, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234015', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-016', 'name' => 'Cassava Peel', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 120, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000, 'barcode' => '8901234016', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-017', 'name' => 'Garri', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 400, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234017', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-018', 'name' => 'Creeps', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 450, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234018', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-019', 'name' => 'Palamu', 'category_id' => 1, 'unit_of_measure' => 'kg', 'cost_price' => 300, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234019', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // =====================================================
            // OILS & FATS
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'RM-020', 'name' => 'Soya Oil', 'category_id' => 2, 'unit_of_measure' => 'litres', 'cost_price' => 1100, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234020', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // =====================================================
            // MINERALS & CALCIUM SOURCES
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'RM-021', 'name' => 'Bone Meal', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 280, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234021', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-022', 'name' => 'Salt', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 100, 'selling_price' => 0, 'reorder_level' => 1000, 'critical_level' => 400, 'barcode' => '8901234022', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // =====================================================
            // PREMIXES & VITAMINS
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'RM-023', 'name' => 'Concentrate Premix', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 2500, 'selling_price' => 0, 'reorder_level' => 500, 'critical_level' => 200, 'barcode' => '8901234023', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-024', 'name' => 'Champremix', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 3000, 'selling_price' => 0, 'reorder_level' => 300, 'critical_level' => 100, 'barcode' => '8901234024', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-025', 'name' => 'Vitamin C', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 3500, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50, 'barcode' => '8901234025', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-026', 'name' => 'Bio-vit', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 4000, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50, 'barcode' => '8901234026', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-027', 'name' => 'Venor', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 2800, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50, 'barcode' => '8901234027', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-028', 'name' => 'Vitranor', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 3200, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50, 'barcode' => '8901234028', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // =====================================================
            // AMINO ACIDS & ENZYMES
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'RM-029', 'name' => 'Lysine', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 2200, 'selling_price' => 0, 'reorder_level' => 300, 'critical_level' => 100, 'barcode' => '8901234029', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-030', 'name' => 'Enzymes', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 5000, 'selling_price' => 0, 'reorder_level' => 100, 'critical_level' => 30, 'barcode' => '8901234030', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'RM-031', 'name' => 'Toxin Binder', 'category_id' => 4, 'unit_of_measure' => 'kg', 'cost_price' => 3800, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50, 'barcode' => '8901234031', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            
            // =====================================================
            // FINISHED GOODS - Feed Products
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'FG-001', 'name' => 'Standard Poultry Feed', 'category_id' => 5, 'unit_of_measure' => 'kg', 'cost_price' => 486.50, 'selling_price' => 650, 'reorder_level' => 5000, 'critical_level' => 2000, 'barcode' => '8901234032', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'finished_good', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'FG-002', 'name' => 'Broiler Starter Feed', 'category_id' => 5, 'unit_of_measure' => 'kg', 'cost_price' => 520, 'selling_price' => 720, 'reorder_level' => 4000, 'critical_level' => 1500, 'barcode' => '8901234033', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'finished_good', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'FG-003', 'name' => 'Layer Feed Premium', 'category_id' => 5, 'unit_of_measure' => 'kg', 'cost_price' => 442.20, 'selling_price' => 600, 'reorder_level' => 4000, 'critical_level' => 1500, 'barcode' => '8901234034', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'finished_good', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'FG-004', 'name' => 'KFM Special Mix', 'category_id' => 5, 'unit_of_measure' => 'kg', 'cost_price' => 510.80, 'selling_price' => 680, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234035', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'finished_good', 'created_at' => now(), 'updated_at' => now()],
            
            // =====================================================
            // PACKAGING MATERIALS
            // =====================================================
            ['tenant_id' => $tenantId, 'sku' => 'PK-001', 'name' => 'Feed Bags (25kg)', 'category_id' => 6, 'unit_of_measure' => 'pcs', 'cost_price' => 120, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000, 'barcode' => '8901234036', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'sku' => 'PK-002', 'name' => 'Feed Bags (50kg)', 'category_id' => 6, 'unit_of_measure' => 'pcs', 'cost_price' => 180, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800, 'barcode' => '8901234037', 'is_active' => true, 'track_inventory' => true, 'inventory_type' => 'raw_material', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('products')->insert($products);
    }
}
