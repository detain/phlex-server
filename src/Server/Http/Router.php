<?php

namespace Phlex\Server\Http;

class Router
{
    private array $routes = [];
    private array $namedRoutes = [];
    private array $middleware = [];
    private array $groupMiddleware = [];
    private ?string $groupPrefix = null;

    public function get(string $path, callable|array $handler): self
    {
        return $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): self
    {
        return $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable|array $handler): self
    {
        return $this->addRoute('PUT', $path, $handler);
    }

    public function patch(string $path, callable|array $handler): self
    {
        return $this->addRoute('PATCH', $path, $handler);
    }

    public function delete(string $path, callable|array $handler): self
    {
        return $this->addRoute('DELETE', $path, $handler);
    }

    public function options(string $path, callable|array $handler): self
    {
        return $this->addRoute('OPTIONS', $path, $handler);
    }

    public function any(string $path, callable|array $handler): self
    {
        foreach (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as $method) {
            $this->addRoute($method, $path, $handler);
        }
        return $this;
    }

    public function match(array $methods, string $path, callable|array $handler): self
    {
        foreach ($methods as $method) {
            $this->addRoute(strtoupper($method), $path, $handler);
        }
        return $this;
    }

    private function addRoute(string $method, string $path, callable|array $handler): self
    {
        $fullPath = $this->groupPrefix ? $this->groupPrefix . $path : $path;

        // Convert path parameters like {id} to regex
        $pattern = preg_replace('/\{([a-zA-Z_]+)\}/', '(?P<$1>[^/]+)', $fullPath);
        $pattern = '#^' . $pattern . '$#';

        $this->routes[$method][$pattern] = [
            'handler' => $handler,
            'middleware' => $this->groupMiddleware,
            'path' => $fullPath,
        ];

        return $this;
    }

    public function middleware(callable $middleware): self
    {
        $this->groupMiddleware[] = $middleware;
        return $this;
    }

    public function group(string $prefix, callable $callback, array $middleware = []): self
    {
        $previousPrefix = $this->groupPrefix;
        $previousMiddleware = $this->groupMiddleware;

        $this->groupPrefix = $prefix;
        $this->groupMiddleware = array_merge($this->groupMiddleware, $middleware);

        $callback($this);

        $this->groupPrefix = $previousPrefix;
        $this->groupMiddleware = $previousMiddleware;

        return $this;
    }

    public function dispatch(Request $request): Response
    {
        $method = $request->method;
        $path = $request->path;

        if (!isset($this->routes[$method])) {
            return $this->notFound();
        }

        foreach ($this->routes[$method] as $pattern => $route) {
            if (preg_match($pattern, $path, $matches)) {
                // Extract path parameters
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $request->pathParams = $params;

                // Apply middleware
                $middlewareHandler = $this->runMiddleware($route['middleware'], $request);
                if ($middlewareHandler instanceof Response) {
                    return $middlewareHandler;
                }

                // Call handler
                return $this->callHandler($route['handler'], $request, $params);
            }
        }

        return $this->notFound();
    }

    private function runMiddleware(array $middlewareStack, Request $request): ?Response
    {
        foreach ($middlewareStack as $middleware) {
            $result = $middleware($request);
            if ($result instanceof Response) {
                return $result;
            }
        }
        return null;
    }

    private function callHandler(callable|array $handler, Request $request, array $params): Response
    {
        if (is_array($handler)) {
            [$class, $method] = $handler;
            $instance = is_string($class) ? new $class() : $class;
            return $instance->$method($request, $params);
        }

        return $handler($request, $params);
    }

    private function notFound(): Response
    {
        return (new Response())
            ->status(404)
            ->json([
                'error' => 'Not Found',
                'message' => 'The requested resource was not found',
            ]);
    }

    public function getRoutes(): array
    {
        return $this->routes;
    }
}