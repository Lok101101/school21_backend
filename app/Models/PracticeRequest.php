<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'status_id', 'status_change_reason',
            'name', 'surname', 'patronymic',
            'city', 'phone', 'birth_date',
            'specialization', 'course', 'start_date',
            'end_date'])]
#[Hidden(['user_id', 'status_id'])]
class PracticeRequest extends Model
{
    public function status() {
        return $this->belongsTo(PracticeRequestStatus::class, 'status_id');
    }

    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d'
        ];
    }
}
