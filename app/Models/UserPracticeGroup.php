<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'group_id', 'request_id'])]
#[Hidden(['id', 'user_id', 'group_id', 'request_id'])]
class UserPracticeGroup extends Model
{
    public function request(): BelongsTo {
        return $this->belongsTo(PracticeRequest::class);
    }

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
