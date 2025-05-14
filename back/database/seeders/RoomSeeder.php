<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rooms = [
            ['name' => 'Salle A', 'capacity' => 100],
            ['name' => 'Salle B', 'capacity' => 80],
            ['name' => 'Salle C', 'capacity' => 120],
            ['name' => 'Salle D', 'capacity' => 50],
            ['name' => 'Salle E', 'capacity' => 200],
        ];

        foreach ($rooms as $room) {
            Room::create($room);
        }
    }
}
