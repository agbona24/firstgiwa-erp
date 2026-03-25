<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SaleCategorySeeder extends Seeder
{
    /**
     * Seed global (tenant_id = null) sale category defaults.
     * Safe to run multiple times — uses firstOrCreate.
     */
    public function run(): void
    {
        $defaults = ['2mm', '3mm', '4mm', '5mm', '6mm'];

        foreach ($defaults as $name) {
            $existing = DB::table('sale_categories')
                ->whereNull('tenant_id')
                ->where('name', $name)
                ->first();

            if (! $existing) {
                DB::table('sale_categories')->insert([
                    'tenant_id'   => null,
                    'name'        => $name,
                    'description' => null,
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        $this->command->info('Sale category defaults seeded: ' . implode(', ', $defaults));
    }
}
