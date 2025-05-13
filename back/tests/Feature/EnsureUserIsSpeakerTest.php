<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Http\Middleware\EnsureUserIsSpeaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

class EnsureUserIsSpeakerTest extends TestCase
{
    use RefreshDatabase;

    public function test_ensure_user_is_speaker(): void
    {
        $user = User::factory()->create([
            'role' => 'speaker',
        ]);

        $this->actingAs($user);

        Route::get('/test-speaker-route', function () {
            return response('OK', 200);
        })->middleware(EnsureUserIsSpeaker::class);

        $response = $this->get('/test-speaker-route');

        $response->assertStatus(200);
        $response->assertSee('OK');
    }

    public function test_non_speaker_cannot_access_protected_routes(): void
    {
        $user = User::factory()->create([
            'role' => 'organizer',
        ]);

        $this->actingAs($user);

        Route::get('/test-speaker-route', function () {
            return response('OK', 200);
        })->middleware(EnsureUserIsSpeaker::class);

        $response = $this->get('/test-speaker-route');

        $response->assertStatus(403);
    }
}
