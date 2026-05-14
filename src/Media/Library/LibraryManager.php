<?php

namespace Phlex\Media\Library;

use Phlex\Common\Logger\LogChannels;
use Phlex\Common\Logger\StructuredLogger;
use Workerman\MySQL\Connection;

class LibraryManager
{
    private ?StructuredLogger $logger = null;
    private Connection $db;
    private MediaScanner $scanner;
    private FolderWatcher $watcher;

    public function __construct(
        Connection $db,
        MediaScanner $scanner,
        FolderWatcher $watcher,
        ?StructuredLogger $logger = null
    ) {
        $this->db = $db;
        $this->scanner = $scanner;
        $this->watcher = $watcher;
        $this->logger = $logger ?? $this->createDefaultLogger();
    }

    private function createDefaultLogger(): StructuredLogger
    {
        $tempDir = sys_get_temp_dir() . '/phlex_media_' . uniqid();
        mkdir($tempDir, 0755, true);

        $config = [
            'handlers' => [
                'stream' => [
                    'type' => 'stream',
                    'path' => $tempDir . '/manager.log',
                    'level' => 'debug',
                ],
            ],
            'processors' => [
                'context' => true,
                'request_id' => false,
                'user_id' => false,
            ],
        ];

        return new StructuredLogger(LogChannels::MEDIA, $config);
    }

    public function createLibrary(string $name, string $type, array $paths, array $options = []): string
    {
        $id = $this->generateUuid();

        $this->db->query(
            "INSERT INTO libraries (id, name, type, paths, options) VALUES (?, ?, ?, ?, ?)",
            [$id, $name, $type, json_encode($paths), json_encode($options)]
        );

        $this->logger->info('Library created', ['library_id' => $id, 'name' => $name, 'type' => $type]);

        // Initial scan
        $this->scanLibrary($id);

        // Start watching for changes
        $this->watcher->watch($id, $paths);

        return $id;
    }

    public function getLibrary(string $id): ?array
    {
        $result = $this->db->query("SELECT * FROM libraries WHERE id = ?", [$id]);
        if (empty($result)) {
            return null;
        }
        $library = $result[0];
        $library['paths'] = json_decode($library['paths'], true);
        $library['options'] = json_decode($library['options'] ?? '{}', true);
        return $library;
    }

    public function getAllLibraries(): array
    {
        $results = $this->db->query("SELECT * FROM libraries ORDER BY display_order, name");
        return array_map(function ($lib) {
            $lib['paths'] = json_decode($lib['paths'], true);
            $lib['options'] = json_decode($lib['options'] ?? '{}', true);
            return $lib;
        }, $results);
    }

    public function updateLibrary(string $id, array $data): void
    {
        $sets = [];
        $values = [];

        if (isset($data['name'])) {
            $sets[] = 'name = ?';
            $values[] = $data['name'];
        }
        if (isset($data['paths'])) {
            $sets[] = 'paths = ?';
            $values[] = json_encode($data['paths']);
        }
        if (isset($data['options'])) {
            $sets[] = 'options = ?';
            $values[] = json_encode($data['options']);
        }

        if (empty($sets)) {
            return;
        }

        $values[] = $id;
        $this->db->query(
            "UPDATE libraries SET " . implode(', ', $sets) . " WHERE id = ?",
            $values
        );

        $this->logger->info('Library updated', ['library_id' => $id]);
    }

    public function deleteLibrary(string $id): void
    {
        $this->db->query("DELETE FROM libraries WHERE id = ?", [$id]);
        $this->logger->info('Library deleted', ['library_id' => $id]);
    }

    public function scanLibrary(string $libraryId): void
    {
        $library = $this->getLibrary($libraryId);
        if (!$library) {
            throw new \InvalidArgumentException("Library not found: $libraryId");
        }

        $this->logger->info('Starting library scan', ['library_id' => $libraryId, 'name' => $library['name']]);

        foreach ($library['paths'] as $path) {
            if (!is_dir($path)) {
                $this->logger->warning('Library path does not exist', ['path' => $path]);
                continue;
            }
            $this->scanner->scan($libraryId, $path, $library['type']);
        }

        $this->logger->info('Library scan complete', ['library_id' => $libraryId]);
    }

    public function rescanLibrary(string $libraryId): void
    {
        // Remove existing items
        $this->db->query("DELETE FROM media_items WHERE library_id = ?", [$libraryId]);

        // Rescan
        $this->scanLibrary($libraryId);
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