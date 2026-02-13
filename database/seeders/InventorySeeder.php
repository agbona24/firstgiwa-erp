<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        
        // Get products and warehouses
        $products = DB::table('products')->get();
        $warehouses = DB::table('warehouses')->get();
        
        if ($products->isEmpty() || $warehouses->isEmpty()) {
            $this->command->info('No products or warehouses found. Please run ProductSeeder and WarehouseSeeder first.');
            return;
        }
        
        $rawMaterialWarehouse = $warehouses->firstWhere('code', 'WH-001') ?? $warehouses->first();
        $finishedGoodsWarehouse = $warehouses->firstWhere('code', 'WH-002') ?? $warehouses->skip(1)->first() ?? $warehouses->first();
        
        $inventoryData = [];
        
        // Stock levels for each product type
        $stockLevels = [
            'RM-001' => ['quantity' => 45000, 'reserved' => 5000],  // Maize
            'RM-002' => ['quantity' => 22000, 'reserved' => 3000],  // Wheat Bran
            'RM-003' => ['quantity' => 18000, 'reserved' => 2000],  // Soybean Meal
            'RM-004' => ['quantity' => 4500, 'reserved' => 800],    // Fish Meal
            'RM-005' => ['quantity' => 6000, 'reserved' => 0],      // Groundnut Cake
            'RM-006' => ['quantity' => 8500, 'reserved' => 1000],   // Palm Oil
            'RM-007' => ['quantity' => 5000, 'reserved' => 500],    // Soybean Oil
            'RM-008' => ['quantity' => 1800, 'reserved' => 400],    // Bone Meal
            'RM-009' => ['quantity' => 350, 'reserved' => 150],     // Premix/Vitamins
            'RM-010' => ['quantity' => 3200, 'reserved' => 0],      // Oyster Shell
            'RM-011' => ['quantity' => 2500, 'reserved' => 200],    // Salt
            'FG-001' => ['quantity' => 12500, 'reserved' => 2000],  // Standard Poultry Feed
            'FG-002' => ['quantity' => 8200, 'reserved' => 1500],   // Broiler Starter Feed
            'FG-003' => ['quantity' => 3800, 'reserved' => 800],    // Layer Feed Premium
            'FG-004' => ['quantity' => 9750, 'reserved' => 5000],   // KFM Special Mix
            'PK-001' => ['quantity' => 2500, 'reserved' => 500],    // Feed Bags 25kg
            'PK-002' => ['quantity' => 1800, 'reserved' => 200],    // Feed Bags 50kg
        ];
        
        foreach ($products as $product) {
            // Determine warehouse based on inventory type
            $warehouseId = str_starts_with($product->sku, 'FG-') 
                ? $finishedGoodsWarehouse->id 
                : $rawMaterialWarehouse->id;
            
            $stockLevel = $stockLevels[$product->sku] ?? [
                'quantity' => rand(1000, 10000),
                'reserved' => rand(0, 500)
            ];
            
            $inventoryData[] = [
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'quantity' => $stockLevel['quantity'],
                'reserved_quantity' => $stockLevel['reserved'],
                'last_stock_take' => $now->copy()->subDays(rand(1, 30)),
                'last_adjusted_by' => 1,
                'created_at' => $now,
                'updated_at' => $now,
                'tenant_id' => $product->tenant_id,
            ];
        }
        
        DB::table('inventory')->insert($inventoryData);
        
        $this->command->info('Seeded ' . count($inventoryData) . ' inventory records.');
        
        // Create some sample stock movements
        $movements = [];
        $refNum = 1;
        foreach ($products->take(5) as $product) {
            $warehouseId = str_starts_with($product->sku, 'FG-') 
                ? $finishedGoodsWarehouse->id 
                : $rawMaterialWarehouse->id;
            
            $qty = rand(1000, 5000);
            $unitCost = $product->cost_price ?? 100;
            
            // Stock In movement
            $movements[] = [
                'reference_number' => 'SM-' . str_pad($refNum++, 6, '0', STR_PAD_LEFT),
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'batch_id' => null,
                'movement_type' => 'purchase_in',
                'quantity' => $qty,
                'unit_cost' => $unitCost,
                'total_value' => $qty * $unitCost,
                'quantity_before' => 0,
                'quantity_after' => $qty,
                'reference_type' => 'purchase_order',
                'reference_id' => null,
                'from_warehouse_id' => null,
                'to_warehouse_id' => null,
                'reason' => 'Initial stock from supplier',
                'notes' => null,
                'created_by' => 1,
                'created_at' => $now->copy()->subDays(rand(5, 30)),
                'updated_at' => $now,
                'tenant_id' => $product->tenant_id,
            ];
            
            // Stock adjustment movement
            $adjQty = rand(-100, 100);
            $before = rand(5000, 10000);
            $movements[] = [
                'reference_number' => 'SM-' . str_pad($refNum++, 6, '0', STR_PAD_LEFT),
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'batch_id' => null,
                'movement_type' => $adjQty >= 0 ? 'adjustment_in' : 'adjustment_out',
                'quantity' => abs($adjQty),
                'unit_cost' => $unitCost,
                'total_value' => abs($adjQty) * $unitCost,
                'quantity_before' => $before,
                'quantity_after' => $before + $adjQty,
                'reference_type' => 'adjustment',
                'reference_id' => null,
                'from_warehouse_id' => null,
                'to_warehouse_id' => null,
                'reason' => 'Stock count correction',
                'notes' => null,
                'created_by' => 1,
                'created_at' => $now->copy()->subDays(rand(1, 5)),
                'updated_at' => $now,
                'tenant_id' => $product->tenant_id,
            ];
        }
        
        DB::table('stock_movements')->insert($movements);
        
        $this->command->info('Seeded ' . count($movements) . ' stock movement records.');
    }
}
