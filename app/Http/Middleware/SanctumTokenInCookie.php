<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class SanctumTokenInCookie
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $cookieName = 'auth_token';

        if (!$request->hasCookie($cookieName)) {
            return response()->json(['message' => 'Нет токена в cookie'], 401);
        }

        $rawToken = $request->cookie($cookieName);

        $accessToken = PersonalAccessToken::findToken($rawToken);

        if (!$accessToken || ($accessToken->expires_at && $accessToken->expires_at->isPast())) {
            return response()->json(['message' => 'Невалидный или устаревший токен'], 401);
        }

        $accessToken->forceFill(['last_used_at' => now()])->save();

        $user = $accessToken->tokenable;

        $user->withAccessToken($accessToken);

        auth()->setUser($user);

        return $next($request);
    }
}
