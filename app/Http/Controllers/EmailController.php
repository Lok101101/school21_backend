<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmailVerificationByCodeRequest;
use App\Models\EmailVerificationCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EmailController extends Controller
{
    public function sendVerifyCode(Request $request) {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(["message" => "Почта уже подтверждена"], 400);
        }

        $user->verificationCodes()
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->delete();

        $code = Str::password(6, letters: false, symbols: false);
        EmailVerificationCode::create([
            'user_id' => $user->id,
            'code' => $code,
            'expires_at' => now()->addMinutes(5),
        ]);

        try {
            Mail::html("<h1>Ваш код: <span style='color: #00dc00'>{$code}</span></h1>", function ($message) {
                $message->to('dumdumich736@gmail.com')->subject('Код для подтверждения почты | Школа 21');
            });
        } catch (\Exception $exception) {
            return response()->json('Не удалось отправить письмо на почту, попробуйте позже', 500);
        }

        return response()->json('', 201);
    }

    public function verifyEmailByCode(EmailVerificationByCodeRequest $request) {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(["message" => "Почта уже подтверждена"], 400);
        }

        $activeCode = $user->verificationCodes()
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$activeCode || $activeCode->code !== $request->code) {
            return response()->json(["message" => "Неправильный код"], 400);
        }

        $user->markEmailAsVerified();
        $activeCode->update(['is_used' => true]);
        return response()->json('', 200);
    }
}
