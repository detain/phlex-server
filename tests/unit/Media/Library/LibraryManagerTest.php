<?php

namespace Phlex\Tests\Unit\Media\Library;

use PHPUnit\Framework\TestCase;
use Phlex\Media\Library\LibraryManager;
use Phlex\Media\Library\MediaScanner;
use Phlex\Media\Library\FolderWatcher;
use Phlex\Media\Library\ItemRepository;
use Phlex\Common\Logger\LoggerFactory;
use Workerman\MySQL\Connection;

class LibraryManagerTest extends TestCase
{
    protected function setUp(): void
    {
        LoggerFactory::init(__DIR__ . '/../../../../config/logger.php');
    }

    public function testCanCreateLibraryManager(): void
    {
        $db = $this->createMock(Connection::class);
        $scanner = $this->createMock(MediaScanner::class);
        $watcher = $this->createMock(FolderWatcher::class);

        $manager = new LibraryManager($db, $scanner, $watcher);

        $this->assertInstanceOf(LibraryManager::class, $manager);
    }
}