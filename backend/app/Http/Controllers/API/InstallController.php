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

            // Run migrations
            Artisan::call('migrate', ['--force' => true]);
            $migrateOutput = Artisan::output();

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
            return response()->json([
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage(),
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
        try {
            // Check if migrations table exists and has entries
            if (!Schema::hasTable('migrations')) {
                return false;
            }
            
            // Check if essential tables exist
            $essentialTables = ['users', 'tenants', 'roles', 'permissions'];
            foreach ($essentialTables as $table) {
                if (!Schema::hasTable($table)) {
                    return false;
                }
            }
            
            // Check for installed marker in storage
            return File::exists(storage_path('installed'));
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Mark application as installed
     */
    private function markAsInstalled(): void
    {
        File::put(storage_path('installed'), now()->toIso8601String());
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
