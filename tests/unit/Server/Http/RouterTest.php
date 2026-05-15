<?php

namespace Phlex\Tests\Unit\Server\Http;

use PHPUnit\Framework\TestCase;
use Phlex\Server\Http\Router;
use Phlex\Server\Http\Request;
use Phlex\Server\Http\Response;

/**
 * Unit tests for Router class.
 *
 * @covers \Phlex\Server\Http\Router
 */
class RouterTest extends TestCase
{
    /** @var Router Router instance under test */
    private Router $router;

    /**
     * Set up router for each test.
     */
    protected function setUp(): void
    {
        $this->router = new Router();
    }

    /**
     * @covers \Phlex\Server\Http\Router::get
     * @covers \Phlex\Server\Http\Router::getRoutes
     */
    public function testCanRegisterGetRoute(): void
    {
        $this->router->get('/test', function($req) {
            return (new Response())->json(['ok' => true]);
        });

        $routes = $this->router->getRoutes();

        $this->assertArrayHasKey('GET', $routes);
    }

    /**
     * @covers \Phlex\Server\Http\Router::post
     * @covers \Phlex\Server\Http\Router::put
     * @covers \Phlex\Server\Http\Router::delete
     */
    public function testCanRegisterMultipleHttpMethods(): void
    {
        $this->router->post('/test', fn() => new Response());
        $this->router->put('/test', fn() => new Response());
        $this->router->delete('/test', fn() => new Response());

        $routes = $this->router->getRoutes();

        $this->assertArrayHasKey('POST', $routes);
        $this->assertArrayHasKey('PUT', $routes);
        $this->assertArrayHasKey('DELETE', $routes);
    }

    /**
     * @covers \Phlex\Server\Http\Router::get
     * @covers \Phlex\Server\Http\Router::dispatch
     */
    public function testCanUsePathParameters(): void
    {
        $this->router->get('/users/{id}', function($req, $params) {
            return (new Response())->json($params);
        });

        // Create a mock request
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['REQUEST_URI'] = '/users/123';
        $_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';

        $request = Request::fromGlobals();
        $response = $this->router->dispatch($request);

        $this->assertEquals(200, $response->statusCode);
    }

    /**
     * @covers \Phlex\Server\Http\Router::dispatch
     */
    public function testReturns404ForUnknownRoute(): void
    {
        $this->router->get('/exists', fn() => new Response());

        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['REQUEST_URI'] = '/unknown';
        $_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';

        $request = Request::fromGlobals();
        $response = $this->router->dispatch($request);

        $this->assertEquals(404, $response->statusCode);
    }
}