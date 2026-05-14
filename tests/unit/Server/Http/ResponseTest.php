<?php

namespace Phlex\Tests\Unit\Server\Http;

use PHPUnit\Framework\TestCase;
use Phlex\Server\Http\Response;

class ResponseTest extends TestCase
{
    public function testCanCreateJsonResponse(): void
    {
        $response = (new Response())->json(['key' => 'value']);

        $this->assertEquals(200, $response->statusCode);
        $this->assertEquals('application/json', $response->headers['Content-Type']);
        $this->assertStringContainsString('"key"', $response->body);
    }

    public function testCanChainMethods(): void
    {
        $response = (new Response())
            ->status(201)
            ->header('X-Custom', 'value')
            ->json(['created' => true]);

        $this->assertEquals(201, $response->statusCode);
        $this->assertEquals('value', $response->headers['X-Custom']);
    }

    public function testCanCreateHtmlResponse(): void
    {
        $response = (new Response())->html('<h1>Hello</h1>');

        $this->assertEquals('text/html; charset=utf-8', $response->headers['Content-Type']);
    }

    public function testCanRedirect(): void
    {
        $response = (new Response())->redirect('https://example.com', 301);

        $this->assertEquals(301, $response->statusCode);
        $this->assertEquals('https://example.com', $response->headers['Location']);
    }

    public function testNoContentResponse(): void
    {
        $response = (new Response())->noContent();

        $this->assertEquals(204, $response->statusCode);
        $this->assertEquals('', $response->body);
    }
}