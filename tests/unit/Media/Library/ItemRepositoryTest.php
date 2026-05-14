<?php

namespace Phlex\Tests\Unit\Media\Library;

use PHPUnit\Framework\TestCase;
use Phlex\Media\Library\ItemRepository;
use Workerman\MySQL\Connection;

class ItemRepositoryTest extends TestCase
{
    public function testCanCreateItemRepository(): void
    {
        $repository = new ItemRepository(
            $this->createMock(Connection::class)
        );

        $this->assertInstanceOf(ItemRepository::class, $repository);
    }
}