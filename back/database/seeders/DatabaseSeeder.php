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
        $this->seedDemoUsers();
        $this->seedSpeakerPool();
        $this->seedOrganizerPool();
        $this->seedGeneralAudience();

        $this->call(RoomSeeder::class);
        $this->call(TalkSeeder::class);  // Ajout du TalkSeeder
    }

    private function seedDemoUsers(): void
    {
        $demoUsers = [
            'superadmin@demo.com' => [
                'name' => 'Demo',
                'first_name' => 'Superadmin',
                'role' => 'superadmin',
            ],
            'speaker@demo.com' => [
                'name' => 'Demo',
                'first_name' => 'Speaker',
                'role' => 'speaker',
            ],
            'user@demo.com' => [
                'name' => 'Demo',
                'first_name' => 'User',
                'role' => 'public',
            ],
        ];

        foreach ($demoUsers as $email => $attributes) {
            User::updateOrCreate(
                ['email' => $email],
                $attributes + ['password' => Hash::make('password')]
            );
        }
    }

    private function seedSpeakerPool(): void
    {
        $targetCount = 10;
        $existingCount = User::where('role', 'speaker')
            ->where('email', '!=', 'speaker@demo.com')
            ->count();

        $missing = max(0, $targetCount - $existingCount);
        if ($missing > 0) {
            User::factory($missing)->create([
                'role' => 'speaker',
            ]);
        }
    }

    private function seedOrganizerPool(): void
    {
        $targetCount = 10;
        $existingCount = User::where('role', 'organizer')->count();

        $missing = max(0, $targetCount - $existingCount);
        if ($missing > 0) {
            User::factory($missing)->create([
                'role' => 'organizer',
            ]);
        }
    }

    private function seedGeneralAudience(): void
    {
        $targetCount = 10;
        $existingCount = User::whereNotIn('role', ['speaker', 'organizer', 'superadmin'])
            ->where('email', '!=', 'user@demo.com')
            ->count();

        $missing = max(0, $targetCount - $existingCount);
        if ($missing > 0) {
            User::factory($missing)->create();
        }
    }
}
