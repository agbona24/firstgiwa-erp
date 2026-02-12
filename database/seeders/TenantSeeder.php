<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenants = [
            [
                'name' => 'FIRSTGIWA Limited',
                'slug' => 'firstgiwa',
                'domain' => 'firstgiwa.com',
                'subdomain' => 'firstgiwa',
                'email' => 'admin@firstgiwa.com',
                'phone' => '+234-803-123-4567',
                'address' => '123 Industrial Avenue, Kano, Nigeria',
                'plan' => 'enterprise',
                'trial_ends_at' => null,
                'subscribed_at' => now(),
                'subscription_ends_at' => now()->addYear(),
                'is_active' => true,
                'max_users' => 100,
                'max_branches' => 10,
                'max_products' => 10000,
                'max_monthly_transactions' => 100000,
                'logo_url' => null,
                'primary_color' => '#1e40af',
                'secondary_color' => '#d97706',
                'settings' => json_encode([
                    'currency' => 'NGN',
                    'timezone' => 'Africa/Lagos',
                    'date_format' => 'd/m/Y',
                    'time_format' => 'H:i',
                ]),
                'database_name' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Demo Company',
                'slug' => 'demo',
                'domain' => null,
                'subdomain' => 'demo',
                'email' => 'demo@example.com',
                'phone' => '+234-803-999-9999',
                'address' => 'Demo Address, Lagos, Nigeria',
                'plan' => 'starter',
                'trial_ends_at' => now()->addDays(30),
                'subscribed_at' => null,
                'subscription_ends_at' => null,
                'is_active' => true,
                'max_users' => 5,
                'max_branches' => 1,
                'max_products' => 1000,
                'max_monthly_transactions' => 10000,
                'logo_url' => null,
                'primary_color' => '#1e40af',
                'secondary_color' => '#d97706',
                'settings' => json_encode([
                    'currency' => 'NGN',
                    'timezone' => 'Africa/Lagos',
                ]),
                'database_name' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('tenants')->insert($tenants);
    }
}
