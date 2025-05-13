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
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->after('email')->nullable(false);
            $table->string('profile_picture')->after('first_name')->nullable();
            $table->text('description')->after('profile_picture')->nullable();
            $table->enum(
                'role',
                ['public', 'speaker', 'organizer', 'superadmin']
            )
                ->after('description')
                ->default('public');

            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('first_name');
            $table->dropColumn('profile_picture');
            $table->dropColumn('description');
            $table->dropColumn('role');
            $table->dropSoftDeletes();
        });
    }
};
