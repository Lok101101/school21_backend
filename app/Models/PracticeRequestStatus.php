<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['code', 'name',])]
#[Hidden(['id', 'status_id', 'created_at', 'updated_at'])]
class PracticeRequestStatus extends Model
{

}
