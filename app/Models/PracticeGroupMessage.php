<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['group_id', 'user_id', 'type', 'text', 'file_path', 'file_name', 'file_type', 'file_size'])]
class PracticeGroupMessage extends Model
{
    public function group(): BelongsTo {
        return $this->belongsTo(PracticeGroup::class);
    }
}
