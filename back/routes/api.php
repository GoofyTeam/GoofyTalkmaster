<?php

use App\Http\Controllers\SpeakersRequestController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('users', UserController::class)
    ->middleware('auth:sanctum');

Route::patch('/users/{user}/promote-to-speaker', [UserController::class, 'promoteToSpeaker'])
    ->middleware('auth:sanctum');

Route::patch('/users/{user}/demote-to-public', [UserController::class, 'demoteToPublic'])
    ->middleware('auth:sanctum');

Route::apiResource('speakers-request', SpeakersRequestController::class)
    ->middleware('auth:sanctum');
