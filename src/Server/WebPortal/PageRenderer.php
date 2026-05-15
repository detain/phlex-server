<?php

namespace Phlex\Server\WebPortal;

use Phlex\Server\Http\Request;
use Phlex\Server\Http\Response;
use Phlex\Media\Library\LibraryManager;
use Phlex\Media\Library\ItemRepository;
use Phlex\Session\PlaybackController;

class PageRenderer
{
    private string $templateDir;
    private LibraryManager $libraryManager;
    private ItemRepository $itemRepository;
    private PlaybackController $playbackController;

    public function __construct(
        string $templateDir,
        LibraryManager $libraryManager,
        ItemRepository $itemRepository,
        PlaybackController $playbackController
    ) {
        $this->templateDir = $templateDir;
        $this->libraryManager = $libraryManager;
        $this->itemRepository = $itemRepository;
        $this->playbackController = $playbackController;
    }

    public function renderHome(Request $request): Response
    {
        $userId = $request->userId ?? null;

        $template = new \Smarty();
        $template->setTemplateDir($this->templateDir);

        // Load data
        $libraries = $this->libraryManager->getAllLibraries();
        $librariesWithItems = [];

        foreach (array_slice($libraries, 0, 3) as $library) {
            $items = $this->itemRepository->getByLibrary($library['id'], 10, 0);
            $library['items'] = $items;
            $librariesWithItems[] = $library;
        }

        $recentlyAdded = $this->itemRepository->getRecentlyAdded($libraries[0]['id'] ?? '', 20);

        $continueWatching = [];
        if ($userId) {
            $continueWatching = $this->playbackController->getContinueWatching($userId, 10);
        }

        // Assign variables
        $template->assign('current_page', 'home');
        $template->assign('user', ['display_name' => 'User']);
        $template->assign('libraries', $librariesWithItems);
        $template->assign('recently_added', $recentlyAdded);
        $template->assign('continue_watching', $continueWatching);

        $html = $template->fetch('home/index.tpl');

        return (new Response())->html($html);
    }

    public function renderLibrary(Request $request, array $params): Response
    {
        $libraryId = $params['id'] ?? '';
        $library = $this->libraryManager->getLibrary($libraryId);

        if (!$library) {
            return (new Response())->status(404)->html('<h1>Library not found</h1>');
        }

        $items = $this->itemRepository->getByLibrary($libraryId, 100, 0);

        $template = new \Smarty();
        $template->setTemplateDir($this->templateDir);
        $template->assign('current_page', 'library');
        $template->assign('library', $library);
        $template->assign('items', $items);

        $html = $template->fetch('library/index.tpl');

        return (new Response())->html($html);
    }

    public function renderLogin(Request $request): Response
    {
        $template = new \Smarty();
        $template->setTemplateDir($this->templateDir);

        $html = $template->fetch('auth/login.tpl');

        return (new Response())->html($html);
    }
}