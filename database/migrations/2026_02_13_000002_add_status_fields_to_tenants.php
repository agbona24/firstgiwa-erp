<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('status')->default('active')->after('is_active'); // active, suspended, trial, cancelled
            $table->timestamp('suspended_at')->nullable()->after('status');
            $table->text('suspended_reason')->nullable()->after('suspended_at');
            $table->unsignedBigInteger('storage_used')->default(0)->after('suspended_reason'); // bytes
            $table->text('notes')->nullable()->after('storage_used');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['status', 'suspended_at', 'suspended_reason', 'storage_used', 'notes']);
        });
    }
};
