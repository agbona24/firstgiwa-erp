<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenantId = 1;
        $branchId = 1;

        $users = [
            [
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => 'Super Admin',
                'email' => 'admin@firstgiwa.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => 'Musa Ibrahim',
                'email' => 'musa@firstgiwa.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => 'Fatima Abdullahi',
                'email' => 'fatima@firstgiwa.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $tenantId,
                'branch_id' => 3, // Lagos branch
                'name' => 'Chidi Eze',
                'email' => 'chidi@firstgiwa.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $tenantId,
                'branch_id' => 2, // Warehouse
                'name' => 'Amina Yusuf',
                'email' => 'amina@firstgiwa.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('users')->insert($users);

        // Assign roles to users
        $userRoles = [
            ['user_id' => 1, 'role_id' => 1, 'tenant_id' => $tenantId, 'assigned_at' => now(), 'created_at' => now(), 'updated_at' => now()], // Super Admin
            ['user_id' => 2, 'role_id' => 3, 'tenant_id' => $tenantId, 'assigned_at' => now(), 'created_at' => now(), 'updated_at' => now()], // Manager
            ['user_id' => 3, 'role_id' => 6, 'tenant_id' => $tenantId, 'assigned_at' => now(), 'created_at' => now(), 'updated_at' => now()], // Accountant
            ['user_id' => 4, 'role_id' => 9, 'tenant_id' => $tenantId, 'assigned_at' => now(), 'created_at' => now(), 'updated_at' => now()], // Sales Staff
            ['user_id' => 5, 'role_id' => 8, 'tenant_id' => $tenantId, 'assigned_at' => now(), 'created_at' => now(), 'updated_at' => now()], // Warehouse Staff
        ];

        DB::table('user_roles')->insert($userRoles);
    }
}
