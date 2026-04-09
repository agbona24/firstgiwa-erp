<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // On "parent" products (e.g. Fishmeal): which services to auto-add at POS
            $table->enum('pos_service', ['none', 'pelleting', 'both'])
                  ->default('none')
                  ->after('track_inventory');

            // On the service products themselves: what role they play at POS
            $table->enum('service_role', ['pelleting', 'crushing'])
                  ->nullable()
                  ->after('pos_service');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['pos_service', 'service_role']);
        });
    }
};
