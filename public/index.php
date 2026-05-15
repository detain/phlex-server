<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Phlex\Server\Core\Application;
use Phlex\Server\Http\Request;
use Phlex\Common\Database\ConnectionPool;
use Phlex\Common\Logger\LoggerFactory;
use Phlex\Auth\AuthManager;
use Phlex\Auth\JwtHandler;
use Phlex\Auth\UserRepository;
use Phlex\Media\Library\LibraryManager;
use Phlex\Media\Library\ItemRepository;
use Phlex\Session\SessionManager;
use Phlex\Session\PlaybackController;

// Initialize components
$configPath = __DIR__ . '/../config/server.php';
$dbConfigPath = __DIR__ . '/../config/database.php';
$loggerConfigPath = __DIR__ . '/../config/logger.php';

ConnectionPool::init($dbConfigPath);
LoggerFactory::init($loggerConfigPath);

$db = ConnectionPool::getConnection('mysql');
$jwtHandler = new JwtHandler(getenv('JWT_SECRET') ?: 'default-secret-change-me');
$userRepository = new UserRepository($db);
$authManager = new AuthManager($userRepository, $jwtHandler, LoggerFactory::get(\Phlex\Common\Logger\LogChannels::AUTH));
$itemRepository = new ItemRepository($db);
$libraryManager = new LibraryManager($db, $scanner ?? null, $watcher ?? null);
$sessionManager = new SessionManager($db);
$playbackController = new PlaybackController($db, $sessionManager);

// Get request
$request = Request::fromGlobals();

// Check auth for API routes
$token = $request->getBearerToken();
if ($token) {
    $auth = $authManager->validateAccessToken($token);
    if ($auth) {
        $request->userId = $auth['user_id'];
    }
}

// Route handling
$path = $request->path;

if (str_starts_with($path, '/api/')) {
    // API routes handled by controllers
    header('Content-Type: application/json');
    echo json_encode(['message' => 'API endpoint - implement in Step 5.2']);
} else {
    // Page routes
    $renderer = new \Phlex\Server\WebPortal\PageRenderer(
        __DIR__ . '/templates',
        $libraryManager,
        $itemRepository,
        $playbackController
    );

    if ($path === '/' || $path === '') {
        $response = $renderer->renderHome($request);
    } elseif ($path === '/login') {
        $response = $renderer->renderLogin($request);
    } else {
        http_response_code(404);
        echo '<h1>404 - Page not found</h1>';
        exit;
    }

    $response->send();
}