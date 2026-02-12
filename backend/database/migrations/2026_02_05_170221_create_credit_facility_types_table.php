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
        Schema::create('credit_facility_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->decimal('default_limit', 15, 2)->default(0);
            $table->decimal('max_limit', 15, 2)->default(0);
            $table->integer('payment_terms')->default(30);
            $table->enum('payment_terms_unit', ['days', 'weeks', 'months'])->default('days');
            $table->decimal('interest_rate', 5, 2)->default(0);
            $table->integer('grace_period')->default(0);
            $table->enum('grace_period_unit', ['days', 'weeks', 'months'])->default('days');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_facility_types');
    }
};
