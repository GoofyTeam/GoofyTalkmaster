<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read \App\Models\User $user
 */
class SpeakersRequest extends Model
{
    use HasFactory;

    // 1. Relation vers User
    public function user(): BelongsTo
    {
        // because this model lives in App\Models, you can import User directly
        return $this->belongsTo(User::class, 'user_id');
    }
}
