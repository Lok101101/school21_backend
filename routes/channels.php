<?php

use App\Models\PracticeGroup;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Broadcast::channel('Group.{group}', function (User $user, PracticeGroup $group) {
    if ($user->role->code === 'teamlead') {
        return $user->city === $group->city;
    }

    return $group->hasUser($user);
});
