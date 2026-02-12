<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FormulaSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;
        $userId = 1; // Super Admin
        
        // Insert Formulas
        $formulas = [
            ['id' => 1, 'tenant_id' => $tenantId, 'formula_code' => 'FORM-001', 'customer_id' => null, 'name' => 'Standard Poultry Feed Formula', 'description' => 'General purpose poultry feed for layers and broilers', 'is_active' => true, 'created_by' => $userId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'tenant_id' => $tenantId, 'formula_code' => 'FORM-002', 'customer_id' => null, 'name' => 'Broiler Starter Formula', 'description' => 'High protein starter feed for broiler chickens (0-3 weeks)', 'is_active' => true, 'created_by' => $userId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'tenant_id' => $tenantId, 'formula_code' => 'FORM-003', 'customer_id' => null, 'name' => 'Layer Feed Premium Formula', 'description' => 'Calcium-enriched feed for egg-laying hens', 'is_active' => true, 'created_by' => $userId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'tenant_id' => $tenantId, 'formula_code' => 'FORM-004', 'customer_id' => 2, 'name' => 'KFM Special Mix Formula', 'description' => 'Premium blend for KFM Farms customer specification', 'is_active' => true, 'created_by' => $userId, 'created_at' => now(), 'updated_at' => now()],
        ];
        
        DB::table('formulas')->insert($formulas);
        
        // Insert Formula Items (ingredients for each formula)
        $formulaItems = [
            // FORM-001: Standard Poultry Feed (Total: 100%)
            ['tenant_id' => $tenantId, 'formula_id' => 1, 'product_id' => 1, 'quantity' => 450, 'percentage' => 45.0, 'created_at' => now(), 'updated_at' => now()], // Maize
            ['tenant_id' => $tenantId, 'formula_id' => 1, 'product_id' => 3, 'quantity' => 250, 'percentage' => 25.0, 'created_at' => now(), 'updated_at' => now()], // Soybean Meal
            ['tenant_id' => $tenantId, 'formula_id' => 1, 'product_id' => 2, 'quantity' => 150, 'percentage' => 15.0, 'created_at' => now(), 'updated_at' => now()], // Wheat Bran
            ['tenant_id' => $tenantId, 'formula_id' => 1, 'product_id' => 4, 'quantity' => 50, 'percentage' => 5.0, 'created_at' => now(), 'updated_at' => now()], // Fish Meal
            ['tenant_id' => $tenantId, 'formula_id' => 1, 'product_id' => 6, 'quantity' => 30, 'percentage' => 3.0, 'created_at' => now(), 'updated_at' => now()], // Palm Oil
            ['tenant_id' => $tenantId, 'formula_id' => 1, 'product_id' => 8, 'quantity' => 40, 'percentage' => 4.0, 'created_at' => now(), 'updated_at' => now()], // Bone Meal
            ['tenant_id' => $tenantId, 'formula_id' => 1, 'product_id' => 9, 'quantity' => 10, 'percentage' => 1.0, 'created_at' => now(), 'updated_at' => now()], // Premix
            ['tenant_id' => $tenantId, 'formula_id' => 1, 'product_id' => 11, 'quantity' => 20, 'percentage' => 2.0, 'created_at' => now(), 'updated_at' => now()], // Salt
            
            // FORM-002: Broiler Starter (Higher protein)
            ['tenant_id' => $tenantId, 'formula_id' => 2, 'product_id' => 1, 'quantity' => 400, 'percentage' => 40.0, 'created_at' => now(), 'updated_at' => now()], // Maize
            ['tenant_id' => $tenantId, 'formula_id' => 2, 'product_id' => 3, 'quantity' => 300, 'percentage' => 30.0, 'created_at' => now(), 'updated_at' => now()], // Soybean Meal
            ['tenant_id' => $tenantId, 'formula_id' => 2, 'product_id' => 4, 'quantity' => 100, 'percentage' => 10.0, 'created_at' => now(), 'updated_at' => now()], // Fish Meal
            ['tenant_id' => $tenantId, 'formula_id' => 2, 'product_id' => 2, 'quantity' => 100, 'percentage' => 10.0, 'created_at' => now(), 'updated_at' => now()], // Wheat Bran
            ['tenant_id' => $tenantId, 'formula_id' => 2, 'product_id' => 7, 'quantity' => 40, 'percentage' => 4.0, 'created_at' => now(), 'updated_at' => now()], // Soybean Oil
            ['tenant_id' => $tenantId, 'formula_id' => 2, 'product_id' => 8, 'quantity' => 30, 'percentage' => 3.0, 'created_at' => now(), 'updated_at' => now()], // Bone Meal
            ['tenant_id' => $tenantId, 'formula_id' => 2, 'product_id' => 9, 'quantity' => 15, 'percentage' => 1.5, 'created_at' => now(), 'updated_at' => now()], // Premix
            ['tenant_id' => $tenantId, 'formula_id' => 2, 'product_id' => 11, 'quantity' => 15, 'percentage' => 1.5, 'created_at' => now(), 'updated_at' => now()], // Salt
            
            // FORM-003: Layer Feed (High calcium)
            ['tenant_id' => $tenantId, 'formula_id' => 3, 'product_id' => 1, 'quantity' => 500, 'percentage' => 50.0, 'created_at' => now(), 'updated_at' => now()], // Maize
            ['tenant_id' => $tenantId, 'formula_id' => 3, 'product_id' => 3, 'quantity' => 200, 'percentage' => 20.0, 'created_at' => now(), 'updated_at' => now()], // Soybean Meal
            ['tenant_id' => $tenantId, 'formula_id' => 3, 'product_id' => 2, 'quantity' => 150, 'percentage' => 15.0, 'created_at' => now(), 'updated_at' => now()], // Wheat Bran
            ['tenant_id' => $tenantId, 'formula_id' => 3, 'product_id' => 10, 'quantity' => 80, 'percentage' => 8.0, 'created_at' => now(), 'updated_at' => now()], // Oyster Shell
            ['tenant_id' => $tenantId, 'formula_id' => 3, 'product_id' => 8, 'quantity' => 35, 'percentage' => 3.5, 'created_at' => now(), 'updated_at' => now()], // Bone Meal
            ['tenant_id' => $tenantId, 'formula_id' => 3, 'product_id' => 6, 'quantity' => 20, 'percentage' => 2.0, 'created_at' => now(), 'updated_at' => now()], // Palm Oil
            ['tenant_id' => $tenantId, 'formula_id' => 3, 'product_id' => 9, 'quantity' => 10, 'percentage' => 1.0, 'created_at' => now(), 'updated_at' => now()], // Premix
            ['tenant_id' => $tenantId, 'formula_id' => 3, 'product_id' => 11, 'quantity' => 5, 'percentage' => 0.5, 'created_at' => now(), 'updated_at' => now()], // Salt
            
            // FORM-004: KFM Special Mix
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 1, 'quantity' => 420, 'percentage' => 42.0, 'created_at' => now(), 'updated_at' => now()], // Maize
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 3, 'quantity' => 280, 'percentage' => 28.0, 'created_at' => now(), 'updated_at' => now()], // Soybean Meal
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 5, 'quantity' => 100, 'percentage' => 10.0, 'created_at' => now(), 'updated_at' => now()], // Groundnut Cake
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 4, 'quantity' => 70, 'percentage' => 7.0, 'created_at' => now(), 'updated_at' => now()], // Fish Meal
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 2, 'quantity' => 60, 'percentage' => 6.0, 'created_at' => now(), 'updated_at' => now()], // Wheat Bran
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 7, 'quantity' => 30, 'percentage' => 3.0, 'created_at' => now(), 'updated_at' => now()], // Soybean Oil
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 8, 'quantity' => 25, 'percentage' => 2.5, 'created_at' => now(), 'updated_at' => now()], // Bone Meal
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 9, 'quantity' => 10, 'percentage' => 1.0, 'created_at' => now(), 'updated_at' => now()], // Premix
            ['tenant_id' => $tenantId, 'formula_id' => 4, 'product_id' => 11, 'quantity' => 5, 'percentage' => 0.5, 'created_at' => now(), 'updated_at' => now()], // Salt
        ];
        
        DB::table('formula_items')->insert($formulaItems);
    }
}
