<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
