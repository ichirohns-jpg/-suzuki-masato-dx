(function () {
  "use strict";

  var D = window.DX_DATA || {};
  var GAS_URL = D.gasUrl || "";
  var SITE_KEY = D.siteKey || "suzuki-masato-dx";
  var app = document.getElementById("app");
  var photos = (D.commonImages || []).filter(Boolean);

  function text(value) { return value == null ? "" : String(value); }

  function listValue(value) {
    if (Array.isArray(value)) return value;

    var raw = text(value).trim();

    if (!raw) return [];

    try {
      var parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) return parsed;
    } catch (error) {}

    return raw.split(/[\n,]/).map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }

  function normalizeYoutubeUrl(value) {
    return text(value).trim().replace(/\s+/g, "");
  }

  function normalizeImages(item) {
    if (!item) return [];

    var images = listValue(
      item.images ||
      item.imageUrls ||
      item.photos ||
      item.photoUrls
    );

    [1, 2, 3, 4, 5, 6].forEach(function (number) {
      var value =
        item["image" + number] ||
        item["image_" + number] ||
        item["photo" + number] ||
        item["photo_" + number];

      if (value) images.push(value);
    });

    return images.map(function (value) {
      return text(value).trim();
    }).filter(Boolean);
  }

  function articleVideo(item) {
    if (!item) return "";

    var value =
      item.videoUrl ||
      item.videoURL ||
      item.video_url ||
      item.youtubeUrl ||
      item.youtube_url ||
      item.youtubeURL ||
      item.youtube ||
      item.video ||
      item["\u52d5\u753bURL"] ||
      item["YouTube URL"] ||
      item["YouTube"] ||
      "";

    return normalizeYoutubeUrl(value);
  }

  function socialUrls() {
    var urls = [];

    function add(value) {
      if (Array.isArray(value)) {
        value.forEach(add);
        return;
      }

      if (value && typeof value === "object") {
        add(value.url || value.href || value.link || value.value || "");
        return;
      }

      listValue(value).forEach(function (item) {
        var url = text(item).trim();

        if (!url || /ameblo\.jp/i.test(url)) return;

        if (urls.indexOf(url) < 0) {
          urls.push(url);
        }
      });
    }

    [
      D.sns,
      D.socials,
      D.facebook,
      D.facebookUrl,
      D.facebookURL,
      D.x,
      D.xUrl,
      D.xURL,
      D.twitter,
      D.twitterUrl,
      D.twitterURL,
      D.instagram,
      D.instagramUrl,
      D.instagramURL,
      D.youtubeChannel,
      D.youtubeChannelUrl,
      D.youtube,
      D.youtubeUrl,
      D.youtubeURL,
      D.youtube_url
    ].forEach(add);

    return urls;
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function addText(parent, tag, className, value) {
    var node = el(tag, className);
    node.textContent = text(value);
    parent.appendChild(node);
    return node;
  }

  function validUrl(url) {
    return /^https?:\/\//i.test(text(url).trim());
  }

  function hostname(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
    } catch (error) {
      return "\u516c\u5f0f\u30ea\u30f3\u30af";
    }
  }

  function addImage(parent, src, alt, className) {
    if (!src) return null;

    var image = el("img", className || "");
    image.src = src;
    image.alt = alt || "\u9234\u6728\u6b63\u4eba\u306e\u6d3b\u52d5\u5199\u771f";
    image.loading = "lazy";
    image.decoding = "async";

    image.onerror = function () {
      var figure = image.closest("figure");

      if (figure) {
        figure.remove();
      } else {
        image.remove();
      }
    };

    parent.appendChild(image);
    return image;
  }

  function addLink(parent, label, url, className) {
    if (!url || (!validUrl(url) && text(url).charAt(0) !== "#")) {
      return null;
    }

    var link = el("a", className || "button");

    link.href = url;
    link.textContent = label;

    if (text(url).charAt(0) !== "#") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    parent.appendChild(link);
    return link;
  }

  function addBody(parent, value) {
    if (!value) return;

    var node = el("div", "body-text");
    var source = text(value);
    var pattern = /(https?:\/\/[^\s]+)/gi;
    var last = 0;
    var match;

    while ((match = pattern.exec(source))) {
      node.appendChild(
        document.createTextNode(source.slice(last, match.index))
      );

      if (isYoutubeUrl(match[0])) {
        addYoutube(node, match[0]);
      } else {
        var link = document.createElement("a");

        link.href = match[0];
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = match[0];

        node.appendChild(link);
      }

      last = match.index + match[0].length;
    }

    node.appendChild(document.createTextNode(source.slice(last)));
    parent.appendChild(node);
  }

  function isYoutubeUrl(url) {
    return /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i.test(
      normalizeYoutubeUrl(url)
    );
  }

  function youtubeId(url) {
    var match = normalizeYoutubeUrl(url).match(
      /(?:[?&]v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|shorts\/|live\/|embed\/|v\/))([A-Za-z0-9_-]{6,})/i
    );

    return match ? match[1] : "";
  }

  function addYoutube(parent, url) {
    var id = youtubeId(url);

    if (!id) return;

    var box = el("div", "video");
    var frame = document.createElement("iframe");

    frame.src =
      "https://www.youtube-nocookie.com/embed/" +
      id +
      "?playsinline=1&rel=0&modestbranding=1";

    frame.title = "\u6d3b\u52d5\u5831\u544a\u52d5\u753b";
    frame.loading = "lazy";
    frame.referrerPolicy = "strict-origin-when-cross-origin";

    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

    frame.allowFullscreen = true;

    box.appendChild(frame);
    parent.appendChild(box);
  }

  function addArticleLink(parent, label, url, className) {
    if (!url) return null;

    if (isYoutubeUrl(url) && youtubeId(url)) {
      return null;
    }

    return addLink(parent, label, url, className);
  }

  function pageShareUrl() {
    var value = D.publicUrl || window.location.href;

    try {
      var url = new URL(value, window.location.href);

      url.search = "";
      url.hash = "";

      return url.href;
    } catch (error) {
      return text(value).split(/[?#]/)[0];
    }
  }

  function articleShareKey(article) {
    if (!article) return "latest";

    var id = text(article.id || article.newsId || "").trim();

    if (id) return id;

    return [
      text(article.date).trim(),
      text(article.title).trim()
    ].filter(Boolean).join("|") || "latest";
  }

  function articleShareUrl(article) {
    return pageShareUrl() +
      "?article=" +
      encodeURIComponent(articleShareKey(article));
  }

  function requestedArticleKey() {
    try {
      return new URL(window.location.href).searchParams.get("article") || "";
    } catch (error) {
      var match = window.location.search.match(/[?&]article=([^&]+)/);

      return match ? decodeURIComponent(match[1]) : "";
    }
  }

  function findArticleByShareKey(list, key) {
    if (!key) return null;

    for (var index = 0; index < list.length; index += 1) {
      if (articleShareKey(list[index]) === key) {
        return list[index];
      }
    }

    return null;
  }

  function updateArticleMeta(article) {
    var title = text(article && article.title || D.title || "\u9234\u6728\u6b63\u4eba");
    var description = text(article && article.body || D.description)
      .replace(/\s+/g, " ")
      .slice(0, 160);
    var url = articleShareUrl(article);

    document.title = title + "\uff5c" + text(D.title || "\u9234\u6728\u6b63\u4eba");

    function meta(selector, value) {
      var node = document.querySelector(selector);

      if (node) node.setAttribute("content", value);
    }

    meta('meta[property="og:title"]', title);
    meta('meta[property="og:description"]', description);
    meta('meta[property="og:url"]', url);
    meta('meta[name="twitter:title"]', title);
    meta('meta[name="twitter:description"]', description);

    var image = normalizeImages(article)[0];

    if (image) {
      try {
        image = new URL(image, document.baseURI).href;
      } catch (error) {}

      meta('meta[property="og:image"]', image);
      meta('meta[name="twitter:image"]', image);
    }
  }

  function share(button) {
    button.onclick = function () {
      var article = D.activeArticle || D.article;
      var url = article ? articleShareUrl(article) : pageShareUrl();
      var shareTitle =
        text(article && article.title || D.title || "\u9234\u6728\u6b63\u4eba\u306e\u6d3b\u52d5\u5831\u544a");
      var shareText = text(article && article.body || D.description);
      var originalText = button.textContent;

      if (navigator.share) {
        navigator
          .share({
            title: shareTitle,
            text: shareText,
            url: url
          })
          .catch(function () {});

        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          button.textContent = "\u30ea\u30f3\u30af\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f";

          window.setTimeout(function () {
            button.textContent = originalText;
          }, 2200);
        });

        return;
      }

      window.prompt("URL\u3092\u30b3\u30d4\u30fc\u3057\u3066\u304f\u3060\u3055\u3044", url);
    };
  }

  function section(id, kicker, title, note) {
    var root = el("section", "section");

    root.id = id || "";

    var heading = el("div", "section-heading");
    var left = el("div");

    addText(left, "p", "section-kicker", kicker);
    addText(left, "h2", "section-title", title);

    heading.appendChild(left);

    if (note) {
      addText(heading, "p", "section-label", note);
    }

    root.appendChild(heading);
    app.appendChild(root);

    return root;
  }

  function rail(parent, list, label, extraClass) {
    var images = (list || []).filter(Boolean);

    if (!images.length) return;

    var row = el(
      "div",
      "photo-rail" + (extraClass ? " " + extraClass : "")
    );

    images.forEach(function (src, index) {
      var figure = el("figure", "photo-card");

      addImage(
        figure,
        src,
        label + "\u5199\u771f" + (index + 1)
      );

      addText(
        figure,
        "figcaption",
        "",
        label + " " + (index + 1)
      );

      row.appendChild(figure);
    });

    parent.appendChild(row);
  }

  function socialInfo(url) {
    var value = text(url).toLowerCase();

    if (value.indexOf("ameblo.jp") >= 0) {
      return null;
    }

    if (value.indexOf("facebook.com") >= 0) {
      return {
        name: "Facebook\uff08\u30d5\u30a7\u30a4\u30b9\u30d6\u30c3\u30af\uff09",
        icon: "f",
        css: "facebook"
      };
    }

    if (value.indexOf("instagram.com") >= 0) {
      return {
        name: "Instagram\uff08\u30a4\u30f3\u30b9\u30bf\u30b0\u30e9\u30e0\uff09",
        icon: "\u25ce",
        css: "instagram"
      };
    }

    if (
      value.indexOf("twitter.com") >= 0 ||
      value.indexOf("x.com") >= 0
    ) {
      return {
        name: "X\uff08\u65e7Twitter\uff09",
        icon: "X",
        css: "x"
      };
    }

    if (
      value.indexOf("youtube.com") >= 0 ||
      value.indexOf("youtu.be") >= 0
    ) {
      return {
        name: "YouTube",
        icon: "\u25b6",
        css: "youtube"
      };
    }

    return {
      name: "\u516c\u5f0f\u30ea\u30f3\u30af",
      icon: "\u2197",
      css: "other"
    };
  }

  function socialCard(parent, name, url, icon, css) {
    if (!validUrl(url)) return;

    var link = el("a", "social-card " + (css || "other"));

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    addText(link, "span", "social-icon", icon);

    var copy = el("span", "social-copy");

    addText(copy, "strong", "social-name", name);
    addText(copy, "small", "social-url", hostname(url));

    link.appendChild(copy);
    parent.appendChild(link);
  }

  function addSocialDestination(parent, name, url, icon, css) {
    if (!url || text(url).toLowerCase().indexOf("ameblo.jp") >= 0) {
      return;
    }

    if (isYoutubeUrl(url) && youtubeId(url)) {
      addYoutube(parent, url);
      return;
    }

    socialCard(parent, name, url, icon, css);
  }

  function articleSocialLinks(parent, article) {
    var box = el("div", "article-social-links");
    var grid = el("div", "article-social-grid");

    addText(
      box,
      "h4",
      "article-social-title",
      "\u3053\u306e\u8a18\u4e8b\u3092\u30b7\u30a7\u30a2"
    );

    var shareUrl = article ? articleShareUrl(article) : pageShareUrl();
    var shareTitle =
      text(article && article.title || D.title || "\u9234\u6728\u6b63\u4eba\u306e\u6d3b\u52d5\u5831\u544a");
    var shareText =
      text(article && article.body || D.description);

    function addShareLink(label, icon, css, url) {
      var link = el("a", "article-social-button " + css);

      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      addText(link, "span", "article-social-icon", icon);
      addText(link, "span", "article-social-name", label);

      grid.appendChild(link);
    }

    addShareLink(
      "Facebook\u3067\u30b7\u30a7\u30a2",
      "f",
      "facebook",
      "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(shareUrl)
    );

    addShareLink(
      "X\u3067\u30b7\u30a7\u30a2",
      "X",
      "x",
      "https://twitter.com/intent/tweet?text=" +
        encodeURIComponent(shareTitle) +
        "&url=" +
        encodeURIComponent(shareUrl)
    );

    addShareLink(
      "LINE\u3067\u9001\u308b",
      "L",
      "line",
      "https://social-plugins.line.me/lineit/share?url=" +
        encodeURIComponent(shareUrl) +
        "&text=" +
        encodeURIComponent(shareTitle + "\n\n" + shareText)
    );

    var copyButton = document.createElement("button");

    copyButton.type = "button";
    copyButton.className = "article-social-button copy";

    addText(copyButton, "span", "article-social-icon", "\u2197");
    addText(copyButton, "span", "article-social-name", "URL\u3092\u30b3\u30d4\u30fc");

    copyButton.addEventListener("click", function () {
      var name = copyButton.querySelector(".article-social-name");

      function copied() {
        if (name) name.textContent = "\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f";

        window.setTimeout(function () {
          if (name) name.textContent = "URL\u3092\u30b3\u30d4\u30fc";
        }, 1800);
      }

      function fallback() {
        window.prompt("\u3053\u306eURL\u3092\u30b3\u30d4\u30fc\u3057\u3066\u304f\u3060\u3055\u3044", shareUrl);
      }

      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        navigator.clipboard.writeText(shareUrl).then(copied).catch(fallback);
      } else {
        fallback();
      }
    });

    grid.appendChild(copyButton);
    box.appendChild(grid);
    parent.appendChild(box);
  }

  function renderHero() {
    var person = D.politician || {};

    var root = el("section", "hero");
    var inner = el("div", "hero-inner");
    var copy = el("div", "hero-copy");
    var visual = el("div", "hero-visual");
    var collage = el("div", "hero-collage");

    var list = [
      photos[5],
      photos[0],
      photos[3],
      photos[4]
    ].filter(Boolean);

    if (!list.length) {
      list = photos.slice(0, 4);
    }

    addText(
      copy,
      "p",
      "hero-kicker",
      person.role || "\u5730\u57df\u306e\u58f0\u3092\u770c\u653f\u3078"
    );

    addText(
      copy,
      "h2",
      "hero-name",
      person.name || "\u9234\u6728\u6b63\u4eba"
    );

    addText(
      copy,
      "p",
      "hero-role",
      [person.area, "\u6d3b\u52d5\u5831\u544a"].filter(Boolean).join("\uff5c")
    );

    addText(
      copy,
      "p",
      "hero-lead",
      D.appeal || D.description
    );

    var actions = el("div", "hero-actions");

    addLink(
      actions,
      "\u6d3b\u52d5\u5831\u544a\u3092\u898b\u308b",
      "#activity",
      "button gold"
    );

    addLink(
      actions,
      "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb",
      "#profile",
      "button secondary"
    );

    addLink(
      actions,
      "\u516c\u5f0f\u30b5\u30a4\u30c8",
      D.officialSite,
      "button"
    );

    var shareButton = el("button", "share-button");

    shareButton.type = "button";
    shareButton.textContent = "\u3053\u306e\u30da\u30fc\u30b8\u3092\u30b7\u30a7\u30a2";

    share(shareButton);

    actions.appendChild(shareButton);
    copy.appendChild(actions);

    var main = el("figure", "collage-main");

    addImage(
      main,
      list[0] || photos[0],
      "\u9234\u6728\u6b63\u4eba\u306e\u6d3b\u52d5\u5199\u771f"
    );

    collage.appendChild(main);

    if (list[1]) {
      var small = el("figure", "collage-small");

      addImage(
        small,
        list[1],
        "\u9234\u6728\u6b63\u4eba\u306e\u6d3b\u52d5\u5199\u771f"
      );

      collage.appendChild(small);
    }

    if (list.length > 2) {
      var mini = el("div", "collage-mini");

      list.slice(2, 4).forEach(function (src, index) {
        var figure = el("figure");

        addImage(
          figure,
          src,
          "\u9234\u6728\u6b63\u4eba\u306e\u6d3b\u52d5\u5199\u771f" + (index + 3)
        );

        mini.appendChild(figure);
      });

      collage.appendChild(mini);
    }

    addText(
      collage,
      "p",
      "collage-note",
      "\u5fd7\u6728\u5e02\u304b\u3089\u770c\u653f\u3078"
    );

    visual.appendChild(collage);

    var portrait = el("figure", "hero-portrait");

    addImage(
      portrait,
      person.image || photos[0],
      "\u9234\u6728\u6b63\u4eba"
    );

    addText(
      portrait,
      "span",
      "portrait-label",
      "\u9234\u6728\u6b63\u4eba"
    );

    visual.appendChild(portrait);

    inner.appendChild(copy);
    inner.appendChild(visual);
    root.appendChild(inner);
    app.appendChild(root);
  }

  function renderActivity(articleOverride) {
    var article = articleOverride || D.article;
    var articleOnly = Boolean(articleOverride);

    var root = section(
      "activity",
      "ACTIVITY REPORT",
      "\u6d3b\u52d5\u5831\u544a",
      articleOnly ? "\u5171\u6709\u3055\u308c\u305f\u8a18\u4e8b" : "\u6700\u65b0\u306e\u6d3b\u52d5"
    );

    if (!article) {
      addText(
        root,
        "p",
        "activity-empty",
        "\u73fe\u5728\u3001\u516c\u958b\u4e2d\u306e\u6d3b\u52d5\u5831\u544a\u306f\u3042\u308a\u307e\u305b\u3093\u3002"
      );

      return;
    }

    var images = normalizeImages(article);

    if (images.length) {
      rail(root, images, "\u6d3b\u52d5\u5199\u771f", "activity-photo-rail");
    }

    var content = el("div", "activity-content activity-content-full");

    addText(
      content,
      "div",
      "date-badge",
      article.date
    );

    addText(
      content,
      "h3",
      "content-title",
      article.title
    );

    addBody(content, article.body);

    var activityYoutube =
      article.youtube ||
      D.youtube ||
      D.youtubeUrl ||
      "";

    if (
      validUrl(article.externalUrl) &&
      !(isYoutubeUrl(article.externalUrl) && youtubeId(article.externalUrl))
    ) {
      var actions = el("div", "button-row article-actions");

      addArticleLink(
        actions,
        "\u95a2\u9023\u30ea\u30f3\u30af\u3092\u958b\u304f",
        article.externalUrl,
        "button"
      );

      if (actions.children.length) {
        content.appendChild(actions);
      }
    }

    addYoutube(content, activityYoutube);
    articleSocialLinks(content, article);

    root.appendChild(content);

    if (articleOnly) {
      var back = el("div", "button-row article-actions");

      addLink(
        back,
        "\u30da\u30fc\u30b8\u5168\u4f53\u3092\u898b\u308b",
        pageShareUrl(),
        "button secondary"
      );

      root.appendChild(back);
    }
  }

  function archiveDateParts(value) {
    var raw = text(value).trim();

    var match = raw.match(
      /(\d{4})[\/\-.\u5e74](\d{1,2})(?:[\/\-.\u6708](\d{1,2})\u65e5?)?/
    );

    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3] || 1)
      };
    }

    var date = new Date(raw);

    if (!isNaN(date.getTime())) {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      };
    }

    return {
      year: 0,
      month: 0,
      day: 0
    };
  }

  function archiveMonthKey(value) {
    var parts = archiveDateParts(value);

    if (!parts.year || !parts.month) {
      return "unknown";
    }

    return (
      parts.year +
      "-" +
      String(parts.month).padStart(2, "0")
    );
  }

  function archiveMonthLabel(key) {
    if (key === "unknown") {
      return "\u65e5\u4ed8\u672a\u8a2d\u5b9a";
    }

    var values = key.split("-");

    return (
      values[0] +
      "\u5e74" +
      Number(values[1]) +
      "\u6708"
    );
  }

  function archiveDateLabel(value) {
    var parts = archiveDateParts(value);

    if (!parts.year || !parts.month) {
      return text(value) || "\u65e5\u4ed8\u672a\u8a2d\u5b9a";
    }

    return (
      parts.year +
      "\u5e74" +
      parts.month +
      "\u6708" +
      parts.day +
      "\u65e5"
    );
  }

  function archiveDateNumber(value) {
    var parts = archiveDateParts(value);

    if (!parts.year || !parts.month) {
      return 0;
    }

    return new Date(
      parts.year,
      parts.month - 1,
      parts.day
    ).getTime();
  }

  function renderArchive() {
    var articles = (D.articles || []).filter(Boolean);

    var root = section(
      "archive",
      "ARCHIVE",
      "\u6708\u5225\u30a2\u30fc\u30ab\u30a4\u30d6",
      "\u904e\u53bb\u306e\u6d3b\u52d5\u5831\u544a"
    );

    if (!articles.length) {
      addText(
        root,
        "p",
        "archive-empty",
        "\u516c\u958b\u4e2d\u306e\u8a18\u4e8b\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002"
      );

      return;
    }

    var groups = {};
    var keys = [];

    articles.forEach(function (article) {
      var key = archiveMonthKey(article.date);

      if (!groups[key]) {
        groups[key] = [];
        keys.push(key);
      }

      groups[key].push(article);
    });

    keys.sort(function (a, b) {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;

      return b.localeCompare(a);
    });

    keys.forEach(function (key) {
      groups[key].sort(function (a, b) {
        return (
          archiveDateNumber(b.date) -
          archiveDateNumber(a.date)
        );
      });
    });

    addText(
      root,
      "p",
      "archive-note",
      "\u6708\u3092\u9078\u3076\u3068\u3001\u305d\u306e\u6708\u306e\u6d3b\u52d5\u5831\u544a\u3092\u307e\u3068\u3081\u3066\u3054\u89a7\u3044\u305f\u3060\u3051\u307e\u3059\u3002"
    );

    var tabs = el("div", "archive-months");
    var groupsRoot = el("div", "archive-groups");

    function activate(key) {
      Array.from(
        tabs.querySelectorAll("button")
      ).forEach(function (button) {
        button.classList.toggle(
          "active",
          button.getAttribute("data-month") === key
        );
      });

      Array.from(
        groupsRoot.querySelectorAll(".archive-group")
      ).forEach(function (group) {
        group.hidden =
          key !== "all" &&
          group.dataset.month !== key;
      });
    }

    function addTab(key, label) {
      var button = document.createElement("button");

      button.type = "button";
      button.className = "archive-month-button";
      button.setAttribute("data-month", key);
      button.textContent = label;

      button.onclick = function () {
        activate(key);
      };

      tabs.appendChild(button);
    }

    addTab("all", "\u3059\u3079\u3066");

    keys.forEach(function (key) {
      addTab(key, archiveMonthLabel(key));
    });

    keys.forEach(function (key, groupIndex) {
      var group = el("section", "archive-group");

      group.dataset.month = key;

      addText(
        group,
        "h3",
        "archive-group-title",
        archiveMonthLabel(key)
      );

      var list = el("div", "archive-list");

      groups[key].forEach(function (article, articleIndex) {
        var card = document.createElement("details");
        var summary = document.createElement("summary");
        var content = el("div", "archive-card-content");

        card.className = "archive-card";
        card.open =
          groupIndex === 0 &&
          articleIndex === 0;

        addText(
          summary,
          "span",
          "archive-card-date",
          archiveDateLabel(article.date)
        );

        addText(
          summary,
          "strong",
          "archive-card-title",
          article.title || "\u7121\u984c\u306e\u6d3b\u52d5\u5831\u544a"
        );

        var articleImages = normalizeImages(article);

        if (articleImages.length) {
          rail(
            content,
            articleImages,
            "\u6d3b\u52d5\u5199\u771f",
            "archive-photo-rail"
          );
        }

        addBody(content, article.body);

        var archiveYoutube = article.youtube || "";

        if (
          validUrl(article.externalUrl) &&
          !(isYoutubeUrl(article.externalUrl) && youtubeId(article.externalUrl))
        ) {
          var archiveActions = el("div", "button-row article-actions");

          addArticleLink(
            archiveActions,
            "\u95a2\u9023\u30ea\u30f3\u30af\u3092\u958b\u304f",
            article.externalUrl,
            "button"
          );

          if (archiveActions.children.length) {
            content.appendChild(archiveActions);
          }
        }

        addYoutube(content, archiveYoutube);
        articleSocialLinks(content, article);

        card.appendChild(summary);
        card.appendChild(content);
        list.appendChild(card);
      });

      group.appendChild(list);
      groupsRoot.appendChild(group);
    });

    root.appendChild(tabs);
    root.appendChild(groupsRoot);

    activate(keys[0]);
  }

  function renderProfile() {
    var person = D.politician;

    if (!person) return;

    var root = section(
      "profile",
      "PROFILE",
      "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb",
      "\u9234\u6728\u6b63\u4eba\u306b\u3064\u3044\u3066"
    );

    var layout = el("div", "profile-layout reverse");
    var media = el("div");
    var content = el("div", "profile-content");

    addImage(
      media,
      person.image || photos[0],
      "\u9234\u6728\u6b63\u4eba\u306e\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u5199\u771f",
      "profile-image"
    );

    addText(
      content,
      "h3",
      "profile-name",
      person.name
    );

    addText(
      content,
      "p",
      "role-line",
      [person.role, person.area].filter(Boolean).join("\uff5c")
    );

    addBody(content, person.profile);

    layout.appendChild(media);
    layout.appendChild(content);
    root.appendChild(layout);
  }

  function renderPolicy() {
    var person = D.politician;

    if (!person) return;

    var root = section(
      "policy",
      "POLICY",
      "\u653f\u7b56\u30fb\u6d3b\u52d5\u306e\u67f1",
      "\u5927\u5207\u306b\u3057\u3066\u3044\u308b\u3053\u3068"
    );

    var grid = el("div", "policy-grid");

    text(person.policy)
      .split(/\n/)
      .map(function (line) {
        return line.replace(/^\u30fb/, "").trim();
      })
      .filter(Boolean)
      .forEach(function (line) {
        addText(
          grid,
          "div",
          "policy-item",
          line
        );
      });

    root.appendChild(grid);
  }

  function renderConsultation() {
    var person = D.politician || {};

    var root = section(
      "consultation",
      "CONSULTATION",
      "\u5e02\u6c11\u76f8\u8ac7",
      "\u5730\u57df\u306e\u58f0\u3092\u304a\u805e\u304b\u305b\u304f\u3060\u3055\u3044"
    );

    var layout = el("div", "consultation-layout reverse");
    var media = el("div");
    var content = el("div", "consultation-content");

    addImage(
      media,
      photos[4] || photos[0],
      "\u5730\u57df\u306e\u6d3b\u52d5\u5199\u771f",
      "consultation-image"
    );

    var box = el("div", "consultation-box");

    addBody(
      box,
      person.consultation || D.contact
    );

    addLink(
      box,
      "\u304a\u554f\u3044\u5408\u308f\u305b\u30da\u30fc\u30b8\u3092\u958b\u304f",
      D.contactUrl,
      "button"
    );

    content.appendChild(box);
    layout.appendChild(media);
    layout.appendChild(content);
    root.appendChild(layout);
  }

  function renderSocial() {
    var root = section(
      "social",
      "OFFICIAL / SNS",
      "\u516c\u5f0f\u30b5\u30a4\u30c8\u30fbSNS",
      "\u6700\u65b0\u60c5\u5831\u306f\u3053\u3061\u3089"
    );

    var layout = el("div", "social-layout");
    var image = el("div");
    var content = el("div");

    addImage(
      image,
      photos[5] || photos[0],
      "\u9234\u6728\u6b63\u4eba\u306e\u6d3b\u52d5\u5199\u771f",
      "social-image"
    );

    addText(
      content,
      "p",
      "social-lead",
      "\u516c\u5f0f\u30db\u30fc\u30e0\u30da\u30fc\u30b8\u3084SNS\u304b\u3089\u3001\u6700\u65b0\u306e\u6d3b\u52d5\u3092\u3054\u89a7\u3044\u305f\u3060\u3051\u307e\u3059\u3002"
    );

    var grid = el("div", "social-grid");

    socialCard(
      grid,
      "\u516c\u5f0f\u30db\u30fc\u30e0\u30da\u30fc\u30b8",
      D.officialSite,
      "Web",
      "other"
    );

    socialUrls().forEach(function (url) {
        var info = socialInfo(url);

        if (!info) return;

        addSocialDestination(
          grid,
          info.name,
          url,
          info.icon,
          info.css
        );
      });

    socialCard(
      grid,
      "\u304a\u554f\u3044\u5408\u308f\u305b\u30da\u30fc\u30b8",
      D.contactUrl,
      "\u2709",
      "other"
    );

    content.appendChild(grid);
    layout.appendChild(image);
    layout.appendChild(content);
    root.appendChild(layout);
  }

  function normalizeNews(item) {
    if (
      !item ||
      (item.siteKey && item.siteKey !== SITE_KEY)
    ) {
      return null;
    }

    var videoUrl = articleVideo(item);
    var externalUrl = item.externalUrl || "";

    if (!videoUrl && isYoutubeUrl(externalUrl) && youtubeId(externalUrl)) {
      videoUrl = externalUrl;
      externalUrl = "";
    }

    if (isYoutubeUrl(externalUrl) && youtubeId(externalUrl)) {
      externalUrl = "";
    }

    return {
      id: item.id || item.newsId || "",
      date: item.date,
      title: item.title,
      body: item.body,
      images: normalizeImages(item),
      youtube: videoUrl,
      externalUrl: externalUrl,
      status: item.status || ""
    };
  }

  function loadRemoteArticles() {
    if (!GAS_URL) {
      return Promise.resolve({
        ok: false,
        articles: []
      });
    }

    var url =
      GAS_URL +
      "?mode=publicNews" +
      "&siteKey=" +
      encodeURIComponent(SITE_KEY) +
      "&limit=100" +
      "&_=" +
      Date.now();

    return fetch(url, {
      cache: "no-store"
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        var list =
          data && Array.isArray(data.news)
            ? data.news
            : data && Array.isArray(data.articles)
              ? data.articles
              : data && Array.isArray(data.items)
                ? data.items
                : [];

        var articles = list
          .map(normalizeNews)
          .filter(Boolean)
          .sort(function (a, b) {
            return (
              archiveDateNumber(b.date) -
              archiveDateNumber(a.date)
            );
          });

        return {
          ok: true,
          articles: articles
        };
      })
      .catch(function () {
        return {
          ok: false,
          articles: []
        };
      });
  }

  function renderSharedMessage(title, message) {
    var root = section(
      "activity",
      "ACTIVITY REPORT",
      title,
      "\u8a18\u4e8b\u306e\u5171\u6709"
    );

    addText(root, "p", "activity-empty", message);

    addLink(
      root,
      "\u30da\u30fc\u30b8\u5168\u4f53\u3092\u898b\u308b",
      pageShareUrl(),
      "button secondary"
    );
  }

  function render() {
    if (!app) return;

    app.innerHTML = "";

    var title = document.getElementById("siteTitle");

    if (title) {
      title.textContent =
        (D.politician && D.politician.name) ||
        "\u9234\u6728\u6b63\u4eba";
    }

    var requestedKey = requestedArticleKey();
    var availableArticles = (D.articles || []).filter(Boolean);

    if (!availableArticles.length && D.article) {
      availableArticles = [D.article];
    }

    var sharedArticle = findArticleByShareKey(
      availableArticles,
      requestedKey
    );

    if (sharedArticle) {
      D.activeArticle = sharedArticle;
      updateArticleMeta(sharedArticle);
      renderActivity(sharedArticle);
      return;
    }

    D.activeArticle = null;

    if (requestedKey) {
      renderSharedMessage(
        "\u3053\u306e\u8a18\u4e8b\u3092\u8868\u793a\u3067\u304d\u307e\u305b\u3093",
        "\u8a18\u4e8b\u30c7\u30fc\u30bf\u306e\u8aad\u307f\u8fbc\u307f\u304c\u5b8c\u4e86\u3057\u3066\u3044\u306a\u3044\u304b\u3001\u8a18\u4e8b\u304c\u524a\u9664\u3055\u308c\u3066\u3044\u307e\u3059\u3002"
      );
      return;
    }

    renderHero();
    renderActivity();
    renderArchive();
    renderProfile();
    renderPolicy();
    renderConsultation();
    renderSocial();
  }

  var headerShare = document.getElementById("headerShare");

  if (headerShare) {
    headerShare.textContent = "\u3053\u306e\u30da\u30fc\u30b8\u3092\u30b7\u30a7\u30a2";
    share(headerShare);
  }

  var initialArticleKey = requestedArticleKey();

  if (initialArticleKey && GAS_URL) {
    renderSharedMessage(
      "\u8a18\u4e8b\u3092\u8aad\u307f\u8fbc\u3093\u3067\u3044\u307e\u3059",
      "\u5171\u6709\u3055\u308c\u305f\u8a18\u4e8b\u3092\u8868\u793a\u3057\u3066\u3044\u307e\u3059\u3002\u5c11\u3057\u304a\u5f85\u3061\u304f\u3060\u3055\u3044\u3002"
    );
  } else {
    render();
  }

  loadRemoteArticles().then(function (result) {
    if (!result || !result.ok) {
      if (initialArticleKey && GAS_URL) {
        app.innerHTML = "";
        renderSharedMessage(
          "\u8a18\u4e8b\u3092\u8aad\u307f\u8fbc\u3081\u307e\u305b\u3093\u3067\u3057\u305f",
          "\u901a\u4fe1\u3092\u78ba\u8a8d\u3057\u3066\u3001\u3082\u3046\u4e00\u5ea6\u3053\u306e\u5171\u6709\u30ea\u30f3\u30af\u3092\u958b\u3044\u3066\u304f\u3060\u3055\u3044\u3002"
        );
      }

      return;
    }

    D.articles = result.articles || [];
    D.article = D.articles[0] || null;

    if (
      D.article &&
      D.article.images.length
    ) {
      D.articleImages = D.article.images;
    }

    if (headerShare) {
      headerShare.textContent = D.article
        ? "\u3053\u306e\u8a18\u4e8b\u3092\u30b7\u30a7\u30a2"
        : "\u3053\u306e\u30da\u30fc\u30b8\u3092\u30b7\u30a7\u30a2";
    }

    render();
  });
})();

