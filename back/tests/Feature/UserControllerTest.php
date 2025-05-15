<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_users_for_superadmin()
    {
        $superAdmin = User::factory()->create(['role' => 'superadmin']);
        User::factory()->count(5)->create();

        $response = $this->actingAs($superAdmin)->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJsonStructure(['users']);
    }

    public function test_index_returns_unauthorized_for_speaker()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);

        $response = $this->actingAs($speaker)->getJson('/api/users');

        $response->assertStatus(403)
            ->assertJson(['message' => 'Unauthorized']);
    }

    public function test_store_creates_new_user_as_organizer()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        $userData = [
            'name' => 'Doe',
            'first_name' => 'John',
            'description' => 'Test description',
            'email' => 'john.doe@example.com',
            'role' => 'speaker',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->actingAs($organizer)->postJson('/api/users', $userData);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'john.doe@example.com',
            'role' => 'speaker',
        ]);
    }

    public function test_store_fails_with_invalid_data()
    {
        $superAdmin = User::factory()->create(['role' => 'superadmin']);

        $userData = [
            'name' => 'Doe',
            // Missing first_name
            'email' => 'not-an-email',
            'role' => 'invalid-role',
            'password' => 'short',
        ];

        $response = $this->actingAs($superAdmin)->postJson('/api/users', $userData);

        $response->assertStatus(422);
    }

    public function test_show_returns_user_data()
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($admin)->getJson("/api/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User retrieved successfully',
                'user' => $user->toArray(),
            ]);
    }

    public function test_update_own_profile_as_regular_user()
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com',
        ]);

        $updateData = [
            'name' => 'New Name',
            'email' => 'new@example.com',
        ];

        $response = $this->actingAs($user)->putJson("/api/users/{$user->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson(['message' => 'User updated successfully']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'email' => 'new@example.com',
        ]);
    }

    public function test_update_role_as_superadmin()
    {
        $superAdmin = User::factory()->create(['role' => 'superadmin']);
        $user = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($superAdmin)->putJson("/api/users/{$user->id}", [
            'role' => 'speaker',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'speaker',
        ]);
    }

    public function test_update_rejects_unauthorized_role_change()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $anotherUser = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($speaker)->putJson("/api/users/{$anotherUser->id}", [
            'role' => 'superadmin',
        ]);

        $response->assertStatus(403);
    }

    public function test_update_with_profile_picture()
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'organizer']);
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->actingAs($user)->putJson("/api/users/{$user->id}", [
            'name' => 'Updated Name',
            'profile_picture' => $file,
        ]);

        $response->assertStatus(200);
        $this->assertNotNull(User::find($user->id)->profile_picture);
        Storage::disk('public')->assertExists(User::find($user->id)->profile_picture);
    }

    public function test_destroy_user_as_superadmin()
    {
        $superAdmin = User::factory()->create(['role' => 'superadmin']);
        $userToDelete = User::factory()->create(['role' => 'speaker']);

        $response = $this->actingAs($superAdmin)->deleteJson("/api/users/{$userToDelete->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'User deleted successfully']);

        $this->assertDatabaseMissing('users', ['id' => $userToDelete->id]);
    }

    public function test_organizer_cannot_delete_superadmin()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $superAdmin = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($organizer)->deleteJson("/api/users/{$superAdmin->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $superAdmin->id]);
    }

    public function test_cannot_delete_self()
    {
        $user = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($user)->deleteJson("/api/users/{$user->id}");

        $response->assertStatus(400)
            ->assertJson(['message' => 'You cannot delete your own account']);

        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_promote_public_to_speaker_as_superadmin()
    {
        $superAdmin = User::factory()->create(['role' => 'superadmin']);
        $publicUser = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($superAdmin)
            ->patchJson("/api/users/{$publicUser->id}/promote-to-speaker");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User promoted to speaker successfully',
                'user' => ['role' => 'speaker'],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $publicUser->id,
            'role' => 'speaker',
        ]);
    }

    public function test_promote_public_to_speaker_as_organizer()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $publicUser = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($organizer)
            ->patchJson("/api/users/{$publicUser->id}/promote-to-speaker");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User promoted to speaker successfully',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $publicUser->id,
            'role' => 'speaker',
        ]);
    }

    public function test_promote_fails_if_user_not_public()
    {
        $superAdmin = User::factory()->create(['role' => 'superadmin']);
        $speakerUser = User::factory()->create(['role' => 'speaker']);

        $response = $this->actingAs($superAdmin)
            ->patchJson("/api/users/{$speakerUser->id}/promote-to-speaker");

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Only public users can be promoted to speaker',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $speakerUser->id,
            'role' => 'speaker',
        ]);
    }

    public function test_promote_fails_for_unauthorized_user()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $publicUser = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($speaker)
            ->patchJson("/api/users/{$publicUser->id}/promote-to-speaker");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $publicUser->id,
            'role' => 'public',
        ]);
    }

    public function test_demote_speaker_to_public_as_superadmin()
    {
        $superAdmin = User::factory()->create(['role' => 'superadmin']);
        $speakerUser = User::factory()->create(['role' => 'speaker']);

        $response = $this->actingAs($superAdmin)
            ->patchJson("/api/users/{$speakerUser->id}/demote-to-public");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User demoted to public successfully',
                'user' => ['role' => 'public'],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $speakerUser->id,
            'role' => 'public',
        ]);
    }

    public function test_demote_speaker_to_public_as_organizer()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $speakerUser = User::factory()->create(['role' => 'speaker']);

        $response = $this->actingAs($organizer)
            ->patchJson("/api/users/{$speakerUser->id}/demote-to-public");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User demoted to public successfully',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $speakerUser->id,
            'role' => 'public',
        ]);
    }

    public function test_demote_fails_if_user_not_speaker()
    {
        $superAdmin = User::factory()->create(['role' => 'superadmin']);
        $publicUser = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($superAdmin)
            ->patchJson("/api/users/{$publicUser->id}/demote-to-public");

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Only speakers can be demoted to public',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $publicUser->id,
            'role' => 'public',
        ]);
    }

    public function test_demote_fails_for_unauthorized_user()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $otherSpeaker = User::factory()->create(['role' => 'speaker']);

        $response = $this->actingAs($speaker)
            ->patchJson("/api/users/{$otherSpeaker->id}/demote-to-public");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $otherSpeaker->id,
            'role' => 'speaker',
        ]);
    }
}
