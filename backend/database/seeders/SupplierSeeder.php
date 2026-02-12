<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;
        $suppliers = [
            ['tenant_id' => $tenantId, 'supplier_code' => 'SUP-001', 'name' => 'National Grains Board', 'email' => 'sales@ngb.gov.ng', 'phone' => '+234-803-111-2222', 'address' => '45 Federal Secretariat, Abuja', 'contact_person' => 'Mr. Tunde Bakare', 'payment_terms_days' => 14, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'supplier_code' => 'SUP-002', 'name' => 'Palm Oil Processors Ltd', 'email' => 'orders@palmoil.ng', 'phone' => '+234-807-222-3333', 'address' => '12 Industrial Layout, Rivers State', 'contact_person' => 'Chief Nnamdi Okoro', 'payment_terms_days' => 7, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'supplier_code' => 'SUP-003', 'name' => 'Fish Meal Nigeria', 'email' => 'info@fishmeal.ng', 'phone' => '+234-810-333-4444', 'address' => '78 Coastal Road, Lagos', 'contact_person' => 'Mr. Segun Adebayo', 'payment_terms_days' => 30, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'supplier_code' => 'SUP-004', 'name' => 'Soybean Suppliers Co.', 'email' => 'sales@soybean.ng', 'phone' => '+234-813-444-5555', 'address' => '23 Farm Road, Benue State', 'contact_person' => 'Mr. Joseph Iorfa', 'payment_terms_days' => 14, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'supplier_code' => 'SUP-005', 'name' => 'Premier Vitamins & Minerals', 'email' => 'order@premiervitamins.ng', 'phone' => '+234-806-555-6666', 'address' => '5 Chemical Estate, Kano', 'contact_person' => 'Dr. Fatima Hassan', 'payment_terms_days' => 30, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'supplier_code' => 'SUP-006', 'name' => 'Groundnut Processors Union', 'email' => 'gpu@groundnut.ng', 'phone' => '+234-809-666-7777', 'address' => '90 Market Square, Kano', 'contact_person' => 'Alhaji Shehu Musa', 'payment_terms_days' => 7, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'supplier_code' => 'SUP-007', 'name' => 'Packaging Solutions Ltd', 'email' => 'info@packagesolution.ng', 'phone' => '+234-815-777-8888', 'address' => '15 Industrial Avenue, Lagos', 'contact_person' => 'Mrs. Amaka Nwankwo', 'payment_terms_days' => 14, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'supplier_code' => 'SUP-008', 'name' => 'Oyster Shell Traders', 'email' => 'sales@oystershell.ng', 'phone' => '+234-812-888-9999', 'address' => '67 Coastal Trade Centre, Delta State', 'contact_person' => 'Mr. Peter Oghenekaro', 'payment_terms_days' => 7, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('suppliers')->insert($suppliers);
    }
}
