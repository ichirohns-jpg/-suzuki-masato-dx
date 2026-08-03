(function () {
  "use strict";

  var D = window.DX_DATA || {};
  var GAS_URL = D.gasUrl || "";
  var SITE_KEY = D.siteKey || "suzuki-masato-dx";
  var app = document.getElementById("app");
  var photos = (D.commonImages || []).filter(Boolean);

  function text(value) { return value == null ? "" : String(value); }

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
      return "公式リンク";
    }
  }

  function addImage(parent, src, alt, className) {
    if (!src) return null;

    var image = el("img", className || "");
    image.src = src;
    image.alt = alt || "鈴木正人の活動写真";
    image.loading = "lazy";

    image.onerror = function () {
      var figure = image.closest("figure");
      if (figure) figure.remove();
      else image.remove();
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

      var link = document.createElement("a");
      link.href = match[0];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = match[0];
      node.appendChild(link);

      last = match.index + match[0].length;
    }

    node.appendChild(document.createTextNode(source.slice(last)));
    parent.appendChild(node);
  }

  function youtubeId(url) {
    var match = text(url).match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );

    return match ? match[1] : "";
  }

  function addYoutube(parent, url) {
    var id = youtubeId(url);
    if (!id) return;

    var box = el("div", "video");
    var frame = document.createElement("iframe");

    frame.src = "https://www.youtube.com/embed/" + id;
    frame.title = "活動報告動画";
    frame.loading = "lazy";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;

    box.appendChild(frame);
    parent.appendChild(box);
  }

  function share(button) {
    button.onclick = function () {
      var url = D.publicUrl || window.location.href;

      if (navigator.share) {
        navigator.share({
          title: D.title,
          text: D.description,
          url: url
        }).catch(function () {});
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          button.textContent = "リンクをコピーしました";

          window.setTimeout(function () {
            button.textContent = "このページをシェア";
          }, 2200);
        });

        return;
      }

      window.prompt("URLをコピーしてください", url);
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

  function rail(parent, list, label) {
    var images = (list || []).filter(Boolean);
    if (!images.length) return;

    var row = el("div", "photo-rail");

    images.forEach(function (src, index) {
      var figure = el("figure", "photo-card");

      addImage(figure, src, label + "写真" + (index + 1));
      addText(figure, "figcaption", "", label + " " + (index + 1));

      row.appendChild(figure);
    });

    parent.appendChild(row);
  }

  function socialInfo(url) {
    var value = text(url).toLowerCase();

    if (value.indexOf("facebook.com") >= 0) {
      return {
        name: "Facebook（フェイスブック）",
        icon: "f",
        css: "facebook"
      };
    }

    if (value.indexOf("instagram.com") >= 0) {
      return {
        name: "Instagram（インスタグラム）",
        icon: "◎",
        css: "instagram"
      };
    }

    if (
      value.indexOf("twitter.com") >= 0 ||
      value.indexOf("x.com") >= 0
    ) {
      return {
        name: "X（旧Twitter）",
        icon: "X",
        css: "x"
      };
    }

    if (value.indexOf("ameblo.jp") >= 0) {
      return {
        name: "アメブロ",
        icon: "A",
        css: "ameblo"
      };
    }

    if (
      value.indexOf("youtube.com") >= 0 ||
      value.indexOf("youtu.be") >= 0
    ) {
      return {
        name: "YouTube",
        icon: "▶",
        css: "youtube"
      };
    }

    return {
      name: "公式リンク",
      icon: "↗",
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

  function renderHero() {
    var person = D.politician || {};
    var root = el("section", "hero");
    var inner = el("div", "hero-inner");
    var copy = el("div", "hero-copy");
    var visual = el("div", "hero-visual");
    var collage = el("div", "hero-collage");

    // トップ写真をマスクなしの議場写真に変更
    var list = [
      photos[5],
      photos[0],
      photos[3],
      photos[4]
    ].filter(Boolean);

    if (!list.length) {
      list = photos.slice(0, 4);
    }

    addText(copy, "p", "hero-kicker", person.role || "地域の声を県政へ");
    addText(copy, "h2", "hero-name", person.name || "鈴木正人");

    addText(
      copy,
      "p",
      "hero-role",
      [person.area, "活動報告"].filter(Boolean).join("｜")
    );

    addText(copy, "p", "hero-lead", D.appeal || D.description);

    var actions = el("div", "hero-actions");

    addLink(actions, "活動報告を見る", "#activity", "button gold");
    addLink(actions, "プロフィール", "#profile", "button secondary");
    addLink(actions, "公式サイト", D.officialSite, "button");

    var shareButton = el("button", "share-button");
    shareButton.type = "button";
    shareButton.textContent = "このページをシェア";
    share(shareButton);
    actions.appendChild(shareButton);

    copy.appendChild(actions);

    var main = el("figure", "collage-main");
    addImage(main, list[0] || photos[0], "鈴木正人の活動写真");
    collage.appendChild(main);

    if (list[1]) {
      var small = el("figure", "collage-small");
      addImage(small, list[1], "鈴木正人の活動写真");
      collage.appendChild(small);
    }

    if (list.length > 2) {
      var mini = el("div", "collage-mini");

      list.slice(2, 4).forEach(function (src, index) {
        var figure = el("figure");

        addImage(
          figure,
          src,
          "鈴木正人の活動写真" + (index + 3)
        );

        mini.appendChild(figure);
      });

      collage.appendChild(mini);
    }

    addText(collage, "p", "collage-note", "志木市から県政へ");
    visual.appendChild(collage);

    var portrait = el("figure", "hero-portrait");
    addImage(portrait, person.image || photos[0], "鈴木正人");
    addText(portrait, "span", "portrait-label", "鈴木正人");
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
      "活動報告",
      "最新の活動"
    );

    if (!article) {
      addText(
        root,
        "p",
        "activity-empty",
        "現在、公開中の活動報告はありません。"
      );
      return;
    }

    var layout = el("div", "activity-layout");
    var media = el("div");
    var content = el("div", "activity-content");

    addImage(
      media,
      (D.articleImages || photos)[0] || photos[0],
      "活動報告の代表写真",
      "feature-image"
    );

    addText(content, "div", "date-badge", article.date);
    addText(content, "h3", "content-title", article.title);
    addBody(content, article.body);
    addYoutube(content, article.youtube || D.youtube);

    layout.appendChild(media);
    layout.appendChild(content);
    root.appendChild(layout);

    rail(root, D.articleImages || photos, "活動写真");
  }

  function renderProfile() {
    var person = D.politician;
    if (!person) return;

    var root = section(
      "profile",
      "PROFILE",
      "プロフィール",
      "鈴木正人について"
    );

    var layout = el("div", "profile-layout reverse");
    var media = el("div");
    var content = el("div", "profile-content");

    addImage(
      media,
      person.image || photos[0],
      "鈴木正人のプロフィール写真",
      "profile-image"
    );

    addText(content, "h3", "profile-name", person.name);

    addText(
      content,
      "p",
      "role-line",
      [person.role, person.area].filter(Boolean).join("｜")
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
      "政策・活動の柱",
      "大切にしていること"
    );

    var grid = el("div", "policy-grid");

    text(person.policy)
      .split(/\n/)
      .map(function (line) {
        return line.replace(/^・/, "").trim();
      })
      .filter(Boolean)
      .forEach(function (line) {
        addText(grid, "div", "policy-item", line);
      });

    root.appendChild(grid);
  }

  function renderConsultation() {
    var person = D.politician || {};

    var root = section(
      "consultation",
      "CONSULTATION",
      "市民相談",
      "地域の声をお聞かせください"
    );

    var layout = el("div", "consultation-layout reverse");
    var media = el("div");
    var content = el("div", "consultation-content");

    addImage(
      media,
      photos[4] || photos[0],
      "地域の活動写真",
      "consultation-image"
    );

    var box = el("div", "consultation-box");

    addBody(box, person.consultation || D.contact);

    addLink(
      box,
      "お問い合わせページを開く",
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
      "公式サイト・SNS",
      "最新情報はこちら"
    );

    var layout = el("div", "social-layout");
    var image = el("div");
    var content = el("div");

    addImage(
      image,
      photos[5] || photos[0],
      "鈴木正人の活動写真",
      "social-image"
    );

    addText(
      content,
      "p",
      "social-lead",
      "公式ホームページやSNSから、最新の活動をご覧いただけます。"
    );

    var grid = el("div", "social-grid");

    socialCard(
      grid,
      "公式ホームページ",
      D.officialSite,
      "Web",
      "other"
    );

    (D.sns || []).filter(Boolean).forEach(function (url) {
      var info = socialInfo(url);
      socialCard(grid, info.name, url, info.icon, info.css);
    });

    if (D.youtube) {
      socialCard(grid, "YouTube", D.youtube, "▶", "youtube");
    }

    socialCard(
      grid,
      "お問い合わせページ",
      D.contactUrl,
      "✉",
      "other"
    );

    content.appendChild(grid);
    layout.appendChild(image);
    layout.appendChild(content);
    root.appendChild(layout);
  }

  function normalizeNews(item) {
    if (!item || (item.siteKey && item.siteKey !== SITE_KEY)) {
      return null;
    }

    if (
      !item.siteKey &&
      item.externalUrl &&
      item.externalUrl.indexOf(SITE_KEY) < 0
    ) {
      return null;
    }

    return {
      date: item.date,
      title: item.title,
      body: item.body,
      images: item.images || [],
      youtube: item.videoUrl || item.youtube || ""
    };
  }

  function loadRemoteArticle() {
    if (!GAS_URL) {
      return Promise.resolve({
        ok: false,
        article: null
      });
    }

    var url =
      GAS_URL +
      "?mode=publicNews&siteKey=" +
      encodeURIComponent(SITE_KEY) +
      "&limit=1&_=" +
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
            : [];

        return {
          ok: true,
          article: list.length
            ? normalizeNews(list[0])
            : null
        };
      })
      .catch(function () {
        return {
          ok: false,
          article: null
        };
      });
  }

  function render() {
    if (!app) return;

    app.innerHTML = "";

    var title = document.getElementById("siteTitle");

    if (title) {
      title.textContent =
        (D.politician && D.politician.name) || "鈴木正人";
    }

    renderHero();
    renderActivity();
    renderProfile();
    renderPolicy();
    renderConsultation();
    renderSocial();
  }

  var headerShare = document.getElementById("headerShare");

  if (headerShare) {
    headerShare.textContent = "このページをシェア";
    share(headerShare);
  }

  render();

  loadRemoteArticle().then(function (result) {
    if (!result || !result.ok) return;

    D.article = result.article;

    if (
      result.article &&
      result.article.images.length
    ) {
      D.articleImages = result.article.images;
    }

    render();
  });
})();
