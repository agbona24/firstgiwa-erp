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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Company/Organization name
            $table->string('slug')->unique(); // URL-friendly identifier
            $table->string('domain')->unique()->nullable(); // Custom domain
            $table->string('subdomain')->unique()->nullable(); // e.g., acme.firstgiwa-erp.com
            
            // Contact information
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            
            // Subscription & billing
            $table->string('plan')->default('starter'); // starter, professional, enterprise
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscribed_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            
            // Limits (for SaaS tiers)
            $table->integer('max_users')->default(5);
            $table->integer('max_branches')->default(1);
            $table->integer('max_products')->default(1000);
            $table->integer('max_monthly_transactions')->default(10000);
            
            // Customization
            $table->string('logo_url')->nullable();
            $table->string('primary_color')->default('#1e40af'); // Deep blue
            $table->string('secondary_color')->default('#d97706'); // Gold
            $table->json('settings')->nullable(); // Additional tenant-specific settings
            
            // Database connection (for true multi-database isolation if needed)
            $table->string('database_name')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('slug');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
