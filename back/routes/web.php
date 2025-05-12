<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'version' => '1.0.0',
        'name' => 'Laravel API',
        'description' => 'This is a simple API built with Laravel.',
    ]);
});
