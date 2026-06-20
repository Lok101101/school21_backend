<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'code', 'is_used', 'expires_at'])]
class EmailVerificationCode extends Model
{
    protected function casts(): array
    {
        return [
            'is_used' => 'boolean',
            'expires_at' => 'datetime'
        ];
    }
}
