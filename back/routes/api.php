<?php

use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Définir les autres méthodes de la ressource sans les middleware admin/organizer
Route::apiResource('users', UserController::class)
    ->middleware('auth:sanctum');
