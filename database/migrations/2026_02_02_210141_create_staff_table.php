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
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Link to user account if exists
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->string('staff_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable();
            $table->string('phone');
            $table->text('address')->nullable();
            
            // Employment details
            $table->string('department')->nullable(); // HR, Operations, Sales, etc.
            $table->string('position');
            $table->string('employment_type')->default('full-time'); // full-time, part-time, contract
            $table->date('date_of_birth')->nullable();
            $table->date('date_hired');
            $table->date('date_terminated')->nullable();
            $table->string('employment_status')->default('active'); // active, suspended, terminated, on-leave
            
            // Salary & compensation
            $table->decimal('basic_salary', 15, 2)->default(0);
            $table->string('salary_frequency')->default('monthly'); // monthly, weekly, daily
            $table->decimal('housing_allowance', 15, 2)->default(0);
            $table->decimal('transport_allowance', 15, 2)->default(0);
            $table->decimal('other_allowances', 15, 2)->default(0);
            
            // Banking details
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            
            // Tax & identification
            $table->string('tax_id')->nullable();
            $table->string('national_id')->nullable();
            $table->string('pension_number')->nullable();
            
            // Emergency contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('tenant_id');
            $table->index('branch_id');
            $table->index('staff_number');
            $table->index('employment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
