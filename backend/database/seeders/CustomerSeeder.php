<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;
        $customers = [
            ['tenant_id' => $tenantId, 'customer_code' => 'CUST-001', 'name' => 'Agro Ventures Nigeria Ltd', 'email' => 'info@agroventures.ng', 'phone' => '+234-803-456-7890', 'address' => '23 Industrial Road, Ikeja, Lagos', 'contact_person' => 'Alhaji Musa Ibrahim', 'customer_type' => 'wholesale', 'credit_limit' => 5000000, 'payment_terms_days' => 30, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'customer_code' => 'CUST-002', 'name' => 'KFM Farms Limited', 'email' => 'orders@kfmfarms.com', 'phone' => '+234-810-234-5678', 'address' => '45 Poultry Road, Ogun State', 'contact_person' => 'Mr. Kunle Adeyemi', 'customer_type' => 'wholesale', 'credit_limit' => 8000000, 'payment_terms_days' => 45, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'customer_code' => 'CUST-003', 'name' => 'Sunshine Poultry Farm', 'email' => 'sunshine@poultry.ng', 'phone' => '+234-807-123-4567', 'address' => '12 Farm Estate, Ibadan, Oyo State', 'contact_person' => 'Mrs. Blessing Okafor', 'customer_type' => 'retail', 'credit_limit' => 1500000, 'payment_terms_days' => 14, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'customer_code' => 'CUST-004', 'name' => 'Livestock Traders Association', 'email' => 'lta@livestock.ng', 'phone' => '+234-815-876-5432', 'address' => '78 Market Road, Kaduna', 'contact_person' => 'Alhaji Usman Danjuma', 'customer_type' => 'wholesale', 'credit_limit' => 4000000, 'payment_terms_days' => 30, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'customer_code' => 'CUST-005', 'name' => 'Green Valley Poultry', 'email' => 'orders@greenvalley.ng', 'phone' => '+234-813-654-3210', 'address' => '5 Valley Road, Enugu', 'contact_person' => 'Mr. Chukwuma Nwosu', 'customer_type' => 'retail', 'credit_limit' => 1000000, 'payment_terms_days' => 7, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'customer_code' => 'CUST-006', 'name' => 'Feedmill Distributors Ltd', 'email' => 'sales@feedmill.ng', 'phone' => '+234-806-789-0123', 'address' => '90 Commerce Avenue, Port Harcourt', 'contact_person' => 'Chief Emmanuel Okon', 'customer_type' => 'distributor', 'credit_limit' => 10000000, 'payment_terms_days' => 60, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'customer_code' => 'CUST-007', 'name' => 'Small Farm Co-op', 'email' => 'smallfarm@coop.ng', 'phone' => '+234-809-333-4444', 'address' => '3 Cooperative Lane, Abeokuta', 'contact_person' => 'Mr. Akin Ogunleye', 'customer_type' => 'retail', 'credit_limit' => 500000, 'payment_terms_days' => 7, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'customer_code' => 'CUST-008', 'name' => 'Northern Livestock Hub', 'email' => 'hub@nlh.ng', 'phone' => '+234-812-555-6666', 'address' => '120 Central Market, Kano', 'contact_person' => 'Alhaji Bello Yusuf', 'customer_type' => 'wholesale', 'credit_limit' => 6000000, 'payment_terms_days' => 30, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('customers')->insert($customers);
    }
}
