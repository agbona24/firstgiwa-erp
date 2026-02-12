<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class BackupController extends Controller
{
    protected $group = 'backup';

    /**
     * Get backup settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'auto_backup_enabled' => false,
            'backup_frequency' => 'daily',
            'backup_time' => '02:00',
            'backup_retention_days' => 30,
            'backup_to_cloud' => false,
            'cloud_provider' => 's3',
            'last_backup_at' => null,
            'last_backup_size' => null,
        ];

        // Get database size
        $dbSize = $this->getDatabaseSize();

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings, ['database_size' => $dbSize])
        ]);
    }

    /**
     * Get database size
     */
    protected function getDatabaseSize()
    {
        $driver = config('database.default');

        try {
            if ($driver === 'sqlite') {
                $dbPath = config('database.connections.sqlite.database');
                if (file_exists($dbPath)) {
                    return $this->formatBytes(filesize($dbPath));
                }
            } elseif ($driver === 'mysql') {
                $dbName = config('database.connections.mysql.database');
                $result = DB::select("SELECT SUM(data_length + index_length) as size FROM information_schema.tables WHERE table_schema = ?", [$dbName]);
                if (!empty($result)) {
                    return $this->formatBytes($result[0]->size ?? 0);
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to get database size: ' . $e->getMessage());
        }

        return 'Unknown';
    }

    /**
     * Format bytes to human readable
     */
    protected function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * Update backup settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'auto_backup_enabled' => 'boolean',
            'backup_frequency' => 'nullable|in:daily,weekly,monthly',
            'backup_time' => 'nullable|date_format:H:i',
            'backup_retention_days' => 'nullable|integer|min:1|max:365',
            'backup_to_cloud' => 'boolean',
            'cloud_provider' => 'nullable|in:s3,google,dropbox',
        ]);

        $fields = [
            'auto_backup_enabled', 'backup_frequency', 'backup_time',
            'backup_retention_days', 'backup_to_cloud', 'cloud_provider'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Backup settings updated successfully'
        ]);
    }

    /**
     * Get backup history
     */
    public function history()
    {
        $tenantId = Auth::user()->tenant_id;
        $backupDir = "backups/tenant_{$tenantId}";

        // Ensure backup directory exists
        if (!Storage::exists($backupDir)) {
            Storage::makeDirectory($backupDir);
        }

        // Get backup files from storage
        $backups = [];
        $files = Storage::files($backupDir);

        foreach ($files as $file) {
            $size = Storage::size($file);
            $backups[] = [
                'filename' => basename($file),
                'size' => $this->formatBytes($size),
                'size_bytes' => $size,
                'created_at' => date('Y-m-d H:i:s', Storage::lastModified($file)),
            ];
        }

        // Sort by date descending
        usort($backups, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

        return response()->json([
            'success' => true,
            'data' => $backups
        ]);
    }

    /**
     * Create manual backup
     */
    public function createBackup()
    {
        $tenantId = Auth::user()->tenant_id;
        $backupDir = "backups/tenant_{$tenantId}";

        // Ensure backup directory exists
        if (!Storage::exists($backupDir)) {
            Storage::makeDirectory($backupDir);
        }

        $timestamp = now()->format('Y-m-d_His');
        $driver = config('database.default');

        try {
            if ($driver === 'sqlite') {
                $filename = $this->backupSqlite($backupDir, $timestamp, $tenantId);
            } elseif ($driver === 'mysql') {
                $filename = $this->backupMysql($backupDir, $timestamp, $tenantId);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => "Backup not supported for database driver: {$driver}"
                ], 400);
            }

            $filePath = "{$backupDir}/{$filename}";
            $fileSize = Storage::size($filePath);

            // Update settings with last backup info
            Setting::set($this->group, 'last_backup_at', now()->toDateTimeString());
            Setting::set($this->group, 'last_backup_size', $this->formatBytes($fileSize));

            // Cleanup old backups based on retention policy
            $this->cleanupOldBackups($backupDir);

            return response()->json([
                'success' => true,
                'message' => 'Backup created successfully',
                'data' => [
                    'filename' => $filename,
                    'size' => $this->formatBytes($fileSize),
                    'created_at' => now()->toDateTimeString()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Backup failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Backup SQLite database
     */
    protected function backupSqlite($backupDir, $timestamp, $tenantId)
    {
        $dbPath = config('database.connections.sqlite.database');
        $filename = "backup_{$timestamp}.zip";
        $tempDir = storage_path('app/temp');

        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $zipPath = "{$tempDir}/{$filename}";

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception('Could not create backup archive');
        }

        // Add database file
        if (file_exists($dbPath)) {
            $zip->addFile($dbPath, 'database.sqlite');
        }

        // Add metadata
        $metadata = [
            'created_at' => now()->toDateTimeString(),
            'tenant_id' => $tenantId,
            'database_driver' => 'sqlite',
            'app_version' => config('app.version', '1.0.0'),
        ];
        $zip->addFromString('metadata.json', json_encode($metadata, JSON_PRETTY_PRINT));

        $zip->close();

        // Move to storage
        Storage::put("{$backupDir}/{$filename}", file_get_contents($zipPath));
        unlink($zipPath);

        return $filename;
    }

    /**
     * Backup MySQL database
     */
    protected function backupMysql($backupDir, $timestamp, $tenantId)
    {
        $filename = "backup_{$timestamp}.zip";
        $tempDir = storage_path('app/temp');
        $sqlFile = "{$tempDir}/database.sql";

        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        // Build mysqldump command
        $command = sprintf(
            'mysqldump --host=%s --port=%s --user=%s --password=%s %s > %s 2>&1',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($sqlFile)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($sqlFile)) {
            throw new \Exception('mysqldump failed: ' . implode("\n", $output));
        }

        // Create ZIP archive
        $zipPath = "{$tempDir}/{$filename}";
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception('Could not create backup archive');
        }

        $zip->addFile($sqlFile, 'database.sql');

        // Add metadata
        $metadata = [
            'created_at' => now()->toDateTimeString(),
            'tenant_id' => $tenantId,
            'database_driver' => 'mysql',
            'database_name' => $database,
            'app_version' => config('app.version', '1.0.0'),
        ];
        $zip->addFromString('metadata.json', json_encode($metadata, JSON_PRETTY_PRINT));

        $zip->close();

        // Move to storage and cleanup
        Storage::put("{$backupDir}/{$filename}", file_get_contents($zipPath));
        unlink($zipPath);
        unlink($sqlFile);

        return $filename;
    }

    /**
     * Cleanup old backups based on retention policy
     */
    protected function cleanupOldBackups($backupDir)
    {
        $settings = Setting::getGroup($this->group);
        $retentionDays = $settings['backup_retention_days'] ?? 30;

        $files = Storage::files($backupDir);
        $cutoffDate = now()->subDays($retentionDays);

        foreach ($files as $file) {
            $lastModified = Storage::lastModified($file);
            if ($lastModified < $cutoffDate->timestamp) {
                Storage::delete($file);
            }
        }
    }

    /**
     * Download a backup file
     */
    public function download($filename)
    {
        $tenantId = Auth::user()->tenant_id;
        $path = "backups/tenant_{$tenantId}/{$filename}";

        if (!Storage::exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file not found'
            ], 404);
        }

        return Storage::download($path);
    }

    /**
     * Delete a backup file
     */
    public function deleteBackup($filename)
    {
        $tenantId = Auth::user()->tenant_id;
        $path = "backups/tenant_{$tenantId}/{$filename}";

        if (!Storage::exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file not found'
            ], 404);
        }

        Storage::delete($path);

        return response()->json([
            'success' => true,
            'message' => 'Backup deleted successfully'
        ]);
    }

    /**
     * Export data in various formats
     */
    public function exportData(Request $request)
    {
        $request->validate([
            'type' => 'required|in:products,customers,sales,purchases,inventory,all',
            'format' => 'required|in:csv,json,excel',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $type = $request->type;
        $format = $request->format;

        try {
            $data = $this->getExportData($type, $tenantId);
            $filename = "export_{$type}_" . now()->format('Y-m-d_His');

            if ($format === 'json') {
                $content = json_encode($data, JSON_PRETTY_PRINT);
                $mimeType = 'application/json';
                $filename .= '.json';
            } elseif ($format === 'csv') {
                $content = $this->arrayToCsv($data);
                $mimeType = 'text/csv';
                $filename .= '.csv';
            } else {
                // For Excel, we'll use CSV with Excel-compatible encoding
                $content = "\xEF\xBB\xBF" . $this->arrayToCsv($data); // UTF-8 BOM for Excel
                $mimeType = 'text/csv';
                $filename .= '.csv';
            }

            return response($content)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");

        } catch (\Exception $e) {
            Log::error('Export failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get data for export based on type
     */
    protected function getExportData($type, $tenantId)
    {
        $data = [];

        switch ($type) {
            case 'products':
                $data = DB::table('products')
                    ->where('tenant_id', $tenantId)
                    ->select('sku', 'name', 'description', 'unit_of_measure', 'cost_price', 'selling_price', 'reorder_level', 'is_active', 'created_at')
                    ->get()
                    ->toArray();
                break;

            case 'customers':
                $data = DB::table('customers')
                    ->where('tenant_id', $tenantId)
                    ->select('customer_code', 'name', 'email', 'phone', 'address', 'contact_person', 'credit_limit', 'payment_terms_days', 'is_active', 'created_at')
                    ->get()
                    ->toArray();
                break;

            case 'sales':
                $data = DB::table('sales_orders')
                    ->where('tenant_id', $tenantId)
                    ->select('order_number', 'customer_id', 'order_date', 'total_amount', 'tax_amount', 'discount_amount', 'status', 'payment_status', 'created_at')
                    ->get()
                    ->toArray();
                break;

            case 'purchases':
                $data = DB::table('purchase_orders')
                    ->where('tenant_id', $tenantId)
                    ->select('po_number', 'supplier_id', 'order_date', 'total_amount', 'tax_amount', 'status', 'created_at')
                    ->get()
                    ->toArray();
                break;

            case 'inventory':
                $data = DB::table('inventory')
                    ->where('tenant_id', $tenantId)
                    ->join('products', 'inventory.product_id', '=', 'products.id')
                    ->select('products.sku', 'products.name', 'inventory.warehouse_id', 'inventory.quantity', 'inventory.reserved_quantity', 'inventory.last_stock_take', 'inventory.updated_at')
                    ->get()
                    ->toArray();
                break;

            case 'all':
                $data = [
                    'products' => $this->getExportData('products', $tenantId),
                    'customers' => $this->getExportData('customers', $tenantId),
                    'sales' => $this->getExportData('sales', $tenantId),
                    'purchases' => $this->getExportData('purchases', $tenantId),
                    'inventory' => $this->getExportData('inventory', $tenantId),
                ];
                break;
        }

        return $data;
    }

    /**
     * Convert array to CSV format
     */
    protected function arrayToCsv($data)
    {
        if (empty($data)) {
            return '';
        }

        // For nested data (all export), return JSON instead
        if (isset($data['products'])) {
            return json_encode($data, JSON_PRETTY_PRINT);
        }

        $output = fopen('php://temp', 'r+');
        
        // Headers
        if (!empty($data)) {
            $firstRow = (array) $data[0];
            fputcsv($output, array_keys($firstRow));
        }

        // Data rows
        foreach ($data as $row) {
            fputcsv($output, (array) $row);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    /**
     * Restore from backup
     */
    public function restore(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|mimes:zip',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $driver = config('database.default');

        try {
            $file = $request->file('backup_file');
            $tempDir = storage_path('app/temp');

            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $zipPath = $file->storeAs('temp', 'restore_' . time() . '.zip');
            $zipFullPath = storage_path('app/' . $zipPath);

            $zip = new ZipArchive();
            if ($zip->open($zipFullPath) !== true) {
                throw new \Exception('Could not open backup file');
            }

            $extractDir = "{$tempDir}/restore_" . time();
            $zip->extractTo($extractDir);
            $zip->close();

            // Read metadata
            $metadataPath = "{$extractDir}/metadata.json";
            if (!file_exists($metadataPath)) {
                throw new \Exception('Invalid backup file: metadata not found');
            }

            $metadata = json_decode(file_get_contents($metadataPath), true);

            // Verify tenant
            if (($metadata['tenant_id'] ?? null) !== $tenantId) {
                throw new \Exception('Backup does not belong to this tenant');
            }

            if ($driver === 'sqlite') {
                $dbFile = "{$extractDir}/database.sqlite";
                if (!file_exists($dbFile)) {
                    throw new \Exception('Database file not found in backup');
                }

                $dbPath = config('database.connections.sqlite.database');
                
                // Create backup of current database before restore
                if (file_exists($dbPath)) {
                    copy($dbPath, $dbPath . '.bak');
                }

                // Restore
                copy($dbFile, $dbPath);

            } elseif ($driver === 'mysql') {
                $sqlFile = "{$extractDir}/database.sql";
                if (!file_exists($sqlFile)) {
                    throw new \Exception('SQL file not found in backup');
                }

                $host = config('database.connections.mysql.host');
                $port = config('database.connections.mysql.port', 3306);
                $database = config('database.connections.mysql.database');
                $username = config('database.connections.mysql.username');
                $password = config('database.connections.mysql.password');

                $command = sprintf(
                    'mysql --host=%s --port=%s --user=%s --password=%s %s < %s 2>&1',
                    escapeshellarg($host),
                    escapeshellarg($port),
                    escapeshellarg($username),
                    escapeshellarg($password),
                    escapeshellarg($database),
                    escapeshellarg($sqlFile)
                );

                exec($command, $output, $returnCode);

                if ($returnCode !== 0) {
                    throw new \Exception('MySQL restore failed: ' . implode("\n", $output));
                }
            }

            // Cleanup
            $this->deleteDirectory($extractDir);
            Storage::delete($zipPath);

            return response()->json([
                'success' => true,
                'message' => 'Backup restored successfully. Please log in again.',
            ]);

        } catch (\Exception $e) {
            Log::error('Restore failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Restore failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete directory recursively
     */
    protected function deleteDirectory($dir)
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = "{$dir}/{$file}";
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
