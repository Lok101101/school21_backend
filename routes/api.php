<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmailController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('cookieApiToken')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/email-verify-code', [EmailController::class, 'sendVerifyCode']);
    Route::post('/verify-email', [EmailController::class, 'verifyEmailByCode']);
});

Route::get('/docs', function () {
    return view('Swagger_API_Docs');
});
