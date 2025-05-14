<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Talk extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'subject',
        'description',
        'duration_minutes',
        'level',
        'status',
        'speaker_id',
        'scheduled_date',
        'start_time',
        'room_id',
    ];

    /**
     * Get the speaker (user) for this talk.
     */
    public function speaker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'speaker_id');
    }

    /**
     * Get the room for this talk.
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the favorites for this talk.
     */
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    /**
     * Get the users who favorited this talk.
     */
    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorites', 'talk_id', 'user_id')->withTimestamps();
    }
}
