<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\Talk;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TalkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Date actuelle
        $now = Carbon::now();

        // --- TALKS EN ATTENTE ---
        Talk::factory()->count(10)->pending()->create();

        // --- TALKS ACCEPTÉS ---
        Talk::factory()->count(5)->accepted()->create();

        // --- TALKS REJETÉS ---
        Talk::factory()->count(3)->state(['status' => 'rejected'])->create();

        // --- TALKS PROGRAMMÉS ---
        // Vérifier que des salles existent
        if (Room::count() === 0) {
            Room::factory()->count(3)->create();
        }
        $rooms = Room::all();

        // 1. Talks passés (dernières semaines)
        for ($i = 7; $i >= 1; $i--) {
            $pastDate = $now->copy()->subDays($i)->format('Y-m-d');

            // Matin
            $this->createScheduledTalk($pastDate, '10:00', '11:30', $rooms->random()->id);

            // Après-midi
            $this->createScheduledTalk($pastDate, '14:30', '15:30', $rooms->random()->id);
            $this->createScheduledTalk($pastDate, '16:45', '18:00', $rooms->random()->id);
        }

        // 2. Talks aujourd'hui
        $today = $now->format('Y-m-d');

        // Matin
        $this->createScheduledTalk($today, '09:30', '10:30', $rooms->random()->id);
        $this->createScheduledTalk($today, '11:00', '12:00', $rooms->random()->id);

        // Après-midi
        $this->createScheduledTalk($today, '14:00', '15:00', $rooms->random()->id);
        $this->createScheduledTalk($today, '16:30', '17:30', $rooms->random()->id);
        $this->createScheduledTalk($today, '18:00', '19:00', $rooms->random()->id);

        // 3. Talks futurs (prochaines semaines)
        for ($i = 1; $i <= 14; $i++) {
            $futureDate = $now->copy()->addDays($i)->format('Y-m-d');

            // Ne pas générer pour tous les jours, juste certains
            if ($i % 2 == 0) {
                continue;
            }

            // Matin
            $this->createScheduledTalk($futureDate, '09:00', '10:00', $rooms->random()->id);
            $this->createScheduledTalk($futureDate, '11:30', '12:30', $rooms->random()->id);

            // Après-midi
            $this->createScheduledTalk($futureDate, '13:30', '14:30', $rooms->random()->id);
            $this->createScheduledTalk($futureDate, '15:00', '16:30', $rooms->random()->id);
            $this->createScheduledTalk($futureDate, '17:30', '18:45', $rooms->random()->id);
        }
    }

    /**
     * Crée un talk programmé avec la date et les heures spécifiées
     */
    private function createScheduledTalk($date, $startTime, $endTime, $roomId)
    {
        Talk::factory()->create([
            'status' => 'scheduled',
            'scheduled_date' => $date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'room_id' => $roomId,
        ]);
    }
}
