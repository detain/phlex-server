<?php

namespace Phlex\Server\Http;

class Request
{
    public string $method;
    public string $path;
    public string $queryString;
    public array $headers;
    public array $query;
    public array $body;
    public array $files;
    public string $remoteIp;
    public int $remotePort;
    public string $protocol;
    public ?string $bearerToken = null;

    public static function fromGlobals(): self
    {
        $request = new self();
        $request->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $request->path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $request->queryString = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_QUERY) ?? '';
        $request->headers = self::parseHeaders();
        $request->query = $_GET;
        $request->body = json_decode(file_get_contents('php://input'), true) ?? [];
        $request->files = $_FILES;
        $request->remoteIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $request->remotePort = (int)($_SERVER['REMOTE_PORT'] ?? 0);
        $request->protocol = $_SERVER['SERVER_PROTOCOL'] ?? 'HTTP/1.1';
        $request->bearerToken = $request->getBearerToken();

        return $request;
    }

    private static function parseHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $header = str_replace('_', '-', substr($key, 5));
                $headers[$header] = $value;
            }
        }
        // Also check for headers set via FastCGI
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['CONTENT-TYPE'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['CONTENT-LENGTH'] = $_SERVER['CONTENT_LENGTH'];
        }
        return $headers;
    }

    public function getHeader(string $name): ?string
    {
        $normalized = strtoupper(str_replace('-', '_', $name));
        if (isset($this->headers[$name])) {
            return $this->headers[$name];
        }
        $key = 'HTTP_' . $normalized;
        return $_SERVER[$key] ?? null;
    }

    public function getBearerToken(): ?string
    {
        $auth = $this->getHeader('Authorization') ?? '';
        if (preg_match('/Bearer\s+(.+)/i', $auth, $matches)) {
            return trim($matches[1]);
        }
        return null;
    }

    public function getClientIp(): string
    {
        // Check for forwarded headers (proxy/load balancer)
        $forwardedFor = $this->getHeader('X-Forwarded-For');
        if ($forwardedFor) {
            $ips = explode(',', $forwardedFor);
            return trim($ips[0]);
        }
        return $this->remoteIp;
    }

    public function isGet(): bool
    {
        return $this->method === 'GET';
    }

    public function isPost(): bool
    {
        return $this->method === 'POST';
    }

    public function isPut(): bool
    {
        return $this->method === 'PUT';
    }

    public function isDelete(): bool
    {
        return $this->method === 'DELETE';
    }

    public function isJson(): bool
    {
        return str_contains($this->getHeader('Content-Type') ?? '', 'application/json');
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    public function has(string $key): bool
    {
        return isset($this->body[$key]);
    }
}