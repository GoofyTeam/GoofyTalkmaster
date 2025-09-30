<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Demo',
            'first_name' => 'Superadmin',
            'email' => 'superadmin@demo.com',
            'role' => 'superadmin',
            'password' => Hash::make('password'),
        ]);

        User::factory()->create([
            'name' => 'Demo',
            'first_name' => 'Speaker',
            'email' => 'speaker@demo.com',
            'role' => 'speaker',
            'password' => Hash::make('password'),
        ]);

        User::factory()->create([
            'name' => 'Demo',
            'first_name' => 'User',
            'email' => 'user@demo.com',
            'role' => 'public',
            'password' => Hash::make('password'),
        ]);

        User::factory(10)->create([
            'role' => 'speaker',
        ]);

        User::factory(10)->create([
            'role' => 'organizer',
        ]);

        User::factory(10)->create();

        $this->call(RoomSeeder::class);
        $this->call(TalkSeeder::class);  // Ajout du TalkSeeder
    }
}
