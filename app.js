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
      item["åç»URL"] ||
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
      return "å¬å¼ãªã³ã¯";
    }
  }

  function addImage(parent, src, alt, className) {
    if (!src) return null;

    var image = el("img", className || "");
    image.src = src;
    image.alt = alt || "é´æ¨æ­£äººã®æ´»ååç";
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

    frame.title = "æ´»åå ±ååç»";
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
    var title = text(article && article.title || D.title || "é´æ¨æ­£äºº");
    var description = text(article && article.body || D.description)
      .replace(/\s+/g, " ")
      .slice(0, 160);
    var url = articleShareUrl(article);

    document.title = title + "ï½" + text(D.title || "é´æ¨æ­£äºº");

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
      var url = pageShareUrl();

      if (navigator.share) {
        navigator
          .share({
            title: D.title,
            text: D.description,
            url: url
          })
          .catch(function () {});

        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          button.textContent = "ãªã³ã¯ãã³ãã¼ãã¾ãã";

          window.setTimeout(function () {
            button.textContent = "ãã®ãã¼ã¸ãã·ã§ã¢";
          }, 2200);
        });

        return;
      }

      window.prompt("URLãã³ãã¼ãã¦ãã ãã", url);
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
        label + "åç" + (index + 1)
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
        name: "Facebookï¼ãã§ã¤ã¹ããã¯ï¼",
        icon: "f",
        css: "facebook"
      };
    }

    if (value.indexOf("instagram.com") >= 0) {
      return {
        name: "Instagramï¼ã¤ã³ã¹ã¿ã°ã©ã ï¼",
        icon: "â",
        css: "instagram"
      };
    }

    if (
      value.indexOf("twitter.com") >= 0 ||
      value.indexOf("x.com") >= 0
    ) {
      return {
        name: "Xï¼æ§Twitterï¼",
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
        icon: "â¶",
        css: "youtube"
      };
    }

    return {
      name: "å¬å¼ãªã³ã¯",
      icon: "â",
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
      "ãã®è¨äºãã·ã§ã¢"
    );

    var shareUrl = article ? articleShareUrl(article) : pageShareUrl();
    var shareTitle =
      text(article && article.title || D.title || "é´æ¨æ­£äººã®æ´»åå ±å");

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
      "Facebookã§ã·ã§ã¢",
      "f",
      "facebook",
      "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(shareUrl)
    );

    addShareLink(
      "Xã§ã·ã§ã¢",
      "X",
      "x",
      "https://twitter.com/intent/tweet?text=" +
        encodeURIComponent(shareTitle) +
        "&url=" +
        encodeURIComponent(shareUrl)
    );

    addShareLink(
      "LINEã§éã",
      "L",
      "line",
      "https://line.me/R/msg/text/?" +
        encodeURIComponent(shareTitle + "\n" + shareUrl)
    );

    var copyButton = document.createElement("button");

    copyButton.type = "button";
    copyButton.className = "article-social-button copy";

    addText(copyButton, "span", "article-social-icon", "â");
    addText(copyButton, "span", "article-social-name", "URLãã³ãã¼");

    copyButton.addEventListener("click", function () {
      var name = copyButton.querySelector(".article-social-name");

      function copied() {
        if (name) name.textContent = "ã³ãã¼ãã¾ãã";

        window.setTimeout(function () {
          if (name) name.textContent = "URLãã³ãã¼";
        }, 1800);
      }

      function fallback() {
        window.prompt("ãã®URLãã³ãã¼ãã¦ãã ãã", shareUrl);
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
      person.role || "å°åã®å£°ãçæ¿ã¸"
    );

    addText(
      copy,
      "h2",
      "hero-name",
      person.name || "é´æ¨æ­£äºº"
    );

    addText(
      copy,
      "p",
      "hero-role",
      [person.area, "æ´»åå ±å"].filter(Boolean).join("ï½")
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
      "æ´»åå ±åãè¦ã",
      "#activity",
      "button gold"
    );

    addLink(
      actions,
      "ãã­ãã£ã¼ã«",
      "#profile",
      "button secondary"
    );

    addLink(
      actions,
      "å¬å¼ãµã¤ã",
      D.officialSite,
      "button"
    );

    var shareButton = el("button", "share-button");

    shareButton.type = "button";
    shareButton.textContent = "ãã®ãã¼ã¸ãã·ã§ã¢";

    share(shareButton);

    actions.appendChild(shareButton);
    copy.appendChild(actions);

    var main = el("figure", "collage-main");

    addImage(
      main,
      list[0] || photos[0],
      "é´æ¨æ­£äººã®æ´»ååç"
    );

    collage.appendChild(main);

    if (list[1]) {
      var small = el("figure", "collage-small");

      addImage(
        small,
        list[1],
        "é´æ¨æ­£äººã®æ´»ååç"
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
          "é´æ¨æ­£äººã®æ´»ååç" + (index + 3)
        );

        mini.appendChild(figure);
      });

      collage.appendChild(mini);
    }

    addText(
      collage,
      "p",
      "collage-note",
      "å¿æ¨å¸ããçæ¿ã¸"
    );

    visual.appendChild(collage);

    var portrait = el("figure", "hero-portrait");

    addImage(
      portrait,
      person.image || photos[0],
      "é´æ¨æ­£äºº"
    );

    addText(
      portrait,
      "span",
      "portrait-label",
      "é´æ¨æ­£äºº"
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
      "æ´»åå ±å",
      articleOnly ? "å±æãããè¨äº" : "ææ°ã®æ´»å"
    );

    if (!article) {
      addText(
        root,
        "p",
        "activity-empty",
        "ç¾å¨ãå¬éä¸­ã®æ´»åå ±åã¯ããã¾ããã"
      );

      return;
    }

    var images = normalizeImages(article);

    if (images.length) {
      rail(root, images, "æ´»ååç", "activity-photo-rail");
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
        "é¢é£ãªã³ã¯ãéã",
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
        "ãã¼ã¸å¨ä½ãè¦ã",
        pageShareUrl(),
        "button secondary"
      );

      root.appendChild(back);
    }
  }

  function archiveDateParts(value) {
    var raw = text(value).trim();

    var match = raw.match(
      /(\d{4})[\/\-.å¹´](\d{1,2})(?:[\/\-.æ](\d{1,2})æ¥?)?/
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
      return "æ¥ä»æªè¨­å®";
    }

    var values = key.split("-");

    return (
      values[0] +
      "å¹´" +
      Number(values[1]) +
      "æ"
    );
  }

  function archiveDateLabel(value) {
    var parts = archiveDateParts(value);

    if (!parts.year || !parts.month) {
      return text(value) || "æ¥ä»æªè¨­å®";
    }

    return (
      parts.year +
      "å¹´" +
      parts.month +
      "æ" +
      parts.day +
      "æ¥"
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
      "æå¥ã¢ã¼ã«ã¤ã",
      "éå»ã®æ´»åå ±å"
    );

    if (!articles.length) {
      addText(
        root,
        "p",
        "archive-empty",
        "å¬éä¸­ã®è¨äºã¯ã¾ã ããã¾ããã"
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
      "æãé¸ã¶ã¨ããã®æã®æ´»åå ±åãã¾ã¨ãã¦ãè¦§ããã ãã¾ãã"
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

    addTab("all", "ãã¹ã¦");

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
          article.title || "ç¡é¡ã®æ´»åå ±å"
        );

        var articleImages = normalizeImages(article);

        if (articleImages.length) {
          rail(
            content,
            articleImages,
            "æ´»ååç",
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
            "é¢é£ãªã³ã¯ãéã",
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
      "ãã­ãã£ã¼ã«",
      "é´æ¨æ­£äººã«ã¤ãã¦"
    );

    var layout = el("div", "profile-layout reverse");
    var media = el("div");
    var content = el("div", "profile-content");

    addImage(
      media,
      person.image || photos[0],
      "é´æ¨æ­£äººã®ãã­ãã£ã¼ã«åç",
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
      [person.role, person.area].filter(Boolean).join("ï½")
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
      "æ¿ç­ã»æ´»åã®æ±",
      "å¤§åã«ãã¦ãããã¨"
    );

    var grid = el("div", "policy-grid");

    text(person.policy)
      .split(/\n/)
      .map(function (line) {
        return line.replace(/^ã»/, "").trim();
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
      "å¸æ°ç¸è«",
      "å°åã®å£°ããèãããã ãã"
    );

    var layout = el("div", "consultation-layout reverse");
    var media = el("div");
    var content = el("div", "consultation-content");

    addImage(
      media,
      photos[4] || photos[0],
      "å°åã®æ´»ååç",
      "consultation-image"
    );

    var box = el("div", "consultation-box");

    addBody(
      box,
      person.consultation || D.contact
    );

    addLink(
      box,
      "ãåãåãããã¼ã¸ãéã",
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
      "å¬å¼ãµã¤ãã»SNS",
      "ææ°æå ±ã¯ãã¡ã"
    );

    var layout = el("div", "social-layout");
    var image = el("div");
    var content = el("div");

    addImage(
      image,
      photos[5] || photos[0],
      "é´æ¨æ­£äººã®æ´»ååç",
      "social-image"
    );

    addText(
      content,
      "p",
      "social-lead",
      "å¬å¼ãã¼ã ãã¼ã¸ãSNSãããææ°ã®æ´»åããè¦§ããã ãã¾ãã"
    );

    var grid = el("div", "social-grid");

    socialCard(
      grid,
      "å¬å¼ãã¼ã ãã¼ã¸",
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
      "ãåãåãããã¼ã¸",
      D.contactUrl,
      "â",
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

  function render() {
    if (!app) return;

    app.innerHTML = "";

    var title = document.getElementById("siteTitle");

    if (title) {
      title.textContent =
        (D.politician && D.politician.name) ||
        "é´æ¨æ­£äºº";
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
      updateArticleMeta(sharedArticle);
      renderActivity(sharedArticle);
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
    headerShare.textContent = "ãã®ãã¼ã¸ãã·ã§ã¢";
    share(headerShare);
  }

  render();

  loadRemoteArticles().then(function (result) {
    if (!result || !result.ok) return;

    D.articles = result.articles || [];
    D.article = D.articles[0] || null;

    if (
      D.article &&
      D.article.images.length
    ) {
      D.articleImages = D.article.images;
    }

    render();
  });
})();
