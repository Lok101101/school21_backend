<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PracticeGroupController;
use App\Http\Controllers\PracticeRequestController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmailController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('cookieApiToken')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/email-verify-code', [EmailController::class, 'sendVerifyCode']);
    Route::post('/verify-email', [EmailController::class, 'verifyEmailByCode']);

    Route::middleware('emailVerifiedForAPI')->group(function () {
        Route::prefix('requests')->group(function () {
            Route::post('', [PracticeRequestController::class, 'createPracticeRequest']);
            Route::get('', [PracticeRequestController::class, 'getAllPracticeRequestsByCity'])->middleware('role:teamlead');
            Route::get('/my', [PracticeRequestController::class, 'getUserPracticeRequests']);
            Route::patch('/{id}/status', [PracticeRequestController::class, 'updatePracticeRequestStatus']);
        });

        Route::prefix('groups')->group(function () {
            Route::get('/my', [PracticeGroupController::class, 'getUserGroups']);
            Route::get('', [PracticeGroupController::class, 'getAllGroups'])->middleware('role:teamlead');
        });
    });
});

Route::get('/docs', function () {
    return view('Swagger_API_Docs');
});
