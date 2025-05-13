<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureUserIsPublic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class EnsureUserIsPublicTest extends TestCase
{
    use RefreshDatabase;

    public function test_ensure_user_is_public(): void
    {
        $user = User::factory()->create([
            'role' => 'public',
        ]);

        $this->actingAs($user);

        Route::get('/test-public-route', function () {
            return response('OK', 200);
        })->middleware(EnsureUserIsPublic::class);

        $response = $this->get('/test-public-route');

        $response->assertStatus(200);
        $response->assertSee('OK');
    }

    public function test_non_public_cannot_access_protected_routes(): void
    {
        $user = User::factory()->create([
            'role' => 'organizer',
        ]);

        $this->actingAs($user);

        Route::get('/test-public-route', function () {
            return response('OK', 200);
        })->middleware(EnsureUserIsPublic::class);

        $response = $this->get('/test-public-route');

        $response->assertStatus(403);
    }
}
