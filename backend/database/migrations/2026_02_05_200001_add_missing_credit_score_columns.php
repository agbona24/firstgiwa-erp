<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_credit_scores', function (Blueprint $table) {
            // Rename avg_days_to_pay to average_days_to_pay for consistency
            $table->renameColumn('avg_days_to_pay', 'average_days_to_pay');
            
            // Rename recommendation_notes to recommendations
            $table->renameColumn('recommendation_notes', 'recommendations');
        });

        Schema::table('customer_credit_scores', function (Blueprint $table) {
            // Add on_time_payment_rate column
            $table->decimal('on_time_payment_rate', 8, 2)->default(0)->after('late_payments');
        });
    }

    public function down(): void
    {
        Schema::table('customer_credit_scores', function (Blueprint $table) {
            $table->dropColumn('on_time_payment_rate');
        });

        Schema::table('customer_credit_scores', function (Blueprint $table) {
            $table->renameColumn('average_days_to_pay', 'avg_days_to_pay');
            $table->renameColumn('recommendations', 'recommendation_notes');
        });
    }
};
