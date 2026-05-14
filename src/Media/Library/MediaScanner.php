<?php

namespace Phlex\Media\Library;

use Phlex\Common\Logger\LogChannels;
use Phlex\Common\Logger\StructuredLogger;
use Workerman\MySQL\Connection;

class MediaScanner
{
    private ?StructuredLogger $logger = null;
    private Connection $db;
    private array $namingOptions;
    private ItemRepository $itemRepository;

    public function __construct(Connection $db, ItemRepository $itemRepository, ?StructuredLogger $logger = null)
    {
        $this->db = $db;
        $this->itemRepository = $itemRepository;
        $this->logger = $logger ?? $this->createDefaultLogger();
        $this->namingOptions = $this->loadNamingOptions();
    }

    private function createDefaultLogger(): StructuredLogger
    {
        $tempDir = sys_get_temp_dir() . '/phlex_media_' . uniqid();
        mkdir($tempDir, 0755, true);

        $config = [
            'handlers' => [
                'stream' => [
                    'type' => 'stream',
                    'path' => $tempDir . '/scanner.log',
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

    private function loadNamingOptions(): array
    {
        return [
            'video' => ['mkv', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', 'ts'],
            'audio' => ['mp3', 'flac', 'aac', 'ogg', 'wav', 'm4a', 'wma', 'alac', 'opus'],
            'image' => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'],
        ];
    }

    public function scan(string $libraryId, string $path, string $type): void
    {
        if (!is_dir($path)) {
            $this->logger->warning('Scan path does not exist', ['path' => $path]);
            return;
        }

        $extensions = $this->namingOptions[$type] ?? $this->namingOptions['video'];

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        $scanned = 0;
        $skipped = 0;

        foreach ($iterator as $file) {
            if ($file->isDir()) {
                continue;
            }

            $extension = strtolower($file->getExtension());
            if (!in_array($extension, $extensions)) {
                $skipped++;
                continue;
            }

            // Skip hidden files and system files
            if ($this->shouldSkipFile($file->getFilename())) {
                $skipped++;
                continue;
            }

            $this->processFile($libraryId, $file, $type);
            $scanned++;
        }

        $this->logger->info('Scan complete', [
            'library_id' => $libraryId,
            'path' => $path,
            'scanned' => $scanned,
            'skipped' => $skipped,
        ]);
    }

    private function shouldSkipFile(string $filename): bool
    {
        // Skip hidden files
        if (str_starts_with($filename, '.')) {
            return true;
        }

        // Skip system files
        $skipPatterns = ['.part', '.tmp', '_unpack', '.download', '.!ut'];
        foreach ($skipPatterns as $pattern) {
            if (str_contains($filename, $pattern)) {
                return true;
            }
        }

        return false;
    }

    private function processFile(string $libraryId, \SplFileInfo $file, string $type): void
    {
        $path = $file->getPathname();

        // Check if already exists
        $existing = $this->itemRepository->findByPath($path);
        if ($existing) {
            return; // Already scanned
        }

        // Determine media type
        $mediaType = $this->determineMediaType($file, $type);

        // Parse naming for series/movies
        $metadata = $this->parseNaming($file->getFilename(), $mediaType);

        // Create media item
        $itemId = $this->itemRepository->create([
            'library_id' => $libraryId,
            'name' => $metadata['name'] ?? $file->getBasename('.' . $file->getExtension()),
            'type' => $mediaType,
            'path' => $path,
            'metadata_json' => $metadata,
        ]);

        $this->logger->debug('Media file scanned', [
            'item_id' => $itemId,
            'name' => $metadata['name'] ?? 'unknown',
            'type' => $mediaType,
        ]);
    }

    private function determineMediaType(\SplFileInfo $file, string $libraryType): string
    {
        if ($libraryType !== 'video') {
            return $libraryType;
        }

        // Could add series episode detection here
        return 'movie';
    }

    private function parseNaming(string $filename, string $type): array
    {
        $metadata = [];

        // Remove extension
        $name = pathinfo($filename, PATHINFO_FILENAME);

        // Movie pattern: Movie Name (Year) or Movie Name.Year
        if ($type === 'movie') {
            if (preg_match('/(.+?)\s*[\(\[(\s*(\d{4})\s*\)\]\)]/', $name, $matches)) {
                $metadata['name'] = trim($matches[1]);
                $metadata['year'] = $matches[3] ?? null;
            } else {
                $metadata['name'] = $name;
            }
        }

        // Series pattern: Series S01E01 or Series - S01E01 - Episode Title
        if (preg_match('/^(.+?)\s*S(\d{2})E(\d{2})/i', $name, $matches)) {
            $metadata['name'] = trim($matches[1]);
            $metadata['season'] = (int)$matches[2];
            $metadata['episode'] = (int)$matches[3];

            // Extract episode title if present
            if (preg_match('/E\d{2}\s*-\s*(.+)$/', $name, $titleMatch)) {
                $metadata['episode_title'] = trim($titleMatch[1]);
            }
        }

        return $metadata;
    }
}