<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\Talk;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TalkControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $speaker;

    protected $organizer;

    protected $superadmin;

    protected $publicUser;

    protected $room;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer les utilisateurs avec différents rôles
        $this->speaker = User::factory()->create(['role' => 'speaker']);
        $this->organizer = User::factory()->create(['role' => 'organizer']);
        $this->superadmin = User::factory()->create(['role' => 'superadmin']);
        $this->publicUser = User::factory()->create(['role' => 'public']);

        // Créer une salle pour les tests de scheduling
        $this->room = Room::factory()->create();
    }

    public function test_public_user_cannot_list_talks()
    {
        $this->actingAs($this->publicUser);

        $response = $this->getJson('/api/talks');

        $response->assertStatus(403);
    }

    public function test_speaker_can_only_see_own_talks()
    {
        // Créer des talks pour ce speaker
        $ownTalks = Talk::factory()->count(3)->create([
            'speaker_id' => $this->speaker->id,
        ]);

        // Créer des talks pour un autre speaker
        $otherSpeaker = User::factory()->create(['role' => 'speaker']);
        $otherTalks = Talk::factory()->count(2)->create([
            'speaker_id' => $otherSpeaker->id,
        ]);

        $this->actingAs($this->speaker);

        $response = $this->getJson('/api/talks');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonMissing(['id' => $otherTalks[0]->id]);
    }

    public function test_organizer_can_see_all_talks()
    {
        // Créer des talks pour différents speakers
        Talk::factory()->count(5)->create();

        $this->actingAs($this->organizer);

        $response = $this->getJson('/api/talks');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data');
    }

    public function test_can_filter_talks_by_subject()
    {
        Talk::factory()->create([
            'subject' => 'PHP',
            'speaker_id' => $this->speaker->id,
        ]);

        Talk::factory()->create([
            'subject' => 'JavaScript',
            'speaker_id' => $this->speaker->id,
        ]);

        $this->actingAs($this->speaker);

        $response = $this->getJson('/api/talks?subject=PHP');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['subject' => 'PHP']);
    }

    public function test_speaker_can_create_talk()
    {
        $this->actingAs($this->speaker);

        $talkData = [
            'title' => 'Test Talk',
            'subject' => 'PHP',
            'description' => 'This is a test talk',
            'level' => 'intermediate',
        ];

        $response = $this->postJson('/api/talks', $talkData);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'title' => 'Test Talk',
                'subject' => 'PHP',
                'status' => 'pending',
            ]);

        $this->assertDatabaseHas('talks', [
            'title' => 'Test Talk',
            'speaker_id' => $this->speaker->id,
        ]);
    }

    public function test_public_user_cannot_create_talk()
    {
        $this->actingAs($this->publicUser);

        $talkData = [
            'title' => 'Test Talk',
            'subject' => 'PHP',
            'description' => 'This is a test talk',
            'level' => 'intermediate',
        ];

        $response = $this->postJson('/api/talks', $talkData);

        $response->assertStatus(403);
    }

    public function test_talk_creation_requires_valid_data()
    {
        $this->actingAs($this->speaker);

        $response = $this->postJson('/api/talks', [
            'title' => '',
            'subject' => '',
            'level' => 'invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'subject', 'description', 'level']);
    }

    public function test_speaker_can_see_own_talk_details()
    {
        $talk = Talk::factory()->create([
            'speaker_id' => $this->speaker->id,
        ]);

        $this->actingAs($this->speaker);

        $response = $this->getJson("/api/talks/{$talk->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $talk->id]);
    }

    public function test_speaker_cannot_see_other_talks_details()
    {
        $otherSpeaker = User::factory()->create(['role' => 'speaker']);
        $talk = Talk::factory()->create([
            'speaker_id' => $otherSpeaker->id,
        ]);

        $this->actingAs($this->speaker);

        $response = $this->getJson("/api/talks/{$talk->id}");

        $response->assertStatus(403);
    }

    public function test_organizer_can_see_any_talk_details()
    {
        $talk = Talk::factory()->create([
            'speaker_id' => $this->speaker->id,
        ]);

        $this->actingAs($this->organizer);

        $response = $this->getJson("/api/talks/{$talk->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $talk->id]);
    }

    public function test_speaker_can_update_own_pending_talk()
    {
        $talk = Talk::factory()->create([
            'speaker_id' => $this->speaker->id,
            'status' => 'pending',
        ]);

        $this->actingAs($this->speaker);

        $response = $this->putJson("/api/talks/{$talk->id}", [
            'title' => 'Updated Title',
            'level' => 'advanced',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'title' => 'Updated Title',
                'level' => 'advanced',
            ]);
    }

    public function test_speaker_cannot_update_accepted_talk()
    {
        $talk = Talk::factory()->create([
            'speaker_id' => $this->speaker->id,
            'status' => 'accepted',
        ]);

        $this->actingAs($this->speaker);

        $response = $this->putJson("/api/talks/{$talk->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertStatus(400);
    }

    public function test_organizer_can_schedule_accepted_talk()
    {
        $talk = Talk::factory()->create([
            'status' => 'accepted',
            'speaker_id' => $this->speaker->id,
        ]);

        $this->actingAs($this->organizer);

        $scheduleData = [
            'scheduled_date' => Carbon::now()->addDay()->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'room_id' => $this->room->id,
        ];

        $response = $this->putJson("/api/talks/{$talk->id}", $scheduleData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'status' => 'scheduled',
                'start_time' => '10:00',
                'end_time' => '11:00',
            ]);
    }

    public function test_cannot_schedule_talk_outside_working_hours()
    {
        $talk = Talk::factory()->create([
            'status' => 'accepted',
            'speaker_id' => $this->speaker->id,
        ]);

        $this->actingAs($this->organizer);

        $scheduleData = [
            'scheduled_date' => Carbon::now()->addDay()->format('Y-m-d'),
            'start_time' => '07:00', // Avant 9h
            'end_time' => '08:00',
            'room_id' => $this->room->id,
        ];

        $response = $this->putJson("/api/talks/{$talk->id}", $scheduleData);
        $response->assertStatus(400);

        $scheduleData['start_time'] = '19:00'; // Après 19h
        $scheduleData['end_time'] = '20:00';

        $response = $this->putJson("/api/talks/{$talk->id}", $scheduleData);
        $response->assertStatus(400);
    }

    public function test_cannot_schedule_talks_with_time_conflict()
    {
        // Créer un premier talk déjà programmé
        $existingTalk = Talk::factory()->create([
            'status' => 'scheduled',
            'scheduled_date' => '2025-06-01',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'room_id' => $this->room->id,
        ]);

        // Talk à programmer qui créerait un conflit
        $talk = Talk::factory()->create([
            'status' => 'accepted',
            'speaker_id' => $this->speaker->id,
        ]);

        $this->actingAs($this->organizer);

        $scheduleData = [
            'scheduled_date' => '2025-06-01',
            'start_time' => '10:30', // Conflit avec le talk existant
            'end_time' => '11:30',
            'room_id' => $this->room->id,
        ];

        $response = $this->putJson("/api/talks/{$talk->id}", $scheduleData);

        $response->assertStatus(400)
            ->assertJsonFragment(['message' => 'Room scheduling conflict detected']);
    }

    public function test_speaker_can_delete_own_pending_talk()
    {
        $talk = Talk::factory()->create([
            'speaker_id' => $this->speaker->id,
            'status' => 'pending',
        ]);

        $this->actingAs($this->speaker);

        $response = $this->deleteJson("/api/talks/{$talk->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('talks', ['id' => $talk->id]);
    }

    public function test_speaker_cannot_delete_accepted_talk()
    {
        $talk = Talk::factory()->create([
            'speaker_id' => $this->speaker->id,
            'status' => 'accepted',
        ]);

        $this->actingAs($this->speaker);

        $response = $this->deleteJson("/api/talks/{$talk->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('talks', ['id' => $talk->id]);
    }

    public function test_organizer_can_update_talk_status()
    {
        $talk = Talk::factory()->create([
            'status' => 'pending',
            'speaker_id' => $this->speaker->id,
        ]);

        $this->actingAs($this->organizer);

        $response = $this->putJson("/api/talks/{$talk->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'accepted']);

        $response = $this->putJson("/api/talks/{$talk->id}/status", [
            'status' => 'rejected',
        ]);

        // Ça devrait échouer car le talk n'est plus en pending
        $response->assertStatus(400);
    }

    public function test_speaker_cannot_update_talk_status()
    {
        $talk = Talk::factory()->create([
            'status' => 'pending',
            'speaker_id' => $this->speaker->id,
        ]);

        $this->actingAs($this->speaker);

        $response = $this->putJson("/api/talks/{$talk->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(403);
    }

    public function test_anyone_can_access_public_talks()
    {
        // Créer quelques talks programmés
        Talk::factory()->count(3)->create([
            'status' => 'scheduled',
            'scheduled_date' => Carbon::now()->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'room_id' => $this->room->id,
        ]);

        // Créer des talks non programmés qui ne devraient pas être visibles
        Talk::factory()->count(2)->create([
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/public/talks');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_filter_public_talks_by_date()
    {
        // Talks aujourd'hui
        Talk::factory()->count(2)->create([
            'status' => 'scheduled',
            'scheduled_date' => Carbon::now()->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'room_id' => $this->room->id,
        ]);

        // Talks demain
        $tomorrow = Carbon::now()->addDay()->format('Y-m-d');
        Talk::factory()->count(3)->create([
            'status' => 'scheduled',
            'scheduled_date' => $tomorrow,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'room_id' => $this->room->id,
        ]);

        $response = $this->getJson("/api/public/talks?date={$tomorrow}");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }
}
