<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreatePracticeRequest;
use App\Http\Requests\UpdatePracticeRequestStatus;
use App\Models\PracticeRequest;
use App\Models\PracticeRequestStatus;
use Illuminate\Http\Request;

class PracticeRequestController extends Controller
{
    public function createPracticeRequest(CreatePracticeRequest $request) {
        $defaultStatus = PracticeRequestStatus::where('code', 'pending')->first();

        $practiceRequest = PracticeRequest::create([...$request->validated(),
            'user_id' => $request->user()->id,
            'status_id' => $defaultStatus->id
        ]);

        $practiceRequest->status = $defaultStatus;
        return response()->json(['practice_request' => $practiceRequest], 201);
    }

    public function getAllPracticeRequests(Request $request) {
        $practiceRequests = PracticeRequest::with('status')->get();
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

        $newStatus->setAttribute('change_reason', $request->reason);
        $practiceRequest->setRelation('status', $newStatus);
        $practiceRequest->makeHidden('status_change_reason');
        return response()->json(['practice_request' => $practiceRequest], 200);
    }
}
