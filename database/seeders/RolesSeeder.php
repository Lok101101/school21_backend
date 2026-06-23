<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['code' => 'student', 'name' => 'Студент'],
            ['code' => 'teamlead', 'name' => 'Руководитель практики']
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['code' => $role['code']],
                ['name' => $role['name']]
            );
        }
    }
}
