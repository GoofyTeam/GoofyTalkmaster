<?php

namespace Tests\Feature;

use App\Models\SpeakersRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpeakersRequestControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_own_requests_for_public_user()
    {
        $user = User::factory()->create(['role' => 'public']);
        $ownRequest = SpeakersRequest::factory()->create(['user_id' => $user->id]);
        $otherRequest = SpeakersRequest::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/speakers-request');

        $response->assertStatus(200);
        $this->assertTrue($response->json('data')[0]['id'] == $ownRequest->id);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_index_returns_own_requests_for_speaker()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $ownRequest = SpeakersRequest::factory()->create(['user_id' => $speaker->id]);
        $otherRequest = SpeakersRequest::factory()->create();

        $response = $this->actingAs($speaker)->getJson('/api/speakers-request');

        $response->assertStatus(200);
        $this->assertTrue($response->json('data')[0]['id'] == $ownRequest->id);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_index_returns_all_requests_for_organizer()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $requests = SpeakersRequest::factory()->count(3)->create();

        $response = $this->actingAs($organizer)->getJson('/api/speakers-request');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_index_with_filters_for_admin()
    {
        $admin = User::factory()->create(['role' => 'superadmin']);
        $openRequest = SpeakersRequest::factory()->create(['status' => 'open']);
        $closedRequest = SpeakersRequest::factory()->create(['status' => 'closed']);

        $response = $this->actingAs($admin)->getJson('/api/speakers-request?status=open');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($openRequest->id, $response->json('data')[0]['id']);
    }

    public function test_index_with_search()
    {
        $admin = User::factory()->create(['role' => 'superadmin']);
        $matchingRequest = SpeakersRequest::factory()->create(['description' => 'Contains search term']);
        $nonMatchingRequest = SpeakersRequest::factory()->create(['description' => 'Different content']);

        $response = $this->actingAs($admin)->getJson('/api/speakers-request?search=search');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($matchingRequest->id, $response->json('data')[0]['id']);
    }

    public function test_store_creates_new_request()
    {
        $user = User::factory()->create(['role' => 'public']);

        $requestData = [
            'phone' => '123456789',
            'description' => 'I want to be a speaker because I have expertise in AI',
        ];

        $response = $this->actingAs($user)->postJson('/api/speakers-request', $requestData);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Speakers request created successfully',
                'speakers_request' => [
                    'user_id' => $user->id,
                    'phone' => '123456789',
                    'description' => 'I want to be a speaker because I have expertise in AI',
                    'status' => 'open',
                ],
            ]);

        $this->assertDatabaseHas('speakers_requests', [
            'user_id' => $user->id,
            'phone' => '123456789',
            'status' => 'open',
        ]);
    }

    public function test_store_validates_input()
    {
        $user = User::factory()->create(['role' => 'public']);

        $requestData = [
            // Missing required description
            'phone' => '123456789',
        ];

        $response = $this->actingAs($user)->postJson('/api/speakers-request', $requestData);

        $response->assertStatus(422);
    }

    public function test_show_returns_request_data()
    {
        $user = User::factory()->create(['role' => 'public']);
        $speakersRequest = SpeakersRequest::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/speakers-request/{$speakersRequest->id}");

        $response->assertStatus(200)
            ->assertJson($speakersRequest->toArray());
    }

    public function test_show_returns_not_found()
    {
        $user = User::factory()->create(['role' => 'public']);

        $nonExistentId = 999;
        $response = $this->actingAs($user)->getJson("/api/speakers-request/{$nonExistentId}");

        $response->assertStatus(404)
            ->assertJson(['message' => 'Speakers request not found']);
    }

    public function test_update_request_as_organizer()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $speakersRequest = SpeakersRequest::factory()->create([
            'description' => 'Old description',
            'status' => 'open',
        ]);

        $updateData = [
            'description' => 'Updated description',
            'status' => 'closed',
        ];

        $response = $this->actingAs($organizer)->putJson("/api/speakers-request/{$speakersRequest->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Speakers request updated successfully',
                'speakers_request' => [
                    'description' => 'Updated description',
                    'status' => 'closed',
                ],
            ]);

        $this->assertDatabaseHas('speakers_requests', [
            'id' => $speakersRequest->id,
            'description' => 'Updated description',
            'status' => 'closed',
        ]);
    }

    public function test_update_forbidden_for_public_user()
    {
        $user = User::factory()->create(['role' => 'public']);
        $speakersRequest = SpeakersRequest::factory()->create();

        $updateData = [
            'description' => 'Updated description',
        ];

        $response = $this->actingAs($user)->putJson("/api/speakers-request/{$speakersRequest->id}", $updateData);

        $response->assertStatus(403)
            ->assertJson(['message' => 'Unauthorized']);
    }

    public function test_update_forbidden_for_speaker()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $speakersRequest = SpeakersRequest::factory()->create();

        $updateData = [
            'description' => 'Updated description',
        ];

        $response = $this->actingAs($speaker)->putJson("/api/speakers-request/{$speakersRequest->id}", $updateData);

        $response->assertStatus(403)
            ->assertJson(['message' => 'Unauthorized']);
    }

    public function test_update_validates_input()
    {
        $admin = User::factory()->create(['role' => 'superadmin']);
        $speakersRequest = SpeakersRequest::factory()->create();

        $updateData = [
            'description' => '', // Empty description
            'status' => 'invalid-status', // Invalid status
        ];

        $response = $this->actingAs($admin)->putJson("/api/speakers-request/{$speakersRequest->id}", $updateData);

        $response->assertStatus(422);
    }

    public function test_update_returns_not_found()
    {
        $admin = User::factory()->create(['role' => 'superadmin']);

        $nonExistentId = 999;
        $updateData = [
            'description' => 'Updated description',
        ];

        $response = $this->actingAs($admin)->putJson("/api/speakers-request/{$nonExistentId}", $updateData);

        $response->assertStatus(404)
            ->assertJson(['message' => 'Speakers request not found']);
    }

    public function test_destroy_as_admin()
    {
        $admin = User::factory()->create(['role' => 'superadmin']);
        $speakersRequest = SpeakersRequest::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/speakers-request/{$speakersRequest->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Speakers request deleted successfully']);

        $this->assertDatabaseMissing('speakers_requests', ['id' => $speakersRequest->id]);
    }

    public function test_destroy_forbidden_for_public_user()
    {
        $user = User::factory()->create(['role' => 'public']);
        $speakersRequest = SpeakersRequest::factory()->create();

        $response = $this->actingAs($user)->deleteJson("/api/speakers-request/{$speakersRequest->id}");

        $response->assertStatus(403)
            ->assertJson(['message' => 'Unauthorized']);

        $this->assertDatabaseHas('speakers_requests', ['id' => $speakersRequest->id]);
    }

    public function test_destroy_returns_not_found()
    {
        $admin = User::factory()->create(['role' => 'superadmin']);

        $nonExistentId = 999;
        $response = $this->actingAs($admin)->deleteJson("/api/speakers-request/{$nonExistentId}");

        $response->assertStatus(404)
            ->assertJson(['message' => 'Speakers request not found']);
    }
}
