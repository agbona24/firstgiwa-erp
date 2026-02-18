<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPageContent extends Model
{
    protected $fillable = ['key', 'content', 'is_active'];

    protected $casts = [
        'content' => 'array',
        'is_active' => 'boolean',
    ];

    public static function getDefault(): ?array
    {
        $record = self::where('key', 'default')->where('is_active', true)->first();
        return $record?->content;
    }
}
