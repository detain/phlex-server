# Developer Documentation

This document provides detailed information for developers working on the Phlex Media Server project.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Architecture Overview](#architecture-overview)
3. [Coding Standards](#coding-standards)
4. [Testing Guide](#testing-guide)
5. [Git Workflow](#git-workflow)

---

## Development Environment Setup

### Prerequisites

- PHP 8.3+ with extensions: `mysql`, `pdo`, `pdo_mysql`, `json`, `gd`, `zip`, `fileinfo`
- MySQL 8.0+ or MariaDB 10.6+
- Composer 2.x
- Git

### Local Setup

```bash
# Clone the repository
git clone https://github.com/your-org/phlex.git
cd phlex

# Install PHP dependencies
composer install

# Create a local configuration
cp config/server.php.example config/server.php
cp config/database.php.example config/database.php

# Edit configuration files with your local settings
vim config/server.php
vim config/database.php

# Run the test suite to verify setup
./vendor/bin/phpunit --testsuite Unit
```

### Starting the Server

```bash
# Start HTTP server (port 8080)
php start.php server

# Start WebSocket server (port 8097) in separate terminal
php start.php websocket

# Or start both together with Workerman
php start.php both
```

---

## Architecture Overview

### Request Lifecycle

```
Client Request
    ↓
Request::fromGlobals()
    ↓
Application::run() → Middleware Stack
    ↓
Router::dispatch()
    ↓
Route Handler (Controller)
    ↓
Response::send()
    ↓
Client Response
```

### Core Components

#### Request (`src/Server/Http/Request.php`)

Represents an HTTP request with:
- HTTP method, path, headers, query parameters
- Body parsing (JSON)
- Bearer token extraction
- Client IP detection (with proxy support)

```php
$request = Request::fromGlobals();
$userId = $request->userId;           // Set by auth middleware
$bearerToken = $request->bearerToken; // From Authorization header
$body = $request->body;               // JSON decoded body
$params = $request->pathParams;         // From route pattern
```

#### Response (`src/Server/Http/Response.php`)

Fluent HTTP response builder:

```php
(new Response())
    ->status(201)
    ->header('X-Custom', 'value')
    ->json(['user' => ['id' => 1]])
    ->send();
```

#### Router (`src/Server/Http/Router.php`)

Route registration and dispatch:

```php
$router->get('/users/{id}', [UserController::class, 'show']);
$router->post('/users', [UserController::class, 'create']);
$router->group('/api/v1', function($r) {
    $r->get('/items', handler);
}, [authMiddleware()]);
```

### WebSocket Architecture

```
Client connects → WebSocketServer::onConnect()
    ↓
Connection wrapper created → added to ConnectionPool
    ↓
Messages handled by MessageHandler
    ↓
Events dispatched to registered callbacks
    ↓
Broadcasts via sendToUser() / sendToSession() / broadcast()
```

### Connection Interface

All WebSocket connections implement `ConnectionInterface`:

```php
interface ConnectionInterface
{
    public function getId(): string;
    public function send(string|array $data): void;
    public function sendMessage(string $type, array $data = []): void;
    public function close(): void;
    public function getUserId(): ?string;
    public function setSessionId(?string $sessionId): void;
    // ... session data management methods
}
```

---

## Coding Standards

### PSR-12 Compliance

All code must follow [PSR-12](https://www.php-fig.org/psr/psr-12/) coding style:

- 4 spaces for indentation
- Opening braces on same line for classes/functions
- Opening braces on next line for control structures
- Maximum line length: 120 characters
- PHP keywords lowercase: `true`, `false`, `null`
- Use `declare(strict_types=1)` on all PHP files

### PHPDoc Requirements

Every class, method, and property must have comprehensive PHPDoc:

```php
/**
 * Short description of the class.
 *
 * Longer description if needed, explaining the purpose
 * and usage of the class.
 *
 * @author Author Name
 * @version 1.0.0
 * @description Brief description of what this class does.
 * @see RelatedClass For related functionality
 */
class MyClass
{
    /** @var string Description of property */
    private string $myProperty;

    /**
     * Brief description of the method.
     *
     * @param string $param Description of parameter
     * @param array<string, mixed> $options Optional configuration
     * @return Response The response object
     * @throws InvalidArgumentException If parameters are invalid
     *
     * @example
     * ```php
     * $myClass->myMethod('value', ['option' => true]);
     * ```
     */
    public function myMethod(string $param, array $options = []): Response
    {
        // implementation
    }
}
```

### Type Safety

- Use strict type declarations: `declare(strict_types=1)`
- Declare return types on all methods
- Declare parameter types where known
- Use union types where appropriate: `callable|array`

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `UserProfileManager` |
| Methods | camelCase | `getUserById()` |
| Properties | camelCase | `userId` |
| Constants | UPPER_SNAKE | `AUTH_SUCCESS` |
| Variables | camelCase | `$userData` |
| Files | PascalCase | `UserProfileManager.php` |
| Interfaces | PascalCase + Interface suffix | `ConnectionInterface` |

---

## Testing Guide

### Test Structure

```
tests/
├── unit/
│   └── {Module}/
│       └── {ClassName}Test.php
└── integration/
    └── {Feature}/
        └── {Scenario}Test.php
```

### Writing Unit Tests

```php
<?php

namespace Phlex\Tests\Unit\Server\Http;

use PHPUnit\Framework\TestCase;
use Phlex\Server\Http\Response;

/**
 * Unit tests for Response class.
 *
 * @covers \Phlex\Server\Http\Response
 */
class ResponseTest extends TestCase
{
    /**
     * @covers \Phlex\Server\Http\Response::json
     * @covers \Phlex\Server\Http\Response::status
     */
    public function testCanCreateJsonResponse(): void
    {
        $response = (new Response())->json(['key' => 'value']);

        $this->assertEquals(200, $response->statusCode);
        $this->assertEquals('application/json', $response->headers['Content-Type']);
    }
}
```

### Test Guidelines

1. **One assertion per test** when practical
2. Use descriptive test names: `testCanCreateJsonResponse()`
3. Use `@covers` annotations to track coverage
4. Test both success and failure cases
5. Mock external dependencies

### Running Tests

```bash
# Run all tests
./vendor/bin/phpunit

# Run with coverage report
./vendor/bin/phpunit --coverage-html coverage-report

# Run specific test suite
./vendor/bin/phpunit --testsuite Unit
./vendor/bin/phpunit --testsuite Integration

# Run specific test class
./vendor/bin/phpunit tests/unit/Server/Http/ResponseTest.php

# Run tests matching a pattern
./vendor/bin/phpunit --filter testCanCreate
```

### Continuous Integration

GitHub Actions workflows run on every push:

1. **PHPUnit Tests**: Runs full test suite with MySQL service
2. **PHP CodeSniffer**: Checks PSR-12 compliance
3. **PHPStan**: Level 9 static analysis
4. **Psalm**: Additional static analysis
5. **Security Audit**: Checks for known vulnerabilities

---

## Git Workflow

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/{description}` | `feature/user-authentication` |
| Bug Fix | `fix/{description}` | `fix/session-timeout` |
| Hotfix | `hotfix/{description}` | `hotfix/security-patch` |
| Release | `release/{version}` | `release/1.2.0` |
| Chore | `chore/{description}` | `chore/update-deps` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(auth): add JWT refresh token support
fix(webhook): handle malformed JSON gracefully
docs(api): add endpoint documentation
test(session): add tests for concurrent sessions
chore(deps): upgrade workerman to v5.0
```

### Pull Request Process

1. **Create branch** from `develop` for new features, `master` for hotfixes
2. **Make changes** following coding standards
3. **Add tests** for new functionality
4. **Run locally**: `./vendor/bin/phpunit && ./vendor/bin/phpcs`
5. **Open PR** with clear description and reference issues
6. **Await review** and address feedback
7. **Squash merge** on approval

### Code Review Checklist

- [ ] Code follows PSR-12 style
- [ ] All new code has PHPDoc
- [ ] Tests pass and have adequate coverage
- [ ] No debug code left in
- [ ] No hardcoded credentials
- [ ] Proper error handling
- [ ] Security considerations addressed

---

## Useful Commands

```bash
# Development
php start.php server          # Start HTTP server
php start.php websocket       # Start WebSocket server
php start.php both            # Start both servers

# Testing
./vendor/bin/phpunit                    # Run all tests
./vendor/bin/phpunit --coverage-html coverage/  # With coverage
./vendor/bin/phpunit --testsuite Unit  # Unit tests only

# Code Quality
./vendor/bin/phpcs --standard=PSR12 src/           # Check style
./vendor/bin/phpstan analyze src/ --level=9        # Static analysis
./vendor/bin/psalm                                     # Psalm analysis

# Database
php scripts/migrate.php                  # Run migrations
php scripts/seed.php                     # Seed database
```

---

## Additional Resources

- [Technical Specification](./PHLEX_MEDIA_SERVER_TECHNICAL_SPEC.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [API Documentation](./public_html/spec/openapi.yaml)
- [Platform Documentation](./PLATFORM_*.md)
