<?php

namespace Database\Seeders;

use App\Models\PracticeRequestStatus;
use Illuminate\Database\Seeder;

class PracticeRequestStatusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            ['code' => 'pending', 'name' => 'На рассмотрении'],
            ['code' => 'accepted', 'name' => 'Принята'],
            ['code' => 'rejected', 'name' => 'Отклонена'],
            ['code' => 'canceled', 'name' => 'Отменена']
        ];

        foreach ($statuses as $status) {
            PracticeRequestStatus::updateOrCreate(
                ['code' => $status['code']],
                ['name' => $status['name']]
            );
        }
    }
}
