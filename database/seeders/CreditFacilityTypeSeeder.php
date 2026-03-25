<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Services\TenantDefaultsService;
use Illuminate\Database\Seeder;

class CreditFacilityTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Prompts for a tenant selection, then seeds default credit facility types
     * for that tenant using TenantDefaultsService.
     */
    public function run(): void
    {
        $tenants = Tenant::orderBy('id')->get(['id', 'name', 'email']);

        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Create a tenant first.');
            return;
        }

        // Display tenant list
        $this->command->info('Available tenants:');
        foreach ($tenants as $tenant) {
            $this->command->line("  [{$tenant->id}] {$tenant->name} ({$tenant->email})");
        }

        $tenantId = (int) $this->command->ask(
            'Enter the tenant ID to seed credit facility types for (or 0 to seed for ALL tenants)',
            0
        );

        if ($tenantId === 0) {
            if (!$this->command->confirm('Seed for ALL tenants?', false)) {
                $this->command->info('Aborted.');
                return;
            }
            foreach ($tenants as $tenant) {
                TenantDefaultsService::seedCreditFacilityTypes($tenant->id);
                $this->command->info("  ✓ Seeded credit facility types for: {$tenant->name}");
            }
        } else {
            $tenant = $tenants->firstWhere('id', $tenantId);
            if (!$tenant) {
                $this->command->error("Tenant ID {$tenantId} not found.");
                return;
            }
            TenantDefaultsService::seedCreditFacilityTypes($tenant->id);
            $this->command->info("✓ Seeded credit facility types for: {$tenant->name}");
        }
    }
}
