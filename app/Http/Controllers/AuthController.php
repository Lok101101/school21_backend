<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(RegisterRequest $request) {
        $user = User::query()->create($request->validated());

        $token = $user->createToken('auth_token')->plainTextToken;
        $cookie = cookie(
            'auth_token',
            $token,
            60,
            '/',
            null,
            true,
            true,
            false,
            'Lax'
        );

        return response('', 201)->withCookie($cookie);
    }

    public function login(LoginRequest $request) {
        $credentials = $request->validated();

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Неверный email или пароль'
            ], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;
        $cookie = cookie(
            'auth_token',
            $token,
            60,
            '/',
            null,
            true,
            true,
            false,
            'Lax'
        );

        return response('', 201)->withCookie($cookie);
    }

    public function logout(Request $request) {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        return response()->json([
        ], 200)->withoutCookie('auth_token');
    }
}
