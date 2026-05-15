<?php

namespace Phlex\Media\Library;

use Workerman\MySQL\Connection;

class ItemRepository
{
    private Connection $db;

    public function __construct(Connection $db)
    {
        $this->db = $db;
    }

    public function findById(string $id): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM media_items WHERE id = ?",
            [$id]
        );

        if (empty($result)) {
            return null;
        }

        return $this->hydrateItem($result[0]);
    }

    public function findByPath(string $path): ?array
    {
        $result = $this->db->query(
            "SELECT * FROM media_items WHERE path = ?",
            [$path]
        );

        if (empty($result)) {
            return null;
        }

        return $this->hydrateItem($result[0]);
    }

    public function findByParent(string $parentId): array
    {
        $results = $this->db->query(
            "SELECT * FROM media_items WHERE parent_id = ? ORDER BY name",
            [$parentId]
        );

        return array_map(fn($r) => $this->hydrateItem($r), $results);
    }

    public function getByType(string $libraryId, string $type, int $limit = 100, int $offset = 0): array
    {
        $results = $this->db->query(
            "SELECT * FROM media_items WHERE library_id = ? AND type = ? ORDER BY name LIMIT ? OFFSET ?",
            [$libraryId, $type, $limit, $offset]
        );

        return array_map(fn($r) => $this->hydrateItem($r), $results);
    }

    public function getByLibrary(string $libraryId, int $limit = 100, int $offset = 0): array
    {
        $results = $this->db->query(
            "SELECT * FROM media_items WHERE library_id = ? ORDER BY name LIMIT ? OFFSET ?",
            [$libraryId, $limit, $offset]
        );

        return array_map(fn($r) => $this->hydrateItem($r), $results);
    }

    public function search(string $query, int $limit = 50): array
    {
        $results = $this->db->query(
            "SELECT * FROM media_items WHERE MATCH(name) AGAINST(? IN BOOLEAN MODE) LIMIT ?",
            [$query, $limit]
        );

        return array_map(fn($r) => $this->hydrateItem($r), $results);
    }

    public function searchFuzzy(string $query, int $limit = 50): array
    {
        $escapedQuery = '%' . addcslashes($query, '%_') . '%';
        $results = $this->db->query(
            "SELECT * FROM media_items WHERE name LIKE ? LIMIT ?",
            [$escapedQuery, $limit]
        );

        return array_map(fn($r) => $this->hydrateItem($r), $results);
    }

    public function create(array $data): string
    {
        $id = $data['id'] ?? $this->generateUuid();
        $metadataJson = isset($data['metadata_json'])
            ? (is_array($data['metadata_json']) ? json_encode($data['metadata_json']) : $data['metadata_json'])
            : '{}';

        $this->db->query(
            "INSERT INTO media_items (id, library_id, parent_id, name, type, path, metadata_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                $id,
                $data['library_id'],
                $data['parent_id'] ?? null,
                $data['name'],
                $data['type'],
                $data['path'],
                $metadataJson,
            ]
        );

        return $id;
    }

    public function update(string $id, array $data): void
    {
        $sets = [];
        $values = [];

        foreach ($data as $key => $value) {
            $sets[] = "$key = ?";
            if ($key === 'metadata_json' && is_array($value)) {
                $value = json_encode($value);
            }
            $values[] = $value;
        }

        if (empty($sets)) {
            return;
        }

        $values[] = $id;

        $this->db->query(
            "UPDATE media_items SET " . implode(', ', $sets) . " WHERE id = ?",
            $values
        );
    }

    public function delete(string $id): void
    {
        $this->db->query("DELETE FROM media_items WHERE id = ?", [$id]);
    }

    public function deleteByLibrary(string $libraryId): void
    {
        $this->db->query("DELETE FROM media_items WHERE library_id = ?", [$libraryId]);
    }

    public function countByType(string $libraryId, string $type): int
    {
        $result = $this->db->query(
            "SELECT COUNT(*) as count FROM media_items WHERE library_id = ? AND type = ?",
            [$libraryId, $type]
        );

        return (int)($result[0]['count'] ?? 0);
    }

    public function getRecentlyAdded(string $libraryId, int $limit = 20): array
    {
        $results = $this->db->query(
            "SELECT * FROM media_items WHERE library_id = ? ORDER BY created_at DESC LIMIT ?",
            [$libraryId, $limit]
        );

        return array_map(fn($r) => $this->hydrateItem($r), $results);
    }

    public function getItemStreams(string $itemId): array
    {
        return $this->db->query(
            "SELECT * FROM media_streams WHERE media_item_id = ? ORDER BY stream_index",
            [$itemId]
        );
    }

    public function addStream(string $itemId, array $streamData): string
    {
        $id = $streamData['id'] ?? $this->generateUuid();

        $this->db->query(
            "INSERT INTO media_streams (id, media_item_id, stream_index, stream_type, codec, language, bitrate, width, height)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $id,
                $itemId,
                $streamData['stream_index'],
                $streamData['stream_type'],
                $streamData['codec'] ?? null,
                $streamData['language'] ?? null,
                $streamData['bitrate'] ?? null,
                $streamData['width'] ?? null,
                $streamData['height'] ?? null,
            ]
        );

        return $id;
    }

    public function batchCreate(array $items): array
    {
        $ids = [];

        foreach ($items as $item) {
            $ids[] = $this->create($item);
        }

        return $ids;
    }

    private function hydrateItem(array $row): array
    {
        $row['metadata_json'] = $row['metadata_json'] ?? '{}';
        if (is_string($row['metadata_json'])) {
            $row['metadata'] = json_decode($row['metadata_json'], true) ?? [];
        } else {
            $row['metadata'] = $row['metadata_json'];
        }
        return $row;
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