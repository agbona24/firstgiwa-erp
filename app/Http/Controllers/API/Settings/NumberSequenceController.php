<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NumberSequenceController extends Controller
{
    protected $table = 'number_sequences';

    /**
     * Get all number sequences
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;

        $sequences = DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->orderBy('document')
            ->get()
            ->map(function ($seq) {
                $seq->example = $seq->prefix . $seq->separator . str_pad($seq->next_number, $seq->padding, '0', STR_PAD_LEFT);
                return $seq;
            });

        return response()->json([
            'success' => true,
            'data' => $sequences
        ]);
    }

    /**
     * Update a number sequence
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'prefix' => 'required|string|max:20',
            'next_number' => 'required|integer|min:1',
            'padding' => 'required|integer|min:1|max:10',
            'separator' => 'nullable|string|max:5',
        ]);

        $tenantId = Auth::user()->tenant_id;

        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->update([
                'prefix' => $request->prefix,
                'next_number' => $request->next_number,
                'padding' => $request->padding,
                'separator' => $request->separator ?? '-',
                'updated_at' => now(),
            ]);

        $sequence = DB::table($this->table)->find($id);
        $sequence->example = $sequence->prefix . $sequence->separator . str_pad($sequence->next_number, $sequence->padding, '0', STR_PAD_LEFT);

        return response()->json([
            'success' => true,
            'message' => 'Number sequence updated successfully',
            'data' => $sequence
        ]);
    }

    /**
     * Reset a sequence to a specific number
     */
    public function reset(Request $request, $id)
    {
        $request->validate([
            'next_number' => 'required|integer|min:1',
        ]);

        $tenantId = Auth::user()->tenant_id;

        DB::table($this->table)
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->update([
                'next_number' => $request->next_number,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Sequence reset successfully'
        ]);
    }

    /**
     * Get next number for a document type
     */
    public function getNext($document)
    {
        $tenantId = Auth::user()->tenant_id;

        $sequence = DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->where('document', $document)
            ->first();

        if (!$sequence) {
            return response()->json([
                'success' => false,
                'message' => 'Sequence not found'
            ], 404);
        }

        $number = $sequence->prefix . $sequence->separator . str_pad($sequence->next_number, $sequence->padding, '0', STR_PAD_LEFT);

        return response()->json([
            'success' => true,
            'data' => [
                'number' => $number,
                'next_number' => $sequence->next_number
            ]
        ]);
    }
}
