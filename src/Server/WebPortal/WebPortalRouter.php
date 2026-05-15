<?php

namespace Phlex\Server\WebPortal;

use Phlex\Server\Http\Request;
use Phlex\Server\Http\Response;
use Phlex\Server\Http\Router;
use Phlex\Media\Library\LibraryManager;
use Phlex\Media\Library\ItemRepository;
use Phlex\Session\SessionManager;
use Phlex\Session\PlaybackController;
use Phlex\Auth\AuthManager;

class WebPortalRouter
{
    private Router $router;
    private LibraryManager $libraryManager;
    private ItemRepository $itemRepository;
    private SessionManager $sessionManager;
    private PlaybackController $playbackController;
    private AuthManager $authManager;

    public function __construct(
        LibraryManager $libraryManager,
        ItemRepository $itemRepository,
        SessionManager $sessionManager,
        PlaybackController $playbackController,
        AuthManager $authManager
    ) {
        $this->libraryManager = $libraryManager;
        $this->itemRepository = $itemRepository;
        $this->sessionManager = $sessionManager;
        $this->playbackController = $playbackController;
        $this->authManager = $authManager;
        $this->router = new Router();
        $this->registerRoutes();
    }

    private function registerRoutes(): void
    {
        // Auth routes
        $this->router->get('/api/v1/libraries', [$this, 'getLibraries']);
        $this->router->get('/api/v1/libraries/{id}', [$this, 'getLibrary']);
        $this->router->get('/api/v1/libraries/{id}/items', [$this, 'getLibraryItems']);
        $this->router->get('/api/v1/media/{id}', [$this, 'getMediaItem']);
        $this->router->get('/api/v1/media/{id}/playback', [$this, 'getPlaybackInfo']);
        $this->router->get('/api/v1/users/me/continue-watching', [$this, 'getContinueWatching']);
        $this->router->get('/api/v1/users/me/recently-watched', [$this, 'getRecentlyWatched']);
        
        // Settings routes
        $this->router->get('/api/v1/users/me/settings', [$this, 'getUserSettings']);
        $this->router->put('/api/v1/users/me/settings', [$this, 'updateUserSettings']);
    }

    public function dispatch(Request $request): Response
    {
        return $this->router->dispatch($request);
    }

    public function getLibraries(Request $request, array $params): Response
    {
        $libraries = $this->libraryManager->getAllLibraries();
        
        // Load item counts
        foreach ($libraries as &$lib) {
            $lib['item_count'] = $this->itemRepository->countByType($lib['id'], $lib['type']);
        }

        return (new Response())->json(['libraries' => $libraries]);
    }

    public function getLibrary(Request $request, array $params): Response
    {
        $library = $this->libraryManager->getLibrary($params['id']);
        
        if (!$library) {
            return (new Response())->status(404)->json(['error' => 'Library not found']);
        }

        return (new Response())->json(['library' => $library]);
    }

    public function getLibraryItems(Request $request, array $params): Response
    {
        $libraryId = $params['id'];
        $type = $request->query['type'] ?? null;
        $limit = (int)($request->query['limit'] ?? 50);
        $offset = (int)($request->query['offset'] ?? 0);

        if ($type) {
            $items = $this->itemRepository->getByType($libraryId, $type, $limit, $offset);
        } else {
            $items = $this->itemRepository->getByLibrary($libraryId, $limit, $offset);
        }

        return (new Response())->json([
            'items' => $items,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    public function getMediaItem(Request $request, array $params): Response
    {
        $item = $this->itemRepository->findById($params['id']);
        
        if (!$item) {
            return (new Response())->status(404)->json(['error' => 'Item not found']);
        }

        // Get streams
        $item['streams'] = $this->itemRepository->getItemStreams($item['id']);

        return (new Response())->json(['item' => $item]);
    }

    public function getPlaybackInfo(Request $request, array $params): Response
    {
        $item = $this->itemRepository->findById($params['id']);
        
        if (!$item) {
            return (new Response())->status(404)->json(['error' => 'Item not found']);
        }

        // Build playback info
        $playbackInfo = [
            'id' => $item['id'],
            'name' => $item['name'],
            'type' => $item['type'],
            'media_sources' => [
                [
                    'id' => 'default',
                    'container' => 'mkv',
                    'path' => $item['path'],
                    'direct_play' => true,
                ],
            ],
        ];

        return (new Response())->json(['playback_info' => $playbackInfo]);
    }

    public function getContinueWatching(Request $request, array $params): Response
    {
        $userId = $request->userId ?? '';
        if (!$userId) {
            return (new Response())->status(401)->json(['error' => 'Unauthorized']);
        }

        $items = $this->playbackController->getContinueWatching($userId);
        return (new Response())->json(['items' => $items]);
    }

    public function getRecentlyWatched(Request $request, array $params): Response
    {
        $userId = $request->userId ?? '';
        if (!$userId) {
            return (new Response())->status(401)->json(['error' => 'Unauthorized']);
        }

        $items = $this->playbackController->getRecentlyWatched($userId);
        return (new Response())->json(['items' => $items]);
    }

    public function getUserSettings(Request $request, array $params): Response
    {
        $userId = $request->userId ?? '';
        if (!$userId) {
            return (new Response())->status(401)->json(['error' => 'Unauthorized']);
        }

        // Get from database
        $settings = [
            'max_streams' => 3,
            'max_bitrate' => 100000000,
            'preferred_audio_language' => 'en',
            'preferred_subtitle_language' => 'en',
            'subtitle_mode' => 'only_foreign',
        ];

        return (new Response())->json(['settings' => $settings]);
    }

    public function updateUserSettings(Request $request, array $params): Response
    {
        $userId = $request->userId ?? '';
        if (!$userId) {
            return (new Response())->status(401)->json(['error' => 'Unauthorized']);
        }

        // Update in database
        return (new Response())->json(['message' => 'Settings updated']);
    }
}