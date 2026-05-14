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

    public function findByPath(string $path): ?array
    {
        $results = $this->db->query(
            "SELECT * FROM media_items WHERE path = ? LIMIT 1",
            [$path]
        );
        return $results[0] ?? null;
    }

    public function findById(string $id): ?array
    {
        $results = $this->db->query(
            "SELECT * FROM media_items WHERE id = ? LIMIT 1",
            [$id]
        );
        return $results[0] ?? null;
    }

    public function findByLibrary(string $libraryId): array
    {
        return $this->db->query(
            "SELECT * FROM media_items WHERE library_id = ? ORDER BY name",
            [$libraryId]
        );
    }

    public function create(array $data): string
    {
        $id = $this->generateUuid();

        $this->db->query(
            "INSERT INTO media_items (id, library_id, name, type, path, metadata_json) VALUES (?, ?, ?, ?, ?, ?)",
            [
                $id,
                $data['library_id'],
                $data['name'],
                $data['type'],
                $data['path'],
                json_encode($data['metadata_json'] ?? [])
            ]
        );

        return $id;
    }

    public function update(string $id, array $data): void
    {
        $sets = [];
        $values = [];

        if (isset($data['name'])) {
            $sets[] = 'name = ?';
            $values[] = $data['name'];
        }
        if (isset($data['metadata_json'])) {
            $sets[] = 'metadata_json = ?';
            $values[] = json_encode($data['metadata_json']);
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