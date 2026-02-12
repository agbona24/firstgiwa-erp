<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;
        $units = [
            ['tenant_id' => $tenantId, 'name' => 'Kilograms', 'abbreviation' => 'kg', 'type' => 'weight', 'is_base_unit' => true, 'base_conversion_factor' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Tonnes', 'abbreviation' => 'tonnes', 'type' => 'weight', 'is_base_unit' => false, 'base_conversion_factor' => 1000, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Grams', 'abbreviation' => 'g', 'type' => 'weight', 'is_base_unit' => false, 'base_conversion_factor' => 0.001, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Bags', 'abbreviation' => 'bags', 'type' => 'package', 'is_base_unit' => false, 'base_conversion_factor' => 50, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Litres', 'abbreviation' => 'litres', 'type' => 'volume', 'is_base_unit' => true, 'base_conversion_factor' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Pieces', 'abbreviation' => 'pcs', 'type' => 'count', 'is_base_unit' => true, 'base_conversion_factor' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Cartons', 'abbreviation' => 'cartons', 'type' => 'package', 'is_base_unit' => false, 'base_conversion_factor' => 25, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Drums', 'abbreviation' => 'drums', 'type' => 'package', 'is_base_unit' => false, 'base_conversion_factor' => 200, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];
        DB::table('units')->insert($units);
    }
}
