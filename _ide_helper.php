<?php

/**
 * IDE Helper for Laravel auth() and facades.
 * This file is not loaded at runtime - it only helps IDEs understand Laravel's magic.
 * 
 * @see https://github.com/barryvdh/laravel-ide-helper
 */

namespace Illuminate\Support\Facades {

    /**
     * @method static \App\Models\User|null user()
     * @method static int|string|null id()
     */
    class Auth {}
}

namespace Illuminate\Contracts\Auth {

    /**
     * @method \App\Models\User|null user()
     * @method int|string|null id()
     */
    interface Guard {}

    /**
     * @method \App\Models\User|null user()
     * @method int|string|null id()
     */
    interface StatefulGuard {}
}

namespace {

    /**
     * Get the available auth instance.
     *
     * @param  string|null  $guard
     * @return \Illuminate\Contracts\Auth\Factory|\Illuminate\Contracts\Auth\Guard|\Illuminate\Contracts\Auth\StatefulGuard
     */
    function auth($guard = null) {}
}
