<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'status_id', 'name', 'surname', 'patronymic', 'specialization', 'course', 'start_date', 'end_date'])]
#[Hidden(['user_id', 'status_id'])]
class PracticeRequest extends Model
{
    public function status() {
        return $this->belongsTo(PracticeRequestStatus::class, 'status_id');
    }
}
