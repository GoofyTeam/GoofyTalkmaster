<?php

use Illuminate\Support\Facades\Route;

Route::get('/api', function () {
    return response()->json([
        'version' => '1.0.0',
        'name' => 'Laravel API',
        'description' => 'This is a simple API built with Laravel.',
    ]);
});
