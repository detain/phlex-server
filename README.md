# Phlex Media Server

A comprehensive media server platform built with PHP 8.3+, featuring real-time WebSocket communication, HTTP REST APIs, and support for multiple client platforms including Roku, Samsung Tizen, and Windows.

## Overview

Phlex Media Server provides a complete media management and streaming solution:

- **Media Library Management**: Organize and browse media collections
- **User Authentication**: JWT-based auth with refresh tokens
- **Real-time SyncPlay**: Watch content together with friends
- **Live TV Support**: DVR and guide integration
- **DLNA Streaming**: Standard protocol support for compatible devices
- **Transcoding**: On-the-fly media conversion via FFmpeg
- **HLS Streaming**: Adaptive bitrate streaming for web clients
- **WebSocket Events**: Real-time progress and notification delivery

## Architecture

```
src/
├── Server/
│   ├── Core/           # Application bootstrap and core
│   ├── Http/            # HTTP REST API layer
│   │   ├── Controllers/ # Request handlers
│   │   ├── Request.php  # HTTP request representation
│   │   ├── Response.php # HTTP response builder
│   │   └── Router.php  # Route dispatching
│   └── WebSocket/       # Real-time communication
│       ├── Connection.php      # Client connection wrapper
│       ├── ConnectionPool.php  # Connection management
│       ├── MessageHandler.php  # Event routing
│       ├── WebSocketServer.php # Server implementation
│       └── Events.php          # Event type constants
├── Session/            # Playback session management
├── Media/              # Media library and metadata
├── Auth/               # Authentication services
└── Common/             # Shared utilities
```

## Requirements

- **PHP**: 8.3 or higher
- **MySQL**: 8.0+ or MariaDB 10.6+
- **Workerman**: 5.0+ (bundled via Composer)
- **FFmpeg**: For transcoding (optional)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/phlex.git
cd phlex

# Install dependencies
composer install

# Configure environment
cp .env.example .env
# Edit .env with your database and service credentials

# Run database migrations
php scripts/migrate.php

# Start the development server
php start.php server
```

## Configuration

Configuration is managed via PHP files in `config/`:

```php
// config/server.php
return [
    'server' => [
        'name' => 'Phlex Media Server',
        'host' => '0.0.0.0',
        'port' => 8080,
    ],
    'websocket' => [
        'host' => '0.0.0.0',
        'port' => 8097,
    ],
    'database' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'phlex',
        'username' => 'phlex',
        'password' => 'secure-password',
    ],
    'debug' => false,
];
```

## API Reference

### HTTP Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/system/info` | Server information |
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/refresh` | Token refresh |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/sessions` | List user sessions |
| DELETE | `/api/v1/sessions/{id}` | End a session |
| POST | `/api/v1/sessions/{id}/progress` | Report playback progress |
| GET | `/api/v1/sessions/{id}/progress` | Get playback state |

### WebSocket Events

**Connection Events:**
- `connected` - Sent on successful connection
- `client_disconnected` - Broadcast when client disconnects

**Authentication Events:**
- `auth_request` - Request authentication
- `auth_success` - Authentication successful
- `auth_failure` - Authentication failed

**Playback Events:**
- `playback_start` - Playback started
- `playback_pause` - Playback paused
- `playback_stop` - Playback stopped
- `playback_progress` - Progress update
- `playback_seek` - Seek performed

**SyncPlay Events:**
- `syncplay_create_group` - Create watch group
- `syncplay_join_group` - Join watch group
- `syncplay_leave_group` - Leave watch group
- `syncplay_sync_state` - State synchronization

## Development

### Running Tests

```bash
# Run all tests
./vendor/bin/phpunit

# Run with coverage
./vendor/bin/phpunit --coverage-html coverage-report

# Run specific test suite
./vendor/bin/phpunit --testsuite Unit
./vendor/bin/phpunit --testsuite Integration
```

### Code Standards

This project follows PSR-12 coding standards and uses static analysis tools:

```bash
# Check code style
./vendor/bin/phpcs --standard=PSR12 src/

# Run static analysis
./vendor/bin/phpstan analyze src/ --level=9
./vendor/bin/psalm
```

### Git Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -am 'Add new feature'`
3. Push to remote: `git push origin feature/my-feature`
4. Create Pull Request on GitHub
5. After review, merge via squash-merge

## Contributing

1. Fork the repository
2. Create your feature branch
3. Ensure all tests pass (`./vendor/bin/phpunit`)
4. Follow PSR-12 coding standards
5. Submit a pull request

## License

Proprietary - All rights reserved.

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

For detailed development documentation, see [DEVELOPER.md](DEVELOPER.md).
