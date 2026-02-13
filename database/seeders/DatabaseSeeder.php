<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Core System Setup
            TenantSeeder::class,
            BranchSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            
            // Master Data
            CategorySeeder::class,
            UnitSeeder::class,
            ExpenseCategorySeeder::class,
            
            // Products & Inventory
            ProductSeeder::class,
            WarehouseSeeder::class,
            InventorySeeder::class,
            
            // Business Partners
            CustomerSeeder::class,
            SupplierSeeder::class,
            
            // Production & HR (Skip for now - schema mismatch)
            // FormulaSeeder::class,
            // StaffSeeder::class,
        ]);
    }
}
