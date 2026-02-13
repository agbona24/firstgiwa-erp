<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use PDO;
use PDOException;

class InstallController extends Controller
{
    /**
     * Check if the application is already installed
     */
    public function checkInstallStatus()
    {
        $isInstalled = $this->isInstalled();
        
        return response()->json([
            'installed' => $isInstalled,
            'env_exists' => File::exists(base_path('.env')),
            'database_configured' => $this->isDatabaseConfigured(),
            'migrations_run' => $isInstalled,
        ]);
    }

    /**
     * Check system requirements
     */
    public function checkRequirements()
    {
        $requirements = [
            'php' => [
                'name' => 'PHP Version',
                'required' => '8.2.0',
                'current' => PHP_VERSION,
                'passed' => version_compare(PHP_VERSION, '8.2.0', '>='),
            ],
            'extensions' => $this->checkExtensions(),
            'permissions' => $this->checkPermissions(),
        ];

        $allPassed = $requirements['php']['passed'] 
            && collect($requirements['extensions'])->every(fn($ext) => $ext['passed'])
            && collect($requirements['permissions'])->every(fn($perm) => $perm['passed']);

        return response()->json([
            'requirements' => $requirements,
            'all_passed' => $allPassed,
        ]);
    }

    /**
     * Test database connection
     */
    public function testDatabaseConnection(Request $request)
    {
        $request->validate([
            'db_connection' => 'required|in:mysql,pgsql,sqlite',
            'db_host' => 'required_unless:db_connection,sqlite',
            'db_port' => 'required_unless:db_connection,sqlite',
            'db_database' => 'required',
            'db_username' => 'required_unless:db_connection,sqlite',
            'db_password' => 'nullable',
        ]);

        try {
            $connection = $request->db_connection;
            
            if ($connection === 'sqlite') {
                $dbPath = database_path($request->db_database);
                
                // Create SQLite file if it doesn't exist
                if (!File::exists($dbPath)) {
                    File::put($dbPath, '');
                }
                
                $pdo = new PDO("sqlite:{$dbPath}");
            } else {
                $dsn = "{$connection}:host={$request->db_host};port={$request->db_port};dbname={$request->db_database}";
                $pdo = new PDO($dsn, $request->db_username, $request->db_password);
            }
            
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            return response()->json([
                'success' => true,
                'message' => 'Database connection successful!',
            ]);
        } catch (PDOException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Save database configuration to .env file
     */
    public function saveDatabaseConfig(Request $request)
    {
        $request->validate([
            'db_connection' => 'required|in:mysql,pgsql,sqlite',
            'db_host' => 'required_unless:db_connection,sqlite',
            'db_port' => 'required_unless:db_connection,sqlite',
            'db_database' => 'required',
            'db_username' => 'required_unless:db_connection,sqlite',
            'db_password' => 'nullable',
            'app_name' => 'nullable|string',
            'app_url' => 'nullable|string',
        ]);

        try {
            // Read current .env or create from .env.example
            $envPath = base_path('.env');
            $examplePath = base_path('.env.example');
            
            if (!File::exists($envPath)) {
                if (File::exists($examplePath)) {
                    File::copy($examplePath, $envPath);
                } else {
                    // Create minimal .env
                    $this->createMinimalEnv($envPath);
                }
            }

            $envContent = File::get($envPath);

            // Update database settings
            $envContent = $this->updateEnvValue($envContent, 'DB_CONNECTION', $request->db_connection);
            
            if ($request->db_connection === 'sqlite') {
                $envContent = $this->updateEnvValue($envContent, 'DB_DATABASE', database_path($request->db_database));
                // Clear other DB settings for SQLite
                $envContent = $this->updateEnvValue($envContent, 'DB_HOST', '');
                $envContent = $this->updateEnvValue($envContent, 'DB_PORT', '');
                $envContent = $this->updateEnvValue($envContent, 'DB_USERNAME', '');
                $envContent = $this->updateEnvValue($envContent, 'DB_PASSWORD', '');
            } else {
                $envContent = $this->updateEnvValue($envContent, 'DB_HOST', $request->db_host);
                $envContent = $this->updateEnvValue($envContent, 'DB_PORT', $request->db_port);
                $envContent = $this->updateEnvValue($envContent, 'DB_DATABASE', $request->db_database);
                $envContent = $this->updateEnvValue($envContent, 'DB_USERNAME', $request->db_username);
                $envContent = $this->updateEnvValue($envContent, 'DB_PASSWORD', $request->db_password ?? '');
            }

            // Update app settings if provided
            if ($request->app_name) {
                $envContent = $this->updateEnvValue($envContent, 'APP_NAME', '"' . $request->app_name . '"');
            }
            if ($request->app_url) {
                $envContent = $this->updateEnvValue($envContent, 'APP_URL', $request->app_url);
            }

            // Generate app key if not set
            if (!str_contains($envContent, 'APP_KEY=base64:')) {
                $key = 'base64:' . base64_encode(random_bytes(32));
                $envContent = $this->updateEnvValue($envContent, 'APP_KEY', $key);
            }

            File::put($envPath, $envContent);

            // Clear config cache
            Artisan::call('config:clear');

            return response()->json([
                'success' => true,
                'message' => 'Database configuration saved successfully!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save configuration: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Run database migrations
     */
    public function runMigrations(Request $request)
    {
        try {
            // Clear any cached config
            Artisan::call('config:clear');
            
            // Re-read .env
            $dotenv = \Dotenv\Dotenv::createImmutable(base_path());
            $dotenv->load();

            // Check if fresh install is requested (wipe existing tables)
            $freshInstall = $request->boolean('fresh', false);
            
            if ($freshInstall) {
                // Drop all tables and re-run migrations
                Artisan::call('migrate:fresh', ['--force' => true]);
                $migrateOutput = Artisan::output();
            } else {
                // Check for existing tables that might cause conflicts
                $existingTables = $this->getExistingTables();
                
                if (!empty($existingTables) && !in_array('migrations', $existingTables)) {
                    // Tables exist but no migrations table - corrupted state
                    return response()->json([
                        'success' => false,
                        'message' => 'The database contains existing tables but no migration history. This indicates a previous incomplete installation.',
                        'existing_tables' => count($existingTables),
                        'requires_fresh' => true,
                        'action_required' => 'Please use the "Fresh Install" option to clear existing tables, or manually empty the database.',
                    ], 409);
                }
                
                // Run normal migrations
                Artisan::call('migrate', ['--force' => true]);
                $migrateOutput = Artisan::output();
            }

            // Run seeders for essential data (roles, permissions, etc.)
            Artisan::call('db:seed', ['--class' => 'RolePermissionSeeder', '--force' => true]);
            
            // Create storage link if it doesn't exist
            if (!File::exists(public_path('storage'))) {
                Artisan::call('storage:link');
            }

            // Mark as installed
            $this->markAsInstalled();

            return response()->json([
                'success' => true,
                'message' => 'Database migrations completed successfully!',
                'output' => $migrateOutput,
            ]);
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            $userFriendlyMessage = $this->parseDbMigrationError($errorMessage);
            
            return response()->json([
                'success' => false,
                'message' => $userFriendlyMessage,
                'technical_details' => $errorMessage,
            ], 500);
        }
    }

    /**
     * Parse database migration errors and return user-friendly messages
     */
    private function parseDbMigrationError(string $errorMessage): string
    {
        // Table already exists (SQLSTATE 42S01)
        if (str_contains($errorMessage, '42S01') || str_contains($errorMessage, 'already exists')) {
            // Extract table name if possible
            if (preg_match("/Table '([^']+)' already exists/", $errorMessage, $matches)) {
                $tableName = $matches[1];
                return "The database already contains existing tables (e.g., '{$tableName}'). It appears this application was previously installed. Please use an empty database or clear the existing tables before running the installer.";
            }
            return "The database already contains existing tables. It appears this application was previously installed. Please use an empty database or clear the existing tables before running the installer.";
        }

        // Foreign key reference error (SQLSTATE HY000, error 1824)
        if (str_contains($errorMessage, '1824') || str_contains($errorMessage, 'Failed to open the referenced table')) {
            if (preg_match("/referenced table '([^']+)'/", $errorMessage, $matches)) {
                $tableName = $matches[1];
                return "Migration failed: The table '{$tableName}' is required but doesn't exist. This may indicate corrupted migration state. Please clear all tables and try again, or contact support.";
            }
            return "Migration failed due to a missing referenced table. Please clear all tables and try again with an empty database.";
        }

        // Foreign key constraint error (SQLSTATE 23000)
        if (str_contains($errorMessage, '23000') || str_contains($errorMessage, 'foreign key constraint')) {
            return "Migration failed due to a foreign key constraint issue. Please ensure the database is empty before running the installer.";
        }

        // Access denied (SQLSTATE 42000 or 28000)
        if (str_contains($errorMessage, '42000') || str_contains($errorMessage, '28000') || str_contains($errorMessage, 'Access denied')) {
            return "Database access denied. Please verify your database username and password are correct and have sufficient privileges.";
        }

        // Connection refused
        if (str_contains($errorMessage, 'Connection refused') || str_contains($errorMessage, 'SQLSTATE[HY000] [2002]')) {
            return "Could not connect to the database server. Please verify the database host and port are correct and the server is running.";
        }

        // Unknown database (SQLSTATE 42000, error 1049)
        if (str_contains($errorMessage, '1049') || str_contains($errorMessage, 'Unknown database')) {
            return "The specified database does not exist. Please create the database first or verify the database name is correct.";
        }

        // Syntax error
        if (str_contains($errorMessage, 'syntax error') || str_contains($errorMessage, '42000')) {
            return "A database syntax error occurred. This may be a compatibility issue. Please contact support with the technical details.";
        }

        // Default fallback
        return "Migration failed: " . $errorMessage;
    }

    /**
     * Get list of existing tables in the database
     */
    private function getExistingTables(): array
    {
        try {
            $connection = config('database.default');
            $database = config("database.connections.{$connection}.database");
            
            if ($connection === 'mysql') {
                $tables = DB::select('SHOW TABLES');
                $key = "Tables_in_{$database}";
                return array_map(fn($table) => $table->$key, $tables);
            } elseif ($connection === 'pgsql') {
                $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
                return array_map(fn($table) => $table->tablename, $tables);
            } elseif ($connection === 'sqlite') {
                $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                return array_map(fn($table) => $table->name, $tables);
            }
            
            return [];
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Check database status for installer
     */
    public function checkDatabaseStatus()
    {
        try {
            $existingTables = $this->getExistingTables();
            $hasMigrationsTable = in_array('migrations', $existingTables);
            $tableCount = count($existingTables);
            
            $status = 'empty';
            $message = 'Database is empty and ready for installation.';
            
            if ($tableCount > 0) {
                if ($hasMigrationsTable) {
                    $status = 'has_migrations';
                    $message = "Database contains {$tableCount} tables with migration history. You can run migrations to update.";
                } else {
                    $status = 'corrupted';
                    $message = "Database contains {$tableCount} tables but no migration history. A fresh install is required.";
                }
            }
            
            return response()->json([
                'success' => true,
                'status' => $status,
                'message' => $message,
                'table_count' => $tableCount,
                'has_migrations_table' => $hasMigrationsTable,
                'requires_fresh' => $status === 'corrupted',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not check database status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Complete installation
     */
    public function completeInstallation(Request $request)
    {
        try {
            // Final checks
            if (!$this->isDatabaseConfigured()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Database not configured properly.',
                ], 400);
            }

            // Optimize the application
            Artisan::call('config:cache');
            Artisan::call('route:cache');
            Artisan::call('view:cache');

            // Mark installation complete
            $this->markAsInstalled();

            return response()->json([
                'success' => true,
                'message' => 'Installation completed successfully!',
                'redirect' => '/setup',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Installation completion failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check required PHP extensions
     */
    private function checkExtensions(): array
    {
        $required = [
            'pdo' => 'PDO',
            'mbstring' => 'Mbstring',
            'openssl' => 'OpenSSL',
            'tokenizer' => 'Tokenizer',
            'xml' => 'XML',
            'ctype' => 'Ctype',
            'json' => 'JSON',
            'bcmath' => 'BCMath',
            'fileinfo' => 'Fileinfo',
        ];

        $extensions = [];
        foreach ($required as $ext => $name) {
            $extensions[] = [
                'name' => $name,
                'extension' => $ext,
                'passed' => extension_loaded($ext),
            ];
        }

        return $extensions;
    }

    /**
     * Check folder permissions
     */
    private function checkPermissions(): array
    {
        $folders = [
            storage_path() => 'storage',
            storage_path('app') => 'storage/app',
            storage_path('framework') => 'storage/framework',
            storage_path('logs') => 'storage/logs',
            base_path('bootstrap/cache') => 'bootstrap/cache',
            database_path() => 'database',
        ];

        $permissions = [];
        foreach ($folders as $path => $name) {
            $writable = is_writable($path);
            $permissions[] = [
                'name' => $name,
                'path' => $path,
                'passed' => $writable,
                'permission' => $writable ? 'Writable' : 'Not Writable',
            ];
        }

        return $permissions;
    }

    /**
     * Check if database is configured
     */
    private function isDatabaseConfigured(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check if application is installed
     */
    private function isInstalled(): bool
    {
        // Check APP_INSTALLED env variable
        $appInstalled = env('APP_INSTALLED', false);
        
        // If explicitly false or 'false', not installed
        if ($appInstalled === false || $appInstalled === 'false') {
            return false;
        }
        
        // If APP_INSTALLED=true, verify database is actually set up
        try {
            // Check if migrations table exists
            if (!Schema::hasTable('migrations')) {
                return false;
            }
            
            // Check if essential tables exist
            $essentialTables = ['roles', 'permissions'];
            foreach ($essentialTables as $table) {
                if (!Schema::hasTable($table)) {
                    return false;
                }
            }
            
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Mark application as installed
     */
    private function markAsInstalled(): void
    {
        // Update APP_INSTALLED in .env file
        $envPath = base_path('.env');
        
        if (File::exists($envPath)) {
            $envContent = File::get($envPath);
            $envContent = $this->updateEnvValue($envContent, 'APP_INSTALLED', 'true');
            File::put($envPath, $envContent);
            
            // Clear config cache
            Artisan::call('config:clear');
        }
    }

    /**
     * Update or add a value in .env content
     */
    private function updateEnvValue(string $content, string $key, string $value): string
    {
        $pattern = "/^{$key}=.*/m";
        $replacement = "{$key}={$value}";

        if (preg_match($pattern, $content)) {
            return preg_replace($pattern, $replacement, $content);
        }

        return $content . "\n{$replacement}";
    }

    /**
     * Create minimal .env file
     */
    private function createMinimalEnv(string $path): void
    {
        $content = <<<ENV
APP_NAME="FactoryPulse"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
ENV;

        File::put($path, $content);
    }
}
