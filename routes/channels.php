<?php

use App\Models\PracticeGroup;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['cookieApiToken']]);

Broadcast::channel('Group.{group}', function (User $user, PracticeGroup $group) {
    return $group->hasUser($user);
});
