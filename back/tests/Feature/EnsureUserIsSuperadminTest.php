<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Http\Middleware\EnsureUserIsSuperadmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

class EnsureUserIsSuperadminTest extends TestCase
{
    use RefreshDatabase;

    public function test_ensure_user_is_superadmin(): void
    {
        $user = User::factory()->create([
            'role' => 'superadmin',
        ]);

        $this->actingAs($user);

        Route::get('/test-superadmin-route', function () {
            return response('OK', 200);
        })->middleware(EnsureUserIsSuperadmin::class);

        $response = $this->get('/test-superadmin-route');

        $response->assertStatus(200);
        $response->assertSee('OK');
    }

    public function test_non_superadmin_cannot_access_protected_routes(): void
    {
        $user = User::factory()->create([
            'role' => 'organizer',
        ]);

        $this->actingAs($user);

        Route::get('/test-superadmin-route', function () {
            return response('OK', 200);
        })->middleware(EnsureUserIsSuperadmin::class);

        $response = $this->get('/test-superadmin-route');

        $response->assertStatus(403);
    }
}
