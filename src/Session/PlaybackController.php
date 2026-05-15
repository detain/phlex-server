<?php

namespace Phlex\Session;

use Phlex\Common\Logger\LogChannels;
use Phlex\Common\Logger\LoggerFactory;
use Phlex\Common\Logger\StructuredLogger;
use Workerman\MySQL\Connection;

class PlaybackController
{
    private Connection $db;
    private SessionManager $sessionManager;
    private StructuredLogger $logger;

    public function __construct(Connection $db, SessionManager $sessionManager, ?StructuredLogger $logger = null)
    {
        $this->db = $db;
        $this->sessionManager = $sessionManager;
        $this->logger = $logger ?? $this->createDefaultLogger();
    }

    private function createDefaultLogger(): StructuredLogger
    {
        $tempDir = sys_get_temp_dir() . '/phlex_playback_' . uniqid();
        mkdir($tempDir, 0755, true);

        $config = [
            'handlers' => [
                'stream' => [
                    'type' => 'stream',
                    'path' => $tempDir . '/playback.log',
                    'level' => 'debug',
                ],
            ],
            'processors' => [
                'context' => true,
                'request_id' => false,
                'user_id' => false,
            ],
        ];

        return new StructuredLogger(LogChannels::SESSION, $config);
    }

    public function reportProgress(string $sessionId, string $mediaItemId, int $positionTicks, int $durationTicks, bool $isPaused): void
    {
        // Update or create playback state
        $this->db->query(
            "INSERT INTO playback_state (id, session_id, media_item_id, position_ticks, duration_ticks, playback_status)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                position_ticks = VALUES(position_ticks),
                duration_ticks = VALUES(duration_ticks),
                playback_status = VALUES(playback_status),
                updated_at = NOW()",
            [
                $this->generateUuid(),
                $sessionId,
                $mediaItemId,
                $positionTicks,
                $durationTicks,
                $isPaused ? 'paused' : 'playing',
            ]
        );

        // Update session activity
        $this->sessionManager->updateActivity($sessionId);
    }

    public function getPlaybackState(string $sessionId): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM playback_state WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1",
            [$sessionId]
        );

        return $result[0] ?? null;
    }

    public function getUserProgress(string $userId, string $mediaItemId): ?array
    {
        $result = $this->db->query(
            "SELECT ps.* FROM playback_state ps
             INNER JOIN sessions s ON ps.session_id = s.id
             WHERE s.user_id = ? AND ps.media_item_id = ?
             ORDER BY ps.updated_at DESC LIMIT 1",
            [$userId, $mediaItemId]
        );

        return $result[0] ?? null;
    }

    public function markAsWatched(string $sessionId, string $mediaItemId): void
    {
        $this->db->query(
            "UPDATE playback_state SET playback_status = 'stopped', position_ticks = 0 WHERE session_id = ? AND media_item_id = ?",
            [$sessionId, $mediaItemId]
        );
    }

    public function clearProgress(string $sessionId, string $mediaItemId): void
    {
        $this->db->query(
            "DELETE FROM playback_state WHERE session_id = ? AND media_item_id = ?",
            [$sessionId, $mediaItemId]
        );
    }

    public function getContinueWatching(string $userId, int $limit = 10): array
    {
        $result = $this->db->query(
            "SELECT ps.*, mi.name, mi.type, mi.metadata_json
             FROM playback_state ps
             INNER JOIN sessions s ON ps.session_id = s.id
             INNER JOIN media_items mi ON ps.media_item_id = mi.id
             WHERE s.user_id = ?
               AND ps.playback_status IN ('playing', 'paused')
               AND ps.position_ticks > 0
               AND ps.position_ticks < (ps.duration_ticks * 0.95)
             ORDER BY ps.updated_at DESC
             LIMIT ?",
            [$userId, $limit]
        );

        return array_map(function ($row) {
            $row['metadata'] = json_decode($row['metadata_json'] ?? '{}', true);
            return $row;
        }, $result);
    }

    public function getRecentlyWatched(string $userId, int $limit = 20): array
    {
        $result = $this->db->query(
            "SELECT ps.*, mi.name, mi.type, mi.metadata_json
             FROM playback_state ps
             INNER JOIN sessions s ON ps.session_id = s.id
             INNER JOIN media_items mi ON ps.media_item_id = mi.id
             WHERE s.user_id = ?
             ORDER BY ps.updated_at DESC
             LIMIT ?",
            [$userId, $limit]
        );

        return array_map(function ($row) {
            $row['metadata'] = json_decode($row['metadata_json'] ?? '{}', true);
            return $row;
        }, $result);
    }

    private function generateUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}