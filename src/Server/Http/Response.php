<?php

namespace Phlex\Server\Http;

class Response
{
    public int $statusCode = 200;
    public array $headers = [];
    public string $body = '';
    public string $version = '1.1';

    public function status(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function header(string $name, string $value): self
    {
        $this->headers[$name] = $value;
        return $this;
    }

    public function json(array $data, ?int $statusCode = null): self
    {
        if ($statusCode !== null) {
            $this->statusCode = $statusCode;
        }
        $this->headers['Content-Type'] = 'application/json';
        $this->body = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return $this;
    }

    public function html(string $html, ?int $statusCode = null): self
    {
        if ($statusCode !== null) {
            $this->statusCode = $statusCode;
        }
        $this->headers['Content-Type'] = 'text/html; charset=utf-8';
        $this->body = $html;
        return $this;
    }

    public function text(string $text, ?int $statusCode = null): self
    {
        if ($statusCode !== null) {
            $this->statusCode = $statusCode;
        }
        $this->headers['Content-Type'] = 'text/plain; charset=utf-8';
        $this->body = $text;
        return $this;
    }

    public function xml(string $xml, ?int $statusCode = null): self
    {
        if ($statusCode !== null) {
            $this->statusCode = $statusCode;
        }
        $this->headers['Content-Type'] = 'application/xml; charset=utf-8';
        $this->body = $xml;
        return $this;
    }

    public function file(string $path, ?string $contentType = null, ?string $downloadName = null): self
    {
        if (!file_exists($path)) {
            return $this->status(404)->json(['error' => 'File not found']);
        }

        $this->statusCode = 200;
        $this->body = file_get_contents($path);

        if ($contentType) {
            $this->headers['Content-Type'] = $contentType;
        } else {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $this->headers['Content-Type'] = finfo_file($finfo, $path);
            finfo_close($finfo);
        }

        $this->headers['Content-Length'] = strlen($this->body);

        if ($downloadName) {
            $this->headers['Content-Disposition'] = 'attachment; filename="' . $downloadName . '"';
        }

        return $this;
    }

    public function redirect(string $url, int $statusCode = 302): self
    {
        $this->statusCode = $statusCode;
        $this->headers['Location'] = $url;
        return $this;
    }

    public function noContent(int $statusCode = 204): self
    {
        $this->statusCode = $statusCode;
        $this->body = '';
        return $this;
    }

    public function withHeaders(array $headers): self
    {
        foreach ($headers as $name => $value) {
            $this->headers[$name] = $value;
        }
        return $this;
    }

    public function send(): void
    {
        // Set status code header
        http_response_code($this->statusCode);

        // Send headers
        foreach ($this->headers as $name => $value) {
            header("$name: $value");
        }

        // Send body
        echo $this->body;
    }

    public function toString(): string
    {
        $response = "HTTP/{$this->version} {$this->statusCode} {$this->getStatusText()}\r\n";
        foreach ($this->headers as $name => $value) {
            $response .= "$name: $value\r\n";
        }
        $response .= "\r\n";
        $response .= $this->body;
        return $response;
    }

    private function getStatusText(): string
    {
        $statusTexts = [
            200 => 'OK',
            201 => 'Created',
            204 => 'No Content',
            301 => 'Moved Permanently',
            302 => 'Found',
            304 => 'Not Modified',
            400 => 'Bad Request',
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Not Found',
            405 => 'Method Not Allowed',
            409 => 'Conflict',
            422 => 'Unprocessable Entity',
            429 => 'Too Many Requests',
            500 => 'Internal Server Error',
            502 => 'Bad Gateway',
            503 => 'Service Unavailable',
        ];

        return $statusTexts[$this->statusCode] ?? 'Unknown';
    }
}