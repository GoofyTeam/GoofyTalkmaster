<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\Talk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TalkControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_speaker_can_create_talk()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);

        $talkData = [
            'title' => 'Introduction à Laravel',
            'subject' => 'PHP',
            'description' => 'Une présentation complète de Laravel pour les débutants',
            'duration_minutes' => 45,
            'level' => 'beginner',
        ];

        $response = $this->actingAs($speaker)->postJson('/api/talks', $talkData);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Talk created successfully',
                'talk' => [
                    'title' => 'Introduction à Laravel',
                    'status' => 'pending',
                    'speaker_id' => $speaker->id,
                ],
            ]);

        $this->assertDatabaseHas('talks', [
            'title' => 'Introduction à Laravel',
            'status' => 'pending',
            'speaker_id' => $speaker->id,
        ]);
    }

    public function test_non_speaker_cannot_create_talk()
    {
        $user = User::factory()->create(['role' => 'public']);

        $talkData = [
            'title' => 'Introduction à Laravel',
            'subject' => 'PHP',
            'description' => 'Une présentation complète de Laravel pour les débutants',
            'duration_minutes' => 45,
            'level' => 'beginner',
        ];

        $response = $this->actingAs($user)->postJson('/api/talks', $talkData);

        $response->assertStatus(403);
    }

    public function test_speaker_can_see_own_talks()
    {
        // Utiliser RefreshDatabase assure que la base de données est vide
        $speaker = User::factory()->create(['role' => 'speaker']);
        $otherSpeaker = User::factory()->create(['role' => 'speaker']);

        // Supprimons tous les talks existants pour être sûr
        Talk::query()->delete();

        // Créer un talk pour le speaker
        $ownTalk = Talk::factory()->create(['speaker_id' => $speaker->id]);

        // Créer un talk pour un autre speaker explicitement
        $otherTalk = Talk::factory()->create(['speaker_id' => $otherSpeaker->id]);

        $response = $this->actingAs($speaker)->getJson('/api/talks');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownTalk->id);
    }

    public function test_organizer_can_see_all_talks()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $talks = Talk::factory()->count(3)->create();

        $response = $this->actingAs($organizer)->getJson('/api/talks');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_speaker_can_see_talk_details()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $talk = Talk::factory()->create(['speaker_id' => $speaker->id]);

        $response = $this->actingAs($speaker)->getJson("/api/talks/{$talk->id}");

        $response->assertStatus(200)
            ->assertJson($talk->toArray());
    }

    public function test_speaker_cannot_see_other_speakers_talks()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $otherSpeaker = User::factory()->create(['role' => 'speaker']);
        $talk = Talk::factory()->create(['speaker_id' => $otherSpeaker->id]);

        $response = $this->actingAs($speaker)->getJson("/api/talks/{$talk->id}");

        $response->assertStatus(403);
    }

    public function test_speaker_can_update_own_pending_talk()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $talk = Talk::factory()->create([
            'speaker_id' => $speaker->id,
            'status' => 'pending',
            'title' => 'Ancien titre',
        ]);

        $updateData = [
            'title' => 'Nouveau titre',
            'description' => 'Nouvelle description',
        ];

        $response = $this->actingAs($speaker)->putJson("/api/talks/{$talk->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Talk updated successfully',
                'talk' => [
                    'title' => 'Nouveau titre',
                    'description' => 'Nouvelle description',
                ],
            ]);

        $this->assertDatabaseHas('talks', [
            'id' => $talk->id,
            'title' => 'Nouveau titre',
            'description' => 'Nouvelle description',
        ]);
    }

    public function test_speaker_cannot_update_non_pending_talk()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $talk = Talk::factory()->create([
            'speaker_id' => $speaker->id,
            'status' => 'accepted',
            'title' => 'Ancien titre',
        ]);

        $updateData = [
            'title' => 'Nouveau titre',
        ];

        $response = $this->actingAs($speaker)->putJson("/api/talks/{$talk->id}", $updateData);

        $response->assertStatus(400);

        $this->assertDatabaseHas('talks', [
            'id' => $talk->id,
            'title' => 'Ancien titre',
        ]);
    }

    public function test_speaker_can_delete_own_pending_talk()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $talk = Talk::factory()->create([
            'speaker_id' => $speaker->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($speaker)->deleteJson("/api/talks/{$talk->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Talk deleted successfully',
            ]);

        $this->assertDatabaseMissing('talks', [
            'id' => $talk->id,
        ]);
    }

    public function test_speaker_cannot_delete_non_pending_talk()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $talk = Talk::factory()->create([
            'speaker_id' => $speaker->id,
            'status' => 'accepted',
        ]);

        $response = $this->actingAs($speaker)->deleteJson("/api/talks/{$talk->id}");

        $response->assertStatus(400);

        $this->assertDatabaseHas('talks', [
            'id' => $talk->id,
        ]);
    }

    public function test_organizer_can_update_talk_status()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $talk = Talk::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($organizer)->patchJson("/api/talks/{$talk->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Talk status updated successfully',
                'talk' => [
                    'status' => 'accepted',
                ],
            ]);

        $this->assertDatabaseHas('talks', [
            'id' => $talk->id,
            'status' => 'accepted',
        ]);
    }

    public function test_non_organizer_cannot_update_talk_status()
    {
        $speaker = User::factory()->create(['role' => 'speaker']);
        $talk = Talk::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($speaker)->patchJson("/api/talks/{$talk->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseHas('talks', [
            'id' => $talk->id,
            'status' => 'pending',
        ]);
    }

    public function test_organizer_can_schedule_talk()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $room = Room::factory()->create();
        $talk = Talk::factory()->create(['status' => 'accepted']);

        $scheduleData = [
            'scheduled_date' => '2025-06-15',
            'start_time' => '10:00',
            'room_id' => $room->id,
        ];

        $response = $this->actingAs($organizer)->patchJson("/api/talks/{$talk->id}/schedule", $scheduleData);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Talk scheduled successfully',
                'talk' => [
                    'scheduled_date' => '2025-06-15',
                    'start_time' => '10:00',
                    'room_id' => $room->id,
                    'status' => 'scheduled',
                ],
            ]);

        $this->assertDatabaseHas('talks', [
            'id' => $talk->id,
            'scheduled_date' => '2025-06-15',
            'start_time' => '10:00',
            'room_id' => $room->id,
            'status' => 'scheduled',
        ]);
    }

    public function test_scheduling_detects_room_conflicts()
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $room = Room::factory()->create();

        // Créer un talk déjà programmé de 10h à 11h
        $existingTalk = Talk::factory()->create([
            'status' => 'scheduled',
            'scheduled_date' => '2025-06-15',
            'start_time' => '10:00',
            'room_id' => $room->id,
            'duration_minutes' => 60,
        ]);

        // Essayer de programmer un autre talk à 10h30 dans la même salle
        $newTalk = Talk::factory()->create(['status' => 'accepted']);

        $scheduleData = [
            'scheduled_date' => '2025-06-15',
            'start_time' => '10:30',
            'room_id' => $room->id,
        ];

        $response = $this->actingAs($organizer)->patchJson("/api/talks/{$newTalk->id}/schedule", $scheduleData);

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Room scheduling conflict detected',
            ]);
    }

    public function test_public_can_access_scheduled_talks()
    {
        // Créer quelques talks programmés
        Talk::factory()->scheduled()->create(['scheduled_date' => '2025-06-15']);
        Talk::factory()->scheduled()->create(['scheduled_date' => '2025-06-15']);

        // Appeler la route publique sans authentification
        $response = $this->getJson('/api/public/talks');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_public_talks_can_be_filtered_by_date()
    {
        // Créer des talks pour différentes dates
        Talk::factory()->scheduled()->create(['scheduled_date' => '2025-06-15']);
        Talk::factory()->scheduled()->create(['scheduled_date' => '2025-06-15']);
        Talk::factory()->scheduled()->create(['scheduled_date' => '2025-06-16']);

        // Filtrer par date
        $response = $this->getJson('/api/public/talks?date=2025-06-15');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }
}
