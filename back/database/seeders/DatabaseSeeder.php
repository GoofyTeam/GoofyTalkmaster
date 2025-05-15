<?php

namespace Database\Seeders;

use App\Models\User;
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

        User::factory()->create([
            'name' => 'MyUser',
            'first_name' => 'User',
            'email' => 'user@test.com',
            'role' => 'public',
        ]);
        User::factory()->create([
            'name' => 'MyUser2',
            'first_name' => 'User',
            'email' => 'user2@test.com',
            'role' => 'public',
        ]);
        User::factory()->create([
            'name' => 'MyUser3',
            'first_name' => 'User',
            'email' => 'user3@test.com',
            'role' => 'public',
        ]);
        User::factory()->create([
            'name' => 'MyUser4',
            'first_name' => 'User',
            'email' => 'user4@test.com',
            'role' => 'public',
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
