<?php

declare(strict_types=1);

namespace Phlix\Tests\Integration\Media;

use Phlix\Media\Library\ScanJobRepository;
use PHPUnit\Framework\TestCase;
use Throwable;
use Workerman\MySQL\Connection;

/**
 * Real-DB round-trip for the library scan-job store (Step 1.1a).
 *
 * Drives a live {@see Connection} through the full job lifecycle —
 * enqueue → claimNext → updateProgress → markCompleted — asserting the row
 * transitions at each step. Mirrors the suite convention of
 * {@see \Phlix\Tests\Integration\Admin\ServerSettingsRoundTripTest} and the
 * MySQL-reachability self-skip used by the container BootstrapTest: it runs in
 * CI where a MySQL service exists and self-skips locally when no DB is
 * reachable (the Workerman Connection connects in its constructor, so there is
 * no test value in attempting it without a server).
 *
 * @covers \Phlix\Media\Library\ScanJobRepository
 */
final class ScanJobRoundTripTest extends TestCase
{
    private ?Connection $db = null;

    /** @var string UUID of the parent library row created for the FK. */
    private string $libraryId = '';

    protected function setUp(): void
    {
        parent::setUp();

        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = (int) (getenv('DB_PORT') ?: 3306);

        if (!$this->isMysqlReachable($host, $port)) {
            $this->markTestSkipped(
                sprintf('No MySQL on %s:%d — skipping scan-job round-trip. Run in docker-compose / CI.', $host, $port),
            );
        }

        try {
            $this->db = new Connection(
                $host,
                $port,
                getenv('DB_USER') ?: 'root',
                getenv('DB_PASSWORD') ?: 'root',
                getenv('DB_DATABASE') ?: 'phlix_test',
                'utf8mb4',
            );
        } catch (Throwable $e) {
            $this->markTestSkipped('Could not connect to MySQL: ' . $e->getMessage());
        }

        $this->ensureSchema($this->db);

        // A scan job FK-references libraries(id); create a disposable parent.
        $this->libraryId = $this->uuid();
        $this->db->query(
            'INSERT INTO libraries (id, name, type, paths) VALUES (?, ?, ?, ?)',
            [$this->libraryId, 'ScanJob RoundTrip Lib', 'movie', json_encode(['/tmp/phlix-scanjob-test'])],
        );
    }

    protected function tearDown(): void
    {
        if ($this->db !== null && $this->libraryId !== '') {
            // ON DELETE CASCADE removes the job rows with the parent library.
            $this->db->query('DELETE FROM libraries WHERE id = ?', [$this->libraryId]);
        }
        parent::tearDown();
    }

    public function testEnqueueClaimUpdateCompleteRoundTrip(): void
    {
        $this->assertNotNull($this->db);
        $repo = new ScanJobRepository($this->db);

        // Enqueue -> a queued row.
        $jobId = $repo->enqueue($this->libraryId, 'scan');
        $this->assertNotSame('', $jobId);

        $queued = $repo->findById($jobId);
        $this->assertIsArray($queued);
        $this->assertSame('queued', $queued['status']);
        $this->assertSame('scan', $queued['type']);
        $this->assertNull($queued['started_at']);

        // It is the latest job for the library.
        $latest = $repo->getLatestForLibrary($this->libraryId);
        $this->assertIsArray($latest);
        $this->assertSame($jobId, $latest['id']);

        // claimNext -> moves it to running and stamps started_at.
        $claimed = $repo->claimNext();
        $this->assertIsArray($claimed);
        $this->assertSame($jobId, $claimed['id']);
        $this->assertSame('running', $claimed['status']);
        $this->assertNotNull($claimed['started_at']);

        // A second claim finds nothing queued (the only job is running now).
        $this->assertNull($repo->claimNext());

        // updateProgress -> counters + current_path written.
        $repo->updateProgress($jobId, [
            'items_found'   => 5,
            'items_added'   => 3,
            'items_updated' => 1,
        ], '/tmp/phlix-scanjob-test/movie.mkv');

        $progressed = $repo->findById($jobId);
        $this->assertIsArray($progressed);
        $this->assertSame(5, $progressed['items_found']);
        $this->assertSame(3, $progressed['items_added']);
        $this->assertSame(1, $progressed['items_updated']);
        $this->assertSame('/tmp/phlix-scanjob-test/movie.mkv', $progressed['current_path']);
        $this->assertSame('running', $progressed['status']);

        // markCompleted -> completed + completed_at + final counters.
        $repo->markCompleted($jobId, ['items_found' => 6]);

        $completed = $repo->findById($jobId);
        $this->assertIsArray($completed);
        $this->assertSame('completed', $completed['status']);
        $this->assertSame(6, $completed['items_found']);
        $this->assertNotNull($completed['completed_at']);

        // History returns the job for the library.
        $history = $repo->getHistoryForLibrary($this->libraryId, 10);
        $this->assertNotEmpty($history);
        $this->assertSame($jobId, $history[0]['id']);
    }

    /**
     * Apply migration 027 (idempotent) so the table exists when the test DB
     * was not migrated by the runner.
     */
    private function ensureSchema(Connection $db): void
    {
        $sql = (string) file_get_contents(dirname(__DIR__, 3) . '/migrations/027_library_scan_jobs.sql');
        // Strip leading `--` comment lines, then run the single CREATE statement.
        $statement = '';
        foreach (explode("\n", $sql) as $line) {
            if (str_starts_with(trim($line), '--')) {
                continue;
            }
            $statement .= $line . "\n";
        }
        $statement = trim($statement);
        if ($statement !== '') {
            $db->query($statement);
        }
    }

    private function isMysqlReachable(string $host, int $port): bool
    {
        $sock = @fsockopen($host, $port, $errno, $errstr, 1.0);
        if ($sock === false) {
            return false;
        }
        fclose($sock);
        return true;
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
