<?php

namespace Tests\Feature;

use App\Models\Favorite;
use App\Models\Talk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoriteControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_add_talk_to_favorites()
    {
        $user = User::factory()->create();
        $talk = Talk::factory()->create(['status' => 'scheduled']);

        $response = $this->actingAs($user)->postJson("/api/talks/{$talk->id}/favorite");

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Talk added to favorites',
            ]);

        $this->assertDatabaseHas('favorites', [
            'user_id' => $user->id,
            'talk_id' => $talk->id,
        ]);
    }

    public function test_adding_duplicate_favorite_returns_error()
    {
        $user = User::factory()->create();
        $talk = Talk::factory()->create(['status' => 'scheduled']);

        // Créer le favori une première fois
        Favorite::create([
            'user_id' => $user->id,
            'talk_id' => $talk->id,
        ]);

        // Essayer de l'ajouter à nouveau
        $response = $this->actingAs($user)->postJson("/api/talks/{$talk->id}/favorite");

        $response->assertStatus(409)
            ->assertJson([
                'message' => 'Talk already in favorites',
            ]);
    }

    public function test_authenticated_user_can_remove_talk_from_favorites()
    {
        $user = User::factory()->create();
        $talk = Talk::factory()->create();

        // Créer le favori
        Favorite::create([
            'user_id' => $user->id,
            'talk_id' => $talk->id,
        ]);

        // Puis le supprimer
        $response = $this->actingAs($user)->deleteJson("/api/talks/{$talk->id}/favorite");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Talk removed from favorites',
            ]);

        $this->assertDatabaseMissing('favorites', [
            'user_id' => $user->id,
            'talk_id' => $talk->id,
        ]);
    }

    public function test_removing_non_existent_favorite_returns_not_found()
    {
        $user = User::factory()->create();
        $talk = Talk::factory()->create();

        $response = $this->actingAs($user)->deleteJson("/api/talks/{$talk->id}/favorite");

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Favorite not found',
            ]);
    }

    public function test_user_can_list_own_favorites()
    {
        $user = User::factory()->create();
        $talks = Talk::factory()->count(3)->create();

        // Ajouter deux talks aux favoris
        Favorite::create([
            'user_id' => $user->id,
            'talk_id' => $talks[0]->id,
        ]);

        Favorite::create([
            'user_id' => $user->id,
            'talk_id' => $talks[1]->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/user/favorites');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_user_cannot_list_other_users_favorites()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $talk = Talk::factory()->create();

        // Créer un favori pour l'autre utilisateur
        Favorite::create([
            'user_id' => $otherUser->id,
            'talk_id' => $talk->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/user/favorites');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
