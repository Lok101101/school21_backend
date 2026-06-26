<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreatePracticeRequest;
use App\Http\Requests\GetByCityPracticeRequest;
use App\Http\Requests\UpdatePracticeRequestStatus;
use App\Models\PracticeGroup;
use App\Models\PracticeRequest;
use App\Models\PracticeRequestStatus;
use App\Models\UserPracticeGroup;
use Illuminate\Http\Request;

class PracticeRequestController extends Controller
{
    public function createPracticeRequest(CreatePracticeRequest $request) {
        $user = $request->user();

        if ($user->hasActivePractice()) {
            return response()->json(['message' => 'У пользователя есть активная практика'], 422);
        }

        if ($user->hasPendingPracticeRequest()) {
            return response()->json(['message' => 'У пользователя есть заявка на рассмотрении'], 422);
        }

        if ($user->practiceRequestsLastWeekCount() >= 3) {
            return response()->json(['message' => 'Пользователь подал уже 3 заявки за неделю'], 422);
        }

        $defaultStatus = PracticeRequestStatus::where('code', 'pending')->first();

        $practiceRequest = PracticeRequest::create([...$request->validated(),
            'user_id' => $user->id,
            'status_id' => $defaultStatus->id,
        ]);

        $practiceRequest->status = $defaultStatus;
        return response()->json(['practice_request' => $practiceRequest], 201);
    }

    public function getAllPracticeRequestsByCity(Request $request) {
        $practiceRequests = PracticeRequest::with('status')->where('city', $request->user()->city)->get();
        if ($practiceRequests->isEmpty()) {
            return response()->json(['practice_requests' => []], 200);
        }

        $practiceRequests->makeHidden('status_change_reason');
        $practiceRequests
            ->value('status')
            ->setAttribute('change_reason', $practiceRequests->value('status_change_reason'));
        return response()->json(['practice_requests' => $practiceRequests], 200);
    }

    public function getUserPracticeRequests(Request $request) {
        $practiceRequests = PracticeRequest::with('status')->where('user_id', $request->user()->id)->get();
        if ($practiceRequests->isEmpty()) {
            return response()->json(['practice_requests' => []], 200);
        }

        $practiceRequests->makeHidden('status_change_reason');
        $practiceRequests
            ->value('status')
            ->setAttribute('change_reason', $practiceRequests->value('status_change_reason'));
        return response()->json(['practice_requests' => $practiceRequests], 200);
    }

    public function updatePracticeRequestStatus(UpdatePracticeRequestStatus $request, $id) {
        $practiceRequest = PracticeRequest::where('id', $id)->first();
        if (!$practiceRequest) {
            return response()->json(['message' => 'Такой заявки не существует'], 404);
        }

        if ($practiceRequest->status->code !== 'pending' && $request->new_status === 'canceled') {
            return response()->json([
                'message' => 'Установить статус canceled можно только на заявку со статусом pending'
            ], 422);
        }

        if ($request->new_status !== 'canceled' && $request->user()->role->code !== 'teamlead') {
            return response()->json(['message' => 'Доступ запрещён'], 403);
        }

        $newStatus = PracticeRequestStatus::where('code', $request->new_status)->first();
        $practiceRequest->update([
            'status_id' => $newStatus->id,
            'status_change_reason' => $request->reason
        ]);

        if ($request->new_status === 'accepted') {
            $group = PracticeGroup::firstOrCreate(
                ['start_date' => $practiceRequest->start_date, 'end_date' => $practiceRequest->end_date],
                [
                    'name' => $practiceRequest->start_date->format('d.m.Y').' - '.$practiceRequest->end_date->format('d.m.Y'),
                    'city' => $practiceRequest->city
                ]
            );

            UserPracticeGroup::create([
                'user_id' => $practiceRequest->user_id,
                'group_id' => $group->id
            ]);
        }

        $newStatus->setAttribute('change_reason', $request->reason);
        $practiceRequest->setRelation('status', $newStatus);
        $practiceRequest->makeHidden('status_change_reason');
        return response()->json(['practice_request' => $practiceRequest], 200);
    }
}
