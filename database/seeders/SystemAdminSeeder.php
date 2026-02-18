<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SystemAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@factorypulse.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password'),
                'tenant_id' => null,
                'branch_id' => null,
                'is_system_admin' => true,
                'status' => 'active',
            ]
        );
    }
}
