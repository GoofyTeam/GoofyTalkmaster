<?php

use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\SpeakersRequestController;
use App\Http\Controllers\TalkController;
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

Route::middleware('auth:sanctum')->group(function () {
    // Routes pour les speakers
    Route::post('/talks', [TalkController::class, 'store']);
    Route::get('/talks', [TalkController::class, 'index']);
    Route::get('/talks/{id}', [TalkController::class, 'show']);
    Route::put('/talks/{id}', [TalkController::class, 'update']);
    Route::delete('/talks/{id}', [TalkController::class, 'destroy']);

    // Routes pour les favoris
    Route::get('/user/favorites', [FavoriteController::class, 'index']);

    Route::post('/talks/{id}/favorite', [FavoriteController::class, 'store']);
    Route::delete('/talks/{id}/favorite', [FavoriteController::class, 'destroy']);

    Route::put('talks/{id}/status', [TalkController::class, 'updateStatus']);
});

// Route publique pour voir les talks programmés
Route::get('/public/talks', [TalkController::class, 'publicIndex']);

Route::apiResource('rooms', \App\Http\Controllers\RoomController::class)
    ->middleware('auth:sanctum');
