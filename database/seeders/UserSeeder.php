<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
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

        $usersData = [
            [
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => 'Super Admin',
                'email' => 'admin@firstgiwa.com',
                'password' => Hash::make('password'),
                'status' => 'active',
                'role' => 'Super Admin',
            ],
            [
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => 'Musa Ibrahim',
                'email' => 'musa@firstgiwa.com',
                'password' => Hash::make('password'),
                'status' => 'active',
                'role' => 'Manager',
            ],
            [
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => 'Fatima Abdullahi',
                'email' => 'fatima@firstgiwa.com',
                'password' => Hash::make('password'),
                'status' => 'active',
                'role' => 'Accountant',
            ],
            [
                'tenant_id' => $tenantId,
                'branch_id' => 3, // Lagos branch
                'name' => 'Chidi Eze',
                'email' => 'chidi@firstgiwa.com',
                'password' => Hash::make('password'),
                'status' => 'active',
                'role' => 'Sales Staff',
            ],
            [
                'tenant_id' => $tenantId,
                'branch_id' => 2, // Warehouse
                'name' => 'Amina Yusuf',
                'email' => 'amina@firstgiwa.com',
                'password' => Hash::make('password'),
                'status' => 'active',
                'role' => 'Warehouse Staff',
            ],
        ];

        foreach ($usersData as $data) {
            $role = $data['role'];
            unset($data['role']);

            $user = User::firstOrCreate(
                ['email' => $data['email']],
                $data
            );

            // Use Spatie to assign role
            $user->syncRoles([$role]);
        }
    }
}
