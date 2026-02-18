<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::updateOrCreate(['slug' => 'starter'], [
            'name' => 'Starter',
            'price' => 29.00,
            'billing_period' => 'month',
            'description' => 'For small factories getting started with digital operations',
            'features' => [
                ['text' => 'Up to 5 users', 'included' => true],
                ['text' => '1 branch location', 'included' => true],
                ['text' => '1,000 products', 'included' => true],
                ['text' => '10,000 monthly transactions', 'included' => true],
                ['text' => 'Inventory & Sales modules', 'included' => true],
                ['text' => 'POS System', 'included' => true],
                ['text' => 'Email support', 'included' => true],
                ['text' => 'Daily backups', 'included' => true],
                ['text' => 'Production planning', 'included' => false],
                ['text' => 'API access', 'included' => false],
            ],
            'max_users' => 5,
            'max_branches' => 1,
            'max_products' => 1000,
            'max_monthly_transactions' => 10000,
            'is_active' => true,
            'sort_order' => 1,
            'is_highlighted' => false,
            'button_text' => 'Get Started',
        ]);

        Plan::updateOrCreate(['slug' => 'professional'], [
            'name' => 'Professional',
            'price' => 79.00,
            'billing_period' => 'month',
            'description' => 'For growing manufacturers who need full control',
            'features' => [
                ['text' => 'Up to 25 users', 'included' => true],
                ['text' => 'Up to 5 branches', 'included' => true],
                ['text' => '10,000 products', 'included' => true],
                ['text' => '100,000 monthly transactions', 'included' => true],
                ['text' => 'All modules included', 'included' => true],
                ['text' => 'Production planning', 'included' => true],
                ['text' => 'Priority support', 'included' => true],
                ['text' => 'Hourly backups', 'included' => true],
                ['text' => 'API access', 'included' => true],
                ['text' => 'Custom integrations', 'included' => false],
            ],
            'max_users' => 25,
            'max_branches' => 5,
            'max_products' => 10000,
            'max_monthly_transactions' => 100000,
            'is_active' => true,
            'sort_order' => 2,
            'is_highlighted' => true,
            'badge' => 'Most Popular',
            'button_text' => 'Start Free Trial',
        ]);

        Plan::updateOrCreate(['slug' => 'enterprise'], [
            'name' => 'Enterprise',
            'price' => 199.00,
            'billing_period' => 'month',
            'description' => 'For large-scale operations demanding the best',
            'features' => [
                ['text' => 'Unlimited users', 'included' => true],
                ['text' => 'Unlimited branches', 'included' => true],
                ['text' => 'Unlimited products', 'included' => true],
                ['text' => 'Unlimited transactions', 'included' => true],
                ['text' => 'All modules + advanced analytics', 'included' => true],
                ['text' => 'Production planning', 'included' => true],
                ['text' => 'Dedicated account manager', 'included' => true],
                ['text' => 'Real-time backups', 'included' => true],
                ['text' => 'Full API access', 'included' => true],
                ['text' => 'Custom integrations', 'included' => true],
            ],
            'max_users' => null,
            'max_branches' => null,
            'max_products' => null,
            'max_monthly_transactions' => null,
            'is_active' => true,
            'sort_order' => 3,
            'is_highlighted' => false,
            'button_text' => 'Contact Sales',
        ]);
    }
}
