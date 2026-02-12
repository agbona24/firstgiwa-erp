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
        Schema::table('production_runs', function (Blueprint $table) {
            // Drop the foreign key first, then make nullable, then re-add foreign key
            $table->dropForeign(['finished_product_id']);
            $table->foreignId('finished_product_id')->nullable()->change();
            $table->foreign('finished_product_id')->references('id')->on('products')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_runs', function (Blueprint $table) {
            $table->dropForeign(['finished_product_id']);
            $table->foreignId('finished_product_id')->nullable(false)->change();
            $table->foreign('finished_product_id')->references('id')->on('products')->onDelete('restrict');
        });
    }
};
