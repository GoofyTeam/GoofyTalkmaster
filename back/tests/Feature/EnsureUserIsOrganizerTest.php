<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureUserIsOrganizer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class EnsureUserIsOrganizerTest extends TestCase
{
    use RefreshDatabase;

    public function test_ensure_user_is_organizer(): void
    {
        $user = User::factory()->create([
            'role' => 'organizer',
        ]);

        $this->actingAs($user);

        Route::get('/test-organizer-route', function () {
            return response('OK', 200);
        })->middleware(EnsureUserIsOrganizer::class);

        $response = $this->get('/test-organizer-route');

        $response->assertStatus(200);
        $response->assertSee('OK');
    }

    public function test_non_organizer_cannot_access_protected_routes(): void
    {
        $user = User::factory()->create([
            'role' => 'public',
        ]);

        $this->actingAs($user);

        Route::get('/test-organizer-route', function () {
            return response('OK', 200);
        })->middleware(EnsureUserIsOrganizer::class);

        $response = $this->get('/test-organizer-route');

        $response->assertStatus(403);
    }
}
