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
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('branch_code'); // Unique per tenant, not globally
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            
            // Branch type and settings
            $table->string('branch_type')->default('retail'); // retail, warehouse, production, office
            $table->boolean('is_main_branch')->default(false);
            $table->boolean('is_active')->default(true);
            
            // Manager & staff
            $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Operational details
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->json('operating_days')->nullable(); // ['monday', 'tuesday', ...]
            
            // Financial settings
            $table->boolean('can_process_sales')->default(true);
            $table->boolean('can_process_purchases')->default(false);
            $table->boolean('can_transfer_stock')->default(true);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('tenant_id');
            $table->index('is_active');
            
            // Composite unique: branch_code is unique per tenant
            $table->unique(['tenant_id', 'branch_code'], 'branches_tenant_branch_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
