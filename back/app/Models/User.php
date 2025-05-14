<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    protected $guarded = [
        'id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isPublic(): bool
    {
        return $this->role === 'public';
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isSpeaker(): bool
    {
        return $this->role === 'speaker';
    }

    public function isOrganizer(): bool
    {
        return $this->role === 'organizer';
    }

    public function talks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Talk::class, 'speaker_id');
    }

    /**
     * Get the favorites of this user.
     */
    public function favorites(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    /**
     * Get the talks favorited by this user.
     */
    public function favoriteTalks()
    {
        return $this->belongsToMany(Talk::class, 'favorites', 'user_id', 'talk_id')->withTimestamps();
    }
}
