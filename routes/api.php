<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmailController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('cookieApiToken')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/email-verify-code', [EmailController::class, 'sendVerifyCode']);
    Route::post('/verify-email', [EmailController::class, 'verifyEmailByCode']);
});
