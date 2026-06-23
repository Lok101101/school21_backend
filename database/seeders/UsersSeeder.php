<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'role_id' => 1,
            'email' => 'student@gmail.com',
            'email_verified_at' => now(),
            'password' => 'Test12345'
        ]);

        User::create([
            'role_id' => 2,
            'email' => 'teamlead@gmail.com',
            'email_verified_at' => now(),
            'password' => 'Test12345'
        ]);
    }
}
