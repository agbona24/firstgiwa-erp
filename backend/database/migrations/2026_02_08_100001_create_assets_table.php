<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Assets table for tracking fixed assets (equipment, vehicles, furniture, etc.)
     */
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            
            // Asset identification
            $table->string('name');
            $table->string('asset_code')->unique()->nullable(); // e.g., AST-001
            $table->text('description')->nullable();
            
            // Asset classification
            $table->enum('category', [
                'equipment',      // Machinery, computers, tools
                'vehicle',        // Cars, trucks, motorcycles
                'furniture',      // Office furniture, fixtures
                'building',       // Property, land
                'electronics',    // Phones, printers, etc.
                'other'
            ])->default('equipment');
            
            // Financial details
            $table->decimal('purchase_price', 15, 2);          // Original cost
            $table->decimal('current_value', 15, 2);           // Current book value
            $table->decimal('salvage_value', 15, 2)->default(0); // Value at end of life
            $table->date('purchase_date');
            
            // Depreciation
            $table->enum('depreciation_method', [
                'straight_line',   // Equal amount each year
                'declining_balance', // Percentage of remaining value
                'none'             // No depreciation (land)
            ])->default('straight_line');
            $table->integer('useful_life_years')->default(5);  // Expected lifespan
            $table->decimal('accumulated_depreciation', 15, 2)->default(0);
            $table->date('last_depreciation_date')->nullable();
            
            // Status tracking
            $table->enum('status', [
                'active',      // In use
                'inactive',    // Not in use but owned
                'disposed',    // Sold or discarded
                'maintenance'  // Under repair
            ])->default('active');
            $table->date('disposal_date')->nullable();
            $table->decimal('disposal_value', 15, 2)->nullable();
            
            // Location & assignment
            $table->string('location')->nullable();
            $table->string('assigned_to')->nullable();  // Employee/department
            
            // Documentation
            $table->string('serial_number')->nullable();
            $table->string('supplier')->nullable();
            $table->string('warranty_expiry')->nullable();
            $table->text('notes')->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['tenant_id', 'category']);
            $table->index(['tenant_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
