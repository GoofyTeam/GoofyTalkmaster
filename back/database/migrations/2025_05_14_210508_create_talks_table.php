<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('talks', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('subject', 100);
            $table->text('description');
            $table->enum('level', ['beginner', 'intermediate', 'advanced']);
            $table->enum('status', ['pending', 'accepted', 'rejected', 'scheduled'])->default('pending');
            $table->foreignId('speaker_id')->constrained('users')->onDelete('cascade');
            $table->date('scheduled_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('talks');
    }
};
