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
      item["\u52D5\u753BURL"] ||
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
      return "\u516C\u5F0F\u30EA\u30F3\u30AF";
    }
  }

  function addImage(parent, src, alt, className) {
    if (!src) return null;

    var image = el("img", className || "");
    image.src = src;
    image.alt = alt || "\u9234\u6728\u6B63\u4EBA\u306E\u6D3B\u52D5\u5199\u771F";
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

    frame.title = "\u6D3B\u52D5\u5831\u544A\u52D5\u753B";
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

  function share(button) {
    button.onclick = function () {
      var url = D.publicUrl || window.location.href;

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
          button.textContent = "\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F";

          window.setTimeout(function () {
            button.textContent = "\u3053\u306E\u30DA\u30FC\u30B8\u3092\u30B7\u30A7\u30A2";
          }, 2200);
        });

        return;
      }

      window.prompt("URL\u3092\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044", url);
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
        label + "\u5199\u771F" + (index + 1)
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
        name: "Facebook\uFF08\u30D5\u30A7\u30A4\u30B9\u30D6\u30C3\u30AF\uFF09",
        icon: "f",
        css: "facebook"
      };
    }

    if (value.indexOf("instagram.com") >= 0) {
      return {
        name: "Instagram\uFF08\u30A4\u30F3\u30B9\u30BF\u30B0\u30E9\u30E0\uFF09",
        icon: "\u25CE",
        css: "instagram"
      };
    }

    if (
      value.indexOf("twitter.com") >= 0 ||
      value.indexOf("x.com") >= 0
    ) {
      return {
        name: "X\uFF08\u65E7Twitter\uFF09",
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
        icon: "\u25B6",
        css: "youtube"
      };
    }

    return {
      name: "\u516C\u5F0F\u30EA\u30F3\u30AF",
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

  function articleSocialLinks(parent) {
    var box = el("div", "article-social-links");
    var grid = el("div", "article-social-grid");

    addText(
      box,
      "h4",
      "article-social-title",
      "\u3053\u306E\u8A18\u4E8B\u3092\u30B7\u30A7\u30A2"
    );

    var shareUrl = D.publicUrl || window.location.href;
    var shareTitle = D.title || "\u9234\u6728\u6B63\u4EBA\u306E\u6D3B\u52D5\u5831\u544A";

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
      "Facebook\u3067\u30B7\u30A7\u30A2",
      "f",
      "facebook",
      "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(shareUrl)
    );

    addShareLink(
      "X\u3067\u30B7\u30A7\u30A2",
      "X",
      "x",
      "https://twitter.com/intent/tweet?text=" +
        encodeURIComponent(shareTitle) +
        "&url=" +
        encodeURIComponent(shareUrl)
    );

    addShareLink(
      "LINE\u3067\u9001\u308B",
      "L",
      "line",
      "https://line.me/R/msg/text/?" +
        encodeURIComponent(shareTitle + "\n" + shareUrl)
    );

    var copyButton = document.createElement("button");

    copyButton.type = "button";
    copyButton.className = "article-social-button copy";

    addText(copyButton, "span", "article-social-icon", "\u2197");
    addText(copyButton, "span", "article-social-name", "URL\u3092\u30B3\u30D4\u30FC");

    copyButton.addEventListener("click", function () {
      var name = copyButton.querySelector(".article-social-name");

      function copied() {
        if (name) name.textContent = "\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F";

        window.setTimeout(function () {
          if (name) name.textContent = "URL\u3092\u30B3\u30D4\u30FC";
        }, 1800);
      }

      function fallback() {
        window.prompt("\u3053\u306EURL\u3092\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044", shareUrl);
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
      person.role || "\u5730\u57DF\u306E\u58F0\u3092\u770C\u653F\u3078"
    );

    addText(
      copy,
      "h2",
      "hero-name",
      person.name || "\u9234\u6728\u6B63\u4EBA"
    );

    addText(
      copy,
      "p",
      "hero-role",
      [person.area, "\u6D3B\u52D5\u5831\u544A"].filter(Boolean).join("\uFF5C")
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
      "\u6D3B\u52D5\u5831\u544A\u3092\u898B\u308B",
      "#activity",
      "button gold"
    );

    addLink(
      actions,
      "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB",
      "#profile",
      "button secondary"
    );

    addLink(
      actions,
      "\u516C\u5F0F\u30B5\u30A4\u30C8",
      D.officialSite,
      "button"
    );

    var shareButton = el("button", "share-button");

    shareButton.type = "button";
    shareButton.textContent = "\u3053\u306E\u30DA\u30FC\u30B8\u3092\u30B7\u30A7\u30A2";

    share(shareButton);

    actions.appendChild(shareButton);
    copy.appendChild(actions);

    var main = el("figure", "collage-main");

    addImage(
      main,
      list[0] || photos[0],
      "\u9234\u6728\u6B63\u4EBA\u306E\u6D3B\u52D5\u5199\u771F"
    );

    collage.appendChild(main);

    if (list[1]) {
      var small = el("figure", "collage-small");

      addImage(
        small,
        list[1],
        "\u9234\u6728\u6B63\u4EBA\u306E\u6D3B\u52D5\u5199\u771F"
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
          "\u9234\u6728\u6B63\u4EBA\u306E\u6D3B\u52D5\u5199\u771F" + (index + 3)
        );

        mini.appendChild(figure);
      });

      collage.appendChild(mini);
    }

    addText(
      collage,
      "p",
      "collage-note",
      "\u5FD7\u6728\u5E02\u304B\u3089\u770C\u653F\u3078"
    );

    visual.appendChild(collage);

    var portrait = el("figure", "hero-portrait");

    addImage(
      portrait,
      person.image || photos[0],
      "\u9234\u6728\u6B63\u4EBA"
    );

    addText(
      portrait,
      "span",
      "portrait-label",
      "\u9234\u6728\u6B63\u4EBA"
    );

    visual.appendChild(portrait);

    inner.appendChild(copy);
    inner.appendChild(visual);
    root.appendChild(inner);
    app.appendChild(root);
  }

  function renderActivity() {
    var article = D.article;

    var root = section(
      "activity",
      "ACTIVITY REPORT",
      "\u6D3B\u52D5\u5831\u544A",
      "\u6700\u65B0\u306E\u6D3B\u52D5"
    );

    if (!article) {
      addText(
        root,
        "p",
        "activity-empty",
        "\u73FE\u5728\u3001\u516C\u958B\u4E2D\u306E\u6D3B\u52D5\u5831\u544A\u306F\u3042\u308A\u307E\u305B\u3093\u3002"
      );

      return;
    }

    var images = normalizeImages(article);

    if (images.length) {
      rail(root, images, "\u6D3B\u52D5\u5199\u771F", "activity-photo-rail");
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
        "\u95A2\u9023\u30EA\u30F3\u30AF\u3092\u958B\u304F",
        article.externalUrl,
        "button"
      );

      if (actions.children.length) {
        content.appendChild(actions);
      }
    }

    addYoutube(content, activityYoutube);
    articleSocialLinks(content);

    root.appendChild(content);
  }

  function archiveDateParts(value) {
    var raw = text(value).trim();

    var match = raw.match(
      /(\d{4})[\/\-.\u5E74](\d{1,2})(?:[\/\-.\u6708](\d{1,2})\u65E5?)?/
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
      return "\u65E5\u4ED8\u672A\u8A2D\u5B9A";
    }

    var values = key.split("-");

    return (
      values[0] +
      "\u5E74" +
      Number(values[1]) +
      "\u6708"
    );
  }

  function archiveDateLabel(value) {
    var parts = archiveDateParts(value);

    if (!parts.year || !parts.month) {
      return text(value) || "\u65E5\u4ED8\u672A\u8A2D\u5B9A";
    }

    return (
      parts.year +
      "\u5E74" +
      parts.month +
      "\u6708" +
      parts.day +
      "\u65E5"
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
      "\u6708\u5225\u30A2\u30FC\u30AB\u30A4\u30D6",
      "\u904E\u53BB\u306E\u6D3B\u52D5\u5831\u544A"
    );

    if (!articles.length) {
      addText(
        root,
        "p",
        "archive-empty",
        "\u516C\u958B\u4E2D\u306E\u8A18\u4E8B\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002"
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
      "\u6708\u3092\u9078\u3076\u3068\u3001\u305D\u306E\u6708\u306E\u6D3B\u52D5\u5831\u544A\u3092\u307E\u3068\u3081\u3066\u3054\u89A7\u3044\u305F\u3060\u3051\u307E\u3059\u3002"
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
          article.title || "\u7121\u984C\u306E\u6D3B\u52D5\u5831\u544A"
        );

        var articleImages = normalizeImages(article);

        if (articleImages.length) {
          rail(
            content,
            articleImages,
            "\u6D3B\u52D5\u5199\u771F",
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
            "\u95A2\u9023\u30EA\u30F3\u30AF\u3092\u958B\u304F",
            article.externalUrl,
            "button"
          );

          if (archiveActions.children.length) {
            content.appendChild(archiveActions);
          }
        }

        addYoutube(content, archiveYoutube);
        articleSocialLinks(content);

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
      "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB",
      "\u9234\u6728\u6B63\u4EBA\u306B\u3064\u3044\u3066"
    );

    var layout = el("div", "profile-layout reverse");
    var media = el("div");
    var content = el("div", "profile-content");

    addImage(
      media,
      person.image || photos[0],
      "\u9234\u6728\u6B63\u4EBA\u306E\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u5199\u771F",
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
      [person.role, person.area].filter(Boolean).join("\uFF5C")
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
      "\u653F\u7B56\u30FB\u6D3B\u52D5\u306E\u67F1",
      "\u5927\u5207\u306B\u3057\u3066\u3044\u308B\u3053\u3068"
    );

    var grid = el("div", "policy-grid");

    text(person.policy)
      .split(/\n/)
      .map(function (line) {
        return line.replace(/^\u30FB/, "").trim();
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
      "\u5E02\u6C11\u76F8\u8AC7",
      "\u5730\u57DF\u306E\u58F0\u3092\u304A\u805E\u304B\u305B\u304F\u3060\u3055\u3044"
    );

    var layout = el("div", "consultation-layout reverse");
    var media = el("div");
    var content = el("div", "consultation-content");

    addImage(
      media,
      photos[4] || photos[0],
      "\u5730\u57DF\u306E\u6D3B\u52D5\u5199\u771F",
      "consultation-image"
    );

    var box = el("div", "consultation-box");

    addBody(
      box,
      person.consultation || D.contact
    );

    addLink(
      box,
      "\u304A\u554F\u3044\u5408\u308F\u305B\u30DA\u30FC\u30B8\u3092\u958B\u304F",
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
      "\u516C\u5F0F\u30B5\u30A4\u30C8\u30FBSNS",
      "\u6700\u65B0\u60C5\u5831\u306F\u3053\u3061\u3089"
    );

    var layout = el("div", "social-layout");
    var image = el("div");
    var content = el("div");

    addImage(
      image,
      photos[5] || photos[0],
      "\u9234\u6728\u6B63\u4EBA\u306E\u6D3B\u52D5\u5199\u771F",
      "social-image"
    );

    addText(
      content,
      "p",
      "social-lead",
      "\u516C\u5F0F\u30DB\u30FC\u30E0\u30DA\u30FC\u30B8\u3084SNS\u304B\u3089\u3001\u6700\u65B0\u306E\u6D3B\u52D5\u3092\u3054\u89A7\u3044\u305F\u3060\u3051\u307E\u3059\u3002"
    );

    var grid = el("div", "social-grid");

    socialCard(
      grid,
      "\u516C\u5F0F\u30DB\u30FC\u30E0\u30DA\u30FC\u30B8",
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
      "\u304A\u554F\u3044\u5408\u308F\u305B\u30DA\u30FC\u30B8",
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

  function render() {
    if (!app) return;

    app.innerHTML = "";

    var title = document.getElementById("siteTitle");

    if (title) {
      title.textContent =
        (D.politician && D.politician.name) ||
        "\u9234\u6728\u6B63\u4EBA";
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
    headerShare.textContent = "\u3053\u306E\u30DA\u30FC\u30B8\u3092\u30B7\u30A7\u30A2";
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
