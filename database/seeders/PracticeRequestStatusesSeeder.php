<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PracticeRequestStatusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('practice_request_statuses')->insert([
            ['code' => 'pending', 'name' => 'На рассмотрении', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'accepted', 'name' => 'Принята', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'rejected', 'name' => 'Отклонена', 'created_at' => now(), 'updated_at' => now()],]);
    }
}
