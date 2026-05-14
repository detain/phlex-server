<?php

namespace Phlex\Server\Core;

use Phlex\Server\Http\Request;
use Phlex\Server\Http\Response;
use Phlex\Server\Http\Router;
use Phlex\Common\Logger\LoggerFactory;
use Phlex\Common\Logger\LogChannels;

class Application
{
    private Router $router;
    private array $middleware = [];
    private array $config;
    private static ?Application $instance = null;

    public function __construct(string $configPath)
    {
        $this->config = include $configPath;
        $this->router = new Router();
        $this->loadRoutes();
        self::$instance = $this;
    }

    public static function getInstance(): ?Application
    {
        return self::$instance;
    }

    private function loadRoutes(): void
    {
        // Health check endpoint
        $this->router->get('/health', function(Request $request) {
            return (new Response())->json([
                'status' => 'ok',
                'timestamp' => time(),
                'version' => '1.0.0',
            ]);
        });

        // System info endpoint
        $this->router->get('/system/info', function(Request $request) {
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

    private function loadApiRoutes(): void
    {
        // Placeholder for API routes - will be populated in later phases
        $this->router->get('/api/v1', function(Request $request) {
            return (new Response())->json([
                'api' => 'Phlex Media Server',
                'version' => 'v1',
                'endpoints' => '/health, /system/info',
            ]);
        });
    }

    public function middleware(callable $middleware): self
    {
        $this->middleware[] = $middleware;
        return $this;
    }

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
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    private function handleException(\Throwable $e): void
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

    public function getRouter(): Router
    {
        return $this->router;
    }
}