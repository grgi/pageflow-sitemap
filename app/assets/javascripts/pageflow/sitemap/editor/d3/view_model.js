sitemap.ViewModel = function(entry, selection, options) {
  options = options || {};

  var chapters = this.chapters = [];
  var nodes = this.nodes = [];
  var followLinks = this.followLinks = [];
  var successorLinks = this.successorLinks = [];
  var pageLinks = this.links = [];
  var size = this.size = {x: 0, y: 0};

  this.placeholders = [];

  var nodesByName = {};

  var laneWidth = 2 * sitemap.settings.page.horizontalMargin + sitemap.settings.page.width,
      rowHeight = 2 * sitemap.settings.page.verticalMargin + sitemap.settings.page.height;

  buildChaptersAndPages();
  buildSuccessorLinks();
  buildPageLinks();
  setSize();

  function buildChaptersAndPages() {
    entry.chapters.each(function(chapter) {
      var chapterLane = chapter.configuration.get('lane') || 0;
      var chapterRow = chapter.configuration.get('row') || 0;

      var x = chapterLane * laneWidth;

      var chapterNodes = [];

      var groupSelected = selection.contains(chapter);

      var groupDx = groupSelected ? options.groupDx || 0 : 0;
      var groupDy = groupSelected ? options.groupDy || 0 : 0;

      var rowIndex = chapterRow;

      chapter.pages.each(function(page, index) {
        var id = "page:" + page.cid;

        var knobs = [];

        if (page.pageLinks() && !options.hideKnobs) {
          knobs.push({
            pid: id,
            id: 'default',
            text: 'default',
            exceeded: !page.pageLinks().canAddLink()
          });
        }

        var node = {
          id: id,
          page: page,
          chapter: chapter,
          selected: selection.contains(page),
          x0: typeof page.x0 == "undefined" ? x : page.x0,
          y0: typeof page.y0 == "undefined" ? (rowIndex - 1) * rowHeight : page.y0,
          x: x + groupDx,
          y: (rowIndex++) * rowHeight + groupDy,
          availKnobs: knobs,
          visibleKnobs: []
        };

        chapterNodes.push(node);
        nodes.push(node);

        nodesByName[page.cid] = node;
      });

      buildFollowLinks(chapter.pages);
      buildSuccesor(chapter);

      chapters.push({
        id: 'group:' + chapter.cid,
        chapter: chapter,
        nodes: chapterNodes,
        selected: groupSelected,
        dragged: groupSelected && ('groupDx' in options),
        x: x + groupDx,
        y: chapterRow * rowHeight + groupDy,
        height: chapter.pages.length * rowHeight - 2 * sitemap.settings.page.verticalMargin
      });
    });
  }

  function buildSuccesor(chapter) {
    var lastPage = chapter.pages.last();

    if (lastPage) {
      var successorPage = entry.pages.getByPermaId(lastPage.configuration.get('scroll_successor_id'));

      if (!successorPage) {
        nodesByName[lastPage.cid].successor = {
          id: 'group:successor:' + chapter.cid,
          pid: lastPage.cid,
          chapter: chapter
        };
      }
    }
  }

  function buildFollowLinks(pages) {
    eachPair(pages, function(first, second) {
      followLinks.push(buildLink('follow', first, second));
    });
  }

  function buildPageLinks() {
    entry.pages.each(function(page) {
      if (page.pageLinks()) {
        page.pageLinks().each(function(link) {
          if (link.targetPage()) {
            pageLinks.push(buildLink('link', page, link.targetPage()));
          }
        });
      }
    });
  }

  function buildSuccessorLinks() {
    entry.chapters.each(function(chapter) {
      var lastPage = chapter.pages.last();

      if (lastPage) {
        var successorPage = entry.pages.getByPermaId(lastPage.configuration.get('scroll_successor_id'));

        if (successorPage) {
          successorLinks.push(buildLink('successor', lastPage, successorPage));
        }
      }
    });
  }

  function buildLink(idPrefix, sourcePage, targetPage) {
    return {
      id: idPrefix + ':' + sourcePage.cid + '-' + targetPage.cid,
      source: nodesByName[sourcePage.cid],
      target: nodesByName[targetPage.cid]
    };
  }

  function setSize() {
    _.forEach(nodes, function(node) {
      size.x = Math.max(node.x + laneWidth, size.x);
      size.y = Math.max(node.y + rowHeight, size.y);
    });

  }

  function eachPair(collection, fn) {
    collection.reduce(function(last, item) {
      fn(last, item);
      return item;
    });
  }
};