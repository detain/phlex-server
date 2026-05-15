<?php

declare(strict_types=1);

namespace Phlex\Server\Core;

use Phlex\Server\Http\Request;
use Phlex\Server\Http\Response;
use Phlex\Server\Http\Router;
use Phlex\Common\Logger\LoggerFactory;
use Phlex\Common\Logger\LogChannels;
use Throwable;

/**
 * Main application entry point for the Phlex Media Server.
 *
 * This class orchestrates HTTP request handling, middleware execution,
 * and route dispatching. It implements a singleton pattern to provide
 * global access to the application instance.
 *
 * @author Phlex Media Server Team
 * @version 1.0.0
 * @description Core application class that bootstraps the server, loads routes, and handles requests.
 * @see \Phlex\Server\Http\Router For route configuration
 * @see \Phlex\Server\Http\Request For request handling
 * @see \Phlex\Server\Http\Response For response generation
 */
class Application
{
    /** @var Router The router instance for handling request dispatching */
    private Router $router;

    /** @var array<callable> Stack of middleware to apply to requests */
    private array $middleware = [];

    /** @var array<string, mixed> Application configuration array */
    private array $config;

    /** @var Application|null Singleton instance of the application */
    private static ?Application $instance = null;

    /**
     * Creates a new Application instance.
     *
     * Loads configuration from the specified path, initializes the router,
     * loads all routes, and sets up the singleton instance.
     *
     * @param string $configPath Absolute path to the PHP configuration file
     * @throws RuntimeException If config file does not exist or returns invalid data
     *
     * @example
     * ```php
     * $app = new Application('/etc/phlex/config.php');
     * $app->run();
     * ```
     */
    public function __construct(string $configPath)
    {
        if (!file_exists($configPath)) {
            throw new \RuntimeException("Configuration file not found: {$configPath}");
        }

        $this->config = include $configPath;

        if (!is_array($this->config)) {
            throw new \RuntimeException("Configuration file must return an array");
        }

        $this->router = new Router();
        $this->loadRoutes();
        self::$instance = $this;
    }

    /**
     * Gets the singleton Application instance.
     *
     * @return Application|null The singleton instance, or null if not yet constructed
     *
     * @description Returns the global application instance for access throughout the application.
     */
    public static function getInstance(): ?Application
    {
        return self::$instance;
    }

    /**
     * Loads all application routes.
     *
     * Registers health check, system info, and API v1 routes.
     * Override this method in subclasses to add custom routes.
     *
     * @return void
     *
     * @see loadApiRoutes() For API route loading
     */
    private function loadRoutes(): void
    {
        // Health check endpoint - verifies server is responsive
        $this->router->get('/health', function(Request $request): Response {
            return (new Response())->json([
                'status' => 'ok',
                'timestamp' => time(),
                'version' => '1.0.0',
            ]);
        });

        // System info endpoint - returns server metadata
        $this->router->get('/system/info', function(Request $request): Response {
            return (new Response())->json([
                'server' => $this->config['server']['name'] ?? 'Phlex Media Server',
                'version' => '1.0.0',
                'php_version' => PHP_VERSION,
                'workerman_version' => Workerman\Worker::VERSION,
            ]);
        });

        // API v1 routes
        $this->loadApiRoutes();
    }

    /**
     * Loads API v1 routes.
     *
     * Placeholder method for future API endpoint registration.
     * Override in subclasses to add additional API routes.
     *
     * @return void
     */
    private function loadApiRoutes(): void
    {
        // Placeholder for API routes - will be populated in later phases
        $this->router->get('/api/v1', function(Request $request): Response {
            return (new Response())->json([
                'api' => 'Phlex Media Server',
                'version' => 'v1',
                'endpoints' => '/health, /system/info',
            ]);
        });
    }

    /**
     * Registers a global middleware handler.
     *
     * Middleware are executed in registration order before the request
     * is dispatched to the route handler.
     *
     * @param callable $middleware The middleware callback function
     * @return self For method chaining
     *
     * @example
     * ```php
     * $app->middleware(function($request) {
     *     // Authentication check
     *     if (!$request->bearerToken) {
     *         return (new Response())->status(401)->json(['error' => 'Unauthorized']);
     *     }
     *     // Continue to next handler
     * });
     * ```
     */
    public function middleware(callable $middleware): self
    {
        $this->middleware[] = $middleware;
        return $this;
    }

    /**
     * Runs the application, processing incoming HTTP requests.
     *
     * Creates a request from globals, applies middleware, dispatches
     * to the appropriate handler, and sends the response.
     *
     * @return void
     *
     * @throws Throwable Any unhandled exception during request processing
     *
     * @see Request::fromGlobals() For request creation
     * @see Router::dispatch() For route dispatching
     */
    public function run(): void
    {
        $request = Request::fromGlobals();

        // Apply global middleware
        foreach ($this->middleware as $handler) {
            $result = $handler($request);
            if ($result instanceof Response) {
                $result->send();
                return;
            }
        }

        // Dispatch request
        try {
            $response = $this->router->dispatch($request);
            $response->send();
        } catch (Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Handles uncaught exceptions.
     *
     * Logs the exception details and sends an appropriate error response
     * to the client. In debug mode, includes additional error information.
     *
     * @param Throwable $e The uncaught exception
     * @return void
     *
     * @see LoggerFactory::get() For logging setup
     */
    private function handleException(Throwable $e): void
    {
        $logger = LoggerFactory::get(LogChannels::HTTP);
        $logger->error('Unhandled exception: ' . $e->getMessage(), [
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        $response = (new Response())
            ->status(500)
            ->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage(),
            ]);

        if ($this->config['debug'] ?? false) {
            $response->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        }

        $response->send();
    }

    /**
     * Gets the application router.
     *
     * @return Router The router instance for route management
     *
     * @description Provides access to the router for testing or custom route manipulation.
     */
    public function getRouter(): Router
    {
        return $this->router;
    }
}