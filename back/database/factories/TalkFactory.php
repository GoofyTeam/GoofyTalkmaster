<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\User;
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
            'duration_minutes' => $this->faker->randomElement([30, 45, 60, 90]),
            'level' => $this->faker->randomElement($levels),
            'status' => $this->faker->randomElement($statuses),
            'speaker_id' => $speakerId,
            'scheduled_date' => null,
            'start_time' => null,
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
            return [
                'status' => 'scheduled',
                'scheduled_date' => $this->faker->date('Y-m-d'),
                'start_time' => $this->faker->time('H:i'),
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
                'room_id' => null,
            ];
        });
    }
}
