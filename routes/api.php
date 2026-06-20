<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('cookieApiToken')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::get('/send-test-email', function () {
    \Resend\Laravel\Facades\Resend::emails()->send([
        'from' => 'onboarding@resend.dev',
        'to' => ['dumdumich736@gmail.com'],
        'subject' => 'School21',
        'html' => '<p>hello world</p>',
    ]);
});
