<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'authorization');
Route::view('/register', 'register');
Route::view('/verification', 'verification');
Route::view('/practicant', 'practicant');
Route::view('/request', 'request');
Route::view('/teamlid', 'teamlid');
