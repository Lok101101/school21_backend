<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'city', 'start_date', 'end_date'])]
class PracticeGroup extends Model
{
    public function isActive(): bool {
        return $this->end_date->gt(now());
    }

    public function hasUser(User $user): bool {
        return UserPracticeGroup::where(['user_id' => $user->id, 'group_id' => $this->id])->exists();
    }

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d'
        ];
    }
}
