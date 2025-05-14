<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class RoomFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $roomNames = ['Salle A', 'Salle B', 'Salle C', 'Salle D', 'Salle E'];

        return [
            'name' => $this->faker->unique()->randomElement($roomNames),
            'capacity' => $this->faker->numberBetween(20, 300),
        ];
    }
}
