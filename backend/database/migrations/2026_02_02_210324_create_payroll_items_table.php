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
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_run_id')->constrained()->onDelete('cascade');
            $table->foreignId('staff_id')->constrained()->onDelete('restrict');
            $table->string('staff_number');
            $table->string('staff_name');
            $table->string('position');
            
            // Earnings
            $table->decimal('basic_salary', 15, 2)->default(0);
            $table->decimal('housing_allowance', 15, 2)->default(0);
            $table->decimal('transport_allowance', 15, 2)->default(0);
            $table->decimal('meal_allowance', 15, 2)->default(0);
            $table->decimal('overtime_pay', 15, 2)->default(0);
            $table->decimal('bonus', 15, 2)->default(0);
            $table->decimal('commission', 15, 2)->default(0);
            $table->decimal('other_earnings', 15, 2)->default(0);
            $table->decimal('gross_pay', 15, 2)->default(0);
            
            // Deductions
            $table->decimal('tax_deduction', 15, 2)->default(0);
            $table->decimal('pension_deduction', 15, 2)->default(0);
            $table->decimal('health_insurance', 15, 2)->default(0);
            $table->decimal('loan_deduction', 15, 2)->default(0);
            $table->decimal('advance_deduction', 15, 2)->default(0);
            $table->decimal('other_deductions', 15, 2)->default(0);
            $table->decimal('total_deductions', 15, 2)->default(0);
            
            // Net pay
            $table->decimal('net_pay', 15, 2)->default(0);
            
            // Work details
            $table->integer('days_worked')->default(0);
            $table->integer('days_absent')->default(0);
            $table->decimal('overtime_hours', 8, 2)->default(0);
            
            // Banking
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('payroll_run_id');
            $table->index('staff_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
    }
};
