<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_charges', function (Blueprint $table) {
            // When true, the amount can be changed at the point of sale / booking.
            // When false, the default_amount is used as-is and cannot be overridden.
            $table->boolean('allow_override')->default(true)->after('add_to_credit');
        });
    }

    public function down(): void
    {
        Schema::table('sale_charges', function (Blueprint $table) {
            $table->dropColumn('allow_override');
        });
    }
};
