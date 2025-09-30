<?php

namespace Database\Seeders;

use App\Services\SampleTalkGenerator;
use Illuminate\Database\Seeder;

class TalkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(SampleTalkGenerator::class)->generate();
    }
}
