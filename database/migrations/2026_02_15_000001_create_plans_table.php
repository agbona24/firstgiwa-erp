<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('price', 10, 2);
            $table->string('billing_period')->default('month');
            $table->text('description')->nullable();
            $table->json('features')->nullable();
            $table->integer('max_users')->nullable();
            $table->integer('max_branches')->nullable();
            $table->integer('max_products')->nullable();
            $table->integer('max_monthly_transactions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_highlighted')->default(false);
            $table->string('badge')->nullable();
            $table->string('button_text')->default('Get Started');
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
