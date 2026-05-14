<?php

namespace Phlex\Media\Library;

use Phlex\Common\Logger\LogChannels;
use Phlex\Common\Logger\StructuredLogger;

class FolderWatcher
{
    private ?StructuredLogger $logger = null;
    private array $watchedPaths = [];
    private array $fileChecksums = [];
    private int $checkInterval = 30;
    private bool $running = false;

    public function __construct(?StructuredLogger $logger = null)
    {
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
                    'path' => $tempDir . '/watcher.log',
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

    public function watch(string $libraryId, array $paths): void
    {
        foreach ($paths as $path) {
            if (!is_dir($path)) {
                $this->logger->warning('Cannot watch non-existent path', ['path' => $path]);
                continue;
            }

            $this->watchedPaths[$path] = [
                'library_id' => $libraryId,
                'paths' => $paths,
            ];

            // Initial checksum scan
            $this->fileChecksums[$path] = $this->calculateDirectoryChecksum($path);

            $this->logger->info('Started watching path', ['path' => $path, 'library_id' => $libraryId]);
        }
    }

    public function unwatch(string $libraryId): void
    {
        foreach ($this->watchedPaths as $path => $info) {
            if ($info['library_id'] === $libraryId) {
                unset($this->watchedPaths[$path], $this->fileChecksums[$path]);
                $this->logger->info('Stopped watching path', ['path' => $path]);
            }
        }
    }

    public function checkForChanges(): array
    {
        $changes = [];

        foreach ($this->watchedPaths as $path => $info) {
            $newChecksum = $this->calculateDirectoryChecksum($path);

            if ($newChecksum !== $this->fileChecksums[$path]) {
                $changes[] = [
                    'library_id' => $info['library_id'],
                    'path' => $path,
                    'change_detected' => true,
                ];

                $this->fileChecksums[$path] = $newChecksum;
            }
        }

        return $changes;
    }

    private function calculateDirectoryChecksum(string $path): string
    {
        $checksum = '';
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        $files = [];
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $files[] = $file->getPathname() . ':' . $file->getMTime();
            }
        }

        sort($files);
        foreach ($files as $file) {
            $checksum .= $file;
        }

        return md5($checksum);
    }

    public function getWatchedPaths(): array
    {
        return $this->watchedPaths;
    }

    public function setCheckInterval(int $seconds): void
    {
        $this->checkInterval = $seconds;
    }
}