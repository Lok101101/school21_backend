<?php

namespace App\Http\Controllers;

use App\Events\MessageSentEvent;
use App\Http\Requests\SendGroupMessageRequest;
use App\Models\PracticeGroup;
use App\Models\PracticeGroupMessage;
use App\Models\UserPracticeGroup;
use Illuminate\Http\Request;

class PracticeGroupController extends Controller
{
    public function getUserGroups(Request $request)
    {
        $practiceGroups = $request->user()->practiceGroups;
        foreach ($practiceGroups as $practiceGroup) {
            $practiceGroup->is_active = $practiceGroup->end_date->gt(now());
        }

        $practiceGroups->makeHidden('pivot');
        return response()->json(['user_groups' => $practiceGroups], 200);
    }

    public function getAllGroups(Request $request)
    {
        $practiceGroups = PracticeGroup::where('city', $request->user()->city)->get();

        foreach ($practiceGroups as $practiceGroup) {
            $practiceGroup->is_active = $practiceGroup->end_date->gt(now());
        }
        return response()->json(['groups' => $practiceGroups], 200);
    }

    public function sendMessage(SendGroupMessageRequest $request, $id) {
        $group = PracticeGroup::where('id', $id)->first();
        if (!$group) {
            return response()->json(['message' => 'Такой группы не существует'], 404);
        }

        $user = $request->user();

        $isTeamleadFromGroupCity = ($user->role->code === 'teamlead' && $user->city === $group->city);
        if (!$isTeamleadFromGroupCity && !$group->hasUser($user)) {
            return response()->json(['message' => 'Доступ запрещён'], 403);
        }

        if (!$group->isActive()) {
            return response()->json(['message' => 'Группа неактивна'], 422);
        }

        PracticeGroupMessage::create([
            'user_id' => $request->user()->id,
            'group_id' => $group->id,
            'text' => $request->text
        ]);

        if ($user->role->code !== 'teamlead') {
            $practiceRequest = UserPracticeGroup::where(['user_id' => $user->id, 'group_id' => $group->id])
                ->first()
                ->request;
            $senderInfo = collect($practiceRequest->only('name', 'surname', 'patronymic'))
                ->put('id', $user->id);
        }
        else {
            $senderInfo = fluent([
                'id' => $user->id,
                'name' => 'Тимлид',
                'surname' => 'Тимлид',
                'patronymic' => 'Тимлид'
            ]);
        }
        event(new MessageSentEvent(
            $group->id,
            $request->text,
            $senderInfo
        ));

        return response()->json([''], 201);
    }

    public function getGroupMembers(Request $request, $id) {
        $group = PracticeGroup::find($id);
        $user = $request->user();

        if (!$group) {
            return response()->json(['message' => 'Такой группы не существует'], 404);
        }

        $isTeamleadFromGroupCity = ($user->role->code === 'teamlead' && $user->city === $group->city);
        if (!$isTeamleadFromGroupCity && !$group->hasUser($user)) {
            return response()->json(['message' => 'Доступ запрещён'], 403);
        }

        $members = UserPracticeGroup::where('group_id', $id)
            ->with([
                'request'
            ])
            ->get()
            ->map(function ($pivot) use ($user) {
                if ($user->role->code !== 'teamlead') $pivot->request->makeHidden('phone', 'birth_date');

                return $pivot->request->makeHidden('id', 'status_change_reason', 'created_at', 'updated_at')->toArray();
            });

        return response()->json(['group_members' => $members], 200);
    }

    public function getGroupMessages(Request $request, $id) {
        $group = PracticeGroup::find($id);
        $user = $request->user();

        if (!$group) {
            return response()->json(['message' => 'Такой группы не существует'], 404);
        }

        $isTeamleadFromGroupCity = ($user->role->code === 'teamlead' && $user->city === $group->city);
        if (!$isTeamleadFromGroupCity && !$group->hasUser($user)) {
            return response()->json(['message' => 'Доступ запрещён'], 403);
        }

        $groupMessages = $group->messages()
            ->latest()
            ->get()
            ->map(function ($message) use ($id) {
                $memberInfo = UserPracticeGroup::where(['user_id' => $message->user_id, 'group_id' => $id])
                    ->with('request:id,name,surname,patronymic')
                    ->first();

                if ($memberInfo && $memberInfo->request) {
                    $senderInfo = [
                        'id' => $message->user_id,
                        'name' => $memberInfo->request->name,
                        'surname' => $memberInfo->request->surname,
                        'patronymic' => $memberInfo->request->patronymic,
                    ];
                } else {
                    $senderInfo = [
                        'id' => $message->user_id,
                        'name' => 'Тимлид',
                        'surname' => 'Тимлид',
                        'patronymic' => 'Тимлид',
                    ];
                }

                return [
                    'id' => $message->id,
                    'text' => $message->text,
                    'created_at' => $message->created_at,
                    'senderInfo' => $senderInfo
                ];
            });

        return response()->json(['group_messages' => $groupMessages], 200);
    }
}
