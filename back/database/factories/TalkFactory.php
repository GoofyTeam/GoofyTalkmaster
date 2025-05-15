<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

class TalkFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subjects = ['PHP', 'JavaScript', 'DevOps', 'Design', 'Mobile', 'Python', 'Java'];
        $levels = ['beginner', 'intermediate', 'advanced'];
        $statuses = ['pending', 'accepted', 'rejected', 'scheduled'];

        // Créer un speaker si nécessaire
        $speakerId = User::where('role', 'speaker')->exists()
            ? User::where('role', 'speaker')->inRandomOrder()->first()->id
            : User::factory()->create(['role' => 'speaker'])->id;

        return [
            'title' => $this->faker->sentence(6),
            'subject' => $this->faker->randomElement($subjects),
            'description' => $this->faker->paragraphs(3, true),
            'level' => $this->faker->randomElement($levels),
            'status' => $this->faker->randomElement($statuses),
            'speaker_id' => $speakerId,
            'scheduled_date' => null,
            'start_time' => null,
            'end_time' => null,
            'room_id' => null,
        ];
    }

    /**
     * Configure le talk comme étant programmé
     */
    public function scheduled(): static
    {
        // S'assurer qu'une salle existe ou en créer une
        $roomId = Room::exists()
            ? Room::inRandomOrder()->first()->id
            : Room::factory()->create()->id;

        return $this->state(function (array $attributes) use ($roomId) {
            $startTime = $this->faker->dateTimeBetween('09:00', '18:00')->format('H:i');
            $endTime = Carbon::createFromFormat('H:i', $startTime)
                ->addMinutes($this->faker->randomElement([30, 45, 60, 90]))
                ->format('H:i');

            return [
                'status' => 'scheduled',
                'scheduled_date' => $this->faker->date('Y-m-d'),
                'start_time' => $startTime,
                'end_time' => $endTime,
                'room_id' => $roomId,
            ];
        });
    }

    /**
     * Configure le talk comme étant en attente
     */
    public function pending(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'pending',
                'scheduled_date' => null,
                'start_time' => null,
                'end_time' => null,
                'room_id' => null,
            ];
        });
    }

    /**
     * Configure le talk comme étant accepté
     */
    public function accepted(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'accepted',
                'scheduled_date' => null,
                'start_time' => null,
                'end_time' => null,
                'room_id' => null,
            ];
        });
    }
}
