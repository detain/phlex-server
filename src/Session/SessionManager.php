<?php

namespace Phlex\Session;

use Phlex\Common\Logger\LogChannels;
use Phlex\Common\Logger\LoggerFactory;
use Phlex\Common\Logger\StructuredLogger;
use Workerman\MySQL\Connection;

class SessionManager
{
    private Connection $db;
    private array $activeSessions = [];
    private StructuredLogger $logger;

    public function __construct(Connection $db, ?StructuredLogger $logger = null)
    {
        $this->db = $db;
        $this->logger = $logger ?? $this->createDefaultLogger();
    }

    private function createDefaultLogger(): StructuredLogger
    {
        $tempDir = sys_get_temp_dir() . '/phlex_session_' . uniqid();
        mkdir($tempDir, 0755, true);

        $config = [
            'handlers' => [
                'stream' => [
                    'type' => 'stream',
                    'path' => $tempDir . '/session.log',
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

    public function createSession(string $userId, string $deviceId, string $deviceName, string $deviceType): string
    {
        // Check if session already exists for this device
        $existing = $this->findByDeviceId($deviceId);
        if ($existing) {
            $this->updateActivity($existing['id']);
            return $existing['id'];
        }

        $sessionId = $this->generateUuid();

        $this->db->query(
            "INSERT INTO sessions (id, user_id, device_id, device_name, device_type) VALUES (?, ?, ?, ?, ?)",
            [$sessionId, $userId, $deviceId, $deviceName, $deviceType]
        );

        $this->activeSessions[$sessionId] = [
            'id' => $sessionId,
            'user_id' => $userId,
            'device_id' => $deviceId,
            'last_activity' => time(),
        ];

        $this->logger->info('Session created', [
            'session_id' => $sessionId,
            'user_id' => $userId,
            'device_id' => $deviceId,
        ]);

        return $sessionId;
    }

    public function getSession(string $sessionId): ?array
    {
        if (isset($this->activeSessions[$sessionId])) {
            return $this->activeSessions[$sessionId];
        }

        $result = $this->db->query(
            "SELECT * FROM sessions WHERE id = ?",
            [$sessionId]
        );

        if (empty($result)) {
            return null;
        }

        return $result[0];
    }

    public function findByDeviceId(string $deviceId): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM sessions WHERE device_id = ? ORDER BY last_activity DESC LIMIT 1",
            [$deviceId]
        );

        return $result[0] ?? null;
    }

    public function getUserSessions(string $userId): array
    {
        return $this->db->query(
            "SELECT * FROM sessions WHERE user_id = ? ORDER BY last_activity DESC",
            [$userId]
        );
    }

    public function updateActivity(string $sessionId): void
    {
        $this->db->query(
            "UPDATE sessions SET last_activity = NOW() WHERE id = ?",
            [$sessionId]
        );

        if (isset($this->activeSessions[$sessionId])) {
            $this->activeSessions[$sessionId]['last_activity'] = time();
        }
    }

    public function endSession(string $sessionId): void
    {
        $session = $this->getSession($sessionId);
        if ($session) {
            $this->db->query("DELETE FROM sessions WHERE id = ?", [$sessionId]);
            unset($this->activeSessions[$sessionId]);

            $this->logger->info('Session ended', ['session_id' => $sessionId]);
        }
    }

    public function endAllUserSessions(string $userId, ?string $exceptSessionId = null): void
    {
        $sql = "DELETE FROM sessions WHERE user_id = ?";
        $params = [$userId];

        if ($exceptSessionId) {
            $sql .= " AND id != ?";
            $params[] = $exceptSessionId;
        }

        $this->db->query($sql, $params);

        $this->logger->info('All user sessions ended', [
            'user_id' => $userId,
            'except_session' => $exceptSessionId,
        ]);
    }

    public function cleanupStaleSessions(int $maxIdleSeconds = 86400): int
    {
        $cutoff = date('Y-m-d H:i:s', time() - $maxIdleSeconds);

        $result = $this->db->query(
            "SELECT id FROM sessions WHERE last_activity < ?",
            [$cutoff]
        );

        $count = count($result);

        if ($count > 0) {
            $this->db->query(
                "DELETE FROM sessions WHERE last_activity < ?",
                [$cutoff]
            );

            $this->logger->info('Cleaned up stale sessions', ['count' => $count]);
        }

        return $count;
    }

    public function getActiveSessionCount(): int
    {
        return count($this->activeSessions);
    }

    public function getOnlineUsers(): array
    {
        $cutoff = date('Y-m-d H:i:s', time() - 300); // 5 minutes
        $result = $this->db->query(
            "SELECT DISTINCT user_id FROM sessions WHERE last_activity > ?",
            [$cutoff]
        );

        return array_column($result, 'user_id');
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