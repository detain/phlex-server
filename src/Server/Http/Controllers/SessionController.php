<?php

namespace Phlex\Server\Http\Controllers;

use Phlex\Server\Http\Request;
use Phlex\Server\Http\Response;
use Phlex\Session\SessionManager;
use Phlex\Session\PlaybackController;

class SessionController
{
    private SessionManager $sessionManager;
    private PlaybackController $playbackController;

    public function __construct(
        SessionManager $sessionManager,
        PlaybackController $playbackController
    ) {
        $this->sessionManager = $sessionManager;
        $this->playbackController = $playbackController;
    }

    public function listSessions(Request $request, array $params): Response
    {
        $userId = $request->userId ?? '';
        if (!$userId) {
            return (new Response())->status(401)->json(['error' => 'Unauthorized']);
        }

        $sessions = $this->sessionManager->getUserSessions($userId);
        return (new Response())->json(['sessions' => $sessions]);
    }

    public function endSession(Request $request, array $params): Response
    {
        $sessionId = $params['id'] ?? '';
        $session = $this->sessionManager->getSession($sessionId);

        if (!$session) {
            return (new Response())->status(404)->json(['error' => 'Session not found']);
        }

        // Verify ownership
        if ($session['user_id'] !== ($request->userId ?? '')) {
            return (new Response())->status(403)->json(['error' => 'Forbidden']);
        }

        $this->sessionManager->endSession($sessionId);

        return (new Response())->json(['message' => 'Session ended']);
    }

    public function reportProgress(Request $request, array $params): Response
    {
        $sessionId = $params['id'] ?? '';
        $data = $request->body;

        if (empty($data['media_item_id']) || !isset($data['position_ticks'])) {
            return (new Response())->status(400)->json([
                'error' => 'Missing required fields: media_item_id, position_ticks',
            ]);
        }

        $this->playbackController->reportProgress(
            $sessionId,
            $data['media_item_id'],
            (int)$data['position_ticks'],
            (int)($data['duration_ticks'] ?? 0),
            (bool)($data['is_paused'] ?? false)
        );

        return (new Response())->json(['message' => 'Progress updated']);
    }

    public function getProgress(Request $request, array $params): Response
    {
        $sessionId = $params['id'] ?? '';
        $state = $this->playbackController->getPlaybackState($sessionId);

        if (!$state) {
            return (new Response())->json(['progress' => null]);
        }

        return (new Response())->json(['progress' => $state]);
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
}