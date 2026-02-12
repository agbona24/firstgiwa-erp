<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;
        $categories = [
            ['tenant_id' => $tenantId, 'name' => 'Grains & Cereals', 'code' => 'GRN', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Oil Seeds & Oils', 'code' => 'OIL', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Protein Sources', 'code' => 'PRT', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Minerals & Additives', 'code' => 'MIN', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Finished Feeds', 'code' => 'FED', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'name' => 'Packaging Materials', 'code' => 'PKG', 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];
        DB::table('categories')->insert($categories);
    }
}
