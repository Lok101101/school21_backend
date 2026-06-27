<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserController extends Controller
{
    public function getUserRole(Request $request) {
        return response()->json(['role' => $request->user()->role->code]);
    }
}
