<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Super',
            'first_name' => 'Admin',
            'email' => 'superadmin@test.com',
            'role' => 'superadmin',
        ]);

        User::factory(10)->create([
            'role' => 'speaker',
        ]);

        User::factory(10)->create([
            'role' => 'organizer',
        ]);

        User::factory(10)->create();

        $this->call(RoomSeeder::class);
    }
}
