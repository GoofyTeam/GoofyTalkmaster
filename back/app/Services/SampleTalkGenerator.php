<?php

namespace App\Services;

use App\Models\Room;
use App\Models\Talk;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SampleTalkGenerator
{
    /**
     * Generate a set of sample talks around the provided reference date.
     */
    public function generate(?Carbon $reference = null): array
    {
        $reference ??= Carbon::now();

        if (Room::count() === 0) {
            Room::factory()->count(3)->create();
        }

        $rooms = Room::all();
        if ($rooms->isEmpty()) {
            return [
                'created' => 0,
                'scheduled' => 0,
                'pending' => 0,
                'accepted' => 0,
                'rejected' => 0,
            ];
        }

        $createdTalks = collect();

        $createdTalks = $createdTalks->merge(
            $this->generatePendingTalks()
        );

        $createdTalks = $createdTalks->merge(
            $this->generateAcceptedTalks()
        );

        $createdTalks = $createdTalks->merge(
            $this->generateRejectedTalks()
        );

        $createdTalks = $createdTalks->merge(
            $this->generateScheduledTalks($reference, $rooms)
        );

        return [
            'created' => $createdTalks->count(),
            'scheduled' => $createdTalks->where('status', 'scheduled')->count(),
            'pending' => $createdTalks->where('status', 'pending')->count(),
            'accepted' => $createdTalks->where('status', 'accepted')->count(),
            'rejected' => $createdTalks->where('status', 'rejected')->count(),
        ];
    }

    private function generatePendingTalks(): Collection
    {
        return Talk::factory()->count(10)->pending()->create();
    }

    private function generateAcceptedTalks(): Collection
    {
        return Talk::factory()->count(5)->accepted()->create();
    }

    private function generateRejectedTalks(): Collection
    {
        return Talk::factory()->count(3)->state(['status' => 'rejected'])->create();
    }

    private function generateScheduledTalks(Carbon $reference, Collection $rooms): Collection
    {
        $created = collect();

        for ($i = 7; $i >= 1; $i--) {
            $date = $reference->copy()->subDays($i)->format('Y-m-d');
            $created->push($this->createScheduledTalk($date, '10:00', '11:30', $rooms->random()->id));
            $created->push($this->createScheduledTalk($date, '14:30', '15:30', $rooms->random()->id));
            $created->push($this->createScheduledTalk($date, '16:45', '18:00', $rooms->random()->id));
        }

        $today = $reference->format('Y-m-d');
        $created->push($this->createScheduledTalk($today, '09:30', '10:30', $rooms->random()->id));
        $created->push($this->createScheduledTalk($today, '11:00', '12:00', $rooms->random()->id));
        $created->push($this->createScheduledTalk($today, '14:00', '15:00', $rooms->random()->id));
        $created->push($this->createScheduledTalk($today, '16:30', '17:30', $rooms->random()->id));
        $created->push($this->createScheduledTalk($today, '18:00', '19:00', $rooms->random()->id));

        for ($i = 1; $i <= 14; $i++) {
            if ($i % 2 === 0) {
                continue;
            }

            $date = $reference->copy()->addDays($i)->format('Y-m-d');
            $created->push($this->createScheduledTalk($date, '09:00', '10:00', $rooms->random()->id));
            $created->push($this->createScheduledTalk($date, '11:30', '12:30', $rooms->random()->id));
            $created->push($this->createScheduledTalk($date, '13:30', '14:30', $rooms->random()->id));
            $created->push($this->createScheduledTalk($date, '15:00', '16:30', $rooms->random()->id));
            $created->push($this->createScheduledTalk($date, '17:30', '18:45', $rooms->random()->id));
        }

        return $created;
    }

    private function createScheduledTalk(string $date, string $start, string $end, int $roomId): Talk
    {
        return Talk::factory()->create([
            'status' => 'scheduled',
            'scheduled_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'room_id' => $roomId,
        ]);
    }
}
