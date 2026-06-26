<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['email', 'password', 'role_id', 'city'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

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

    public function verificationCodes(): HasMany
    {
        return $this->hasMany(EmailVerificationCode::class);
    }

    public function role(): BelongsTo {
        return $this->belongsTo(Role::class);
    }

    public function practiceRequests(): HasMany
    {
        return $this->hasMany(PracticeRequest::class, 'user_id');
    }

    public function hasPendingPracticeRequest(): bool
    {
        return $this->practiceRequests()
            ->whereHas('status', function ($query) {
                $query->where('code', 'pending');
            })->exists();
    }

    public function practiceRequestsLastWeekCount(): int
    {
        return $this->practiceRequests()
            ->where('created_at', '>', now()->subDays(7))
            ->count();
    }

    public function hasActivePractice(): bool
    {
        return $this->belongsToMany(
            PracticeGroup::class,
            'user_practice_groups',
            'user_id',
            'group_id'
        )
            ->using(UserPracticeGroup::class)
            ->where('end_date', '>', now()->toDateString())
            ->exists();
    }

    public function practiceGroups()
    {
        return $this->belongsToMany(
            PracticeGroup::class,
            'user_practice_groups',
            'user_id',
            'group_id'
        );
    }
}
