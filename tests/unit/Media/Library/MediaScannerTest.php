<?php

namespace Phlex\Tests\Unit\Media\Library;

use PHPUnit\Framework\TestCase;
use Phlex\Media\Library\MediaScanner;
use Phlex\Media\Library\ItemRepository;
use Phlex\Common\Logger\LoggerFactory;
use Workerman\MySQL\Connection;

class MediaScannerTest extends TestCase
{
    protected function setUp(): void
    {
        LoggerFactory::init(__DIR__ . '/../../../../config/logger.php');
    }

    public function testCanCreateMediaScanner(): void
    {
        $scanner = new MediaScanner(
            $this->createMock(Connection::class),
            $this->createMock(ItemRepository::class)
        );

        $this->assertInstanceOf(MediaScanner::class, $scanner);
    }
}