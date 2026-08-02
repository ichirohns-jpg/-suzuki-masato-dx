(function () {
  "use strict";

  var D = window.DX_DATA || {};
  var photos = (D.commonImages || []).filter(Boolean);

  function value(text) {
    return text == null ? "" : String(text);
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function text(parent, tag, className, content) {
    var node = el(tag, className);
    node.textContent = value(content);
    parent.appendChild(node);
    return node;
  }

  function safeUrl(url) {
    var source = value(url).trim();

    return (
      source.indexOf("#") === 0 ||
      /^https?:\/\//i.test(source)
    );
  }

  function domain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
    } catch (error) {
      return "公式サイト";
    }
  }

  function body(parent, content) {
    if (!content) return;

    var node = el("div", "body-text");
    var source = value(content);
    var pattern = /(https?:\/\/[^\s]+)/gi;
    var last = 0;
    var match;

    while ((match = pattern.exec(source))) {
      node.appendChild(
        document.createTextNode(
          source.slice(last, match.index)
        )
      );

      var url = match[0];
      var ending = "";

      while (/[。、「」』）)】,，.!！?？]$/.test(url)) {
        ending = url.slice(-1) + ending;
        url = url.slice(0, -1);
      }

      if (safeUrl(url)) {
        var link = document.createElement("a");

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = url;

        node.appendChild(link);
      } else {
        node.appendChild(
          document.createTextNode(url)
        );
      }

      if (ending) {
        node.appendChild(
          document.createTextNode(ending)
        );
      }

      last = match.index + match[0].length;
    }

    node.appendChild(
      document.createTextNode(source.slice(last))
    );

    parent.appendChild(node);
  }

  function image(parent, source, alt, className) {
    if (!source) return null;

    var node = el("img", className);

    node.src = source;
    node.alt = alt || "鈴木正人の活動写真";
    node.loading = "lazy";

    node.onerror = function () {
      node.remove();
    };

    parent.appendChild(node);

    return node;
  }

  function button(parent, label, url, primary) {
    if (!url || !safeUrl(url)) return;

    var link = el(
      "a",
      "button" + (primary ? " primary" : "")
    );

    link.href = url;
    link.textContent = label;

    if (url.indexOf("#") !== 0) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    parent.appendChild(link);
  }

  function share(parent) {
    var node = el(
      "button",
      "button share-button"
    );

    node.type = "button";
    node.textContent = "このページをシェア";

    node.onclick = function () {
      var url = D.publicUrl || window.location.href;

      var data = {
        title: value(D.title),
        text: value(D.description),
        url: url
      };

      if (navigator.share) {
        navigator.share(data).catch(
          function () {}
        );

        return;
      }

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        navigator.clipboard.writeText(url).then(
          function () {
            node.textContent =
              "リンクをコピーしました";

            setTimeout(function () {
              node.textContent =
                "このページをシェア";
            }, 2200);
          }
        );

        return;
      }

      window.prompt(
        "下のURLをコピーしてください",
        url
      );
    };

    parent.appendChild(node);
  }

  function section(id, kicker, title) {
    var root = el("section", "section");

    root.id = id;

    var heading = el(
      "div",
      "section-heading"
    );

    text(
      heading,
      "p",
      "section-kicker",
      kicker
    );

    text(
      heading,
      "h2",
      "section-title",
      title
    );

    root.appendChild(heading);

    document
      .getElementById("app")
      .appendChild(root);

    return root;
  }

  function featureSection(
    id,
    kicker,
    title,
    source,
    alt,
    reverse
  ) {
    var root = section(
      id,
      kicker,
      title
    );

    var layout = el(
      "div",
      "feature-layout" +
        (reverse ? " reverse" : "")
    );

    var media = el(
      "div",
      "feature-media"
    );

    var content = el(
      "div",
      "feature-content"
    );

    image(
      media,
      source,
      alt,
      "feature-image"
    );

    layout.appendChild(media);
    layout.appendChild(content);
    root.appendChild(layout);

    return {
      root: root,
      content: content
    };
  }

  function photoRail(parent, list, start) {
    var images = (list || [])
      .filter(Boolean)
      .slice(start || 0);

    if (!images.length) return;

    var rail = el(
      "div",
      "photo-rail"
    );

    images.forEach(function (source, index) {
      var figure = el("figure");

      image(
        figure,
        source,
        "活動報告写真" + (index + 1),
        ""
      );

      text(
        figure,
        "figcaption",
        "",
        "活動写真 " + (index + 1)
      );

      rail.appendChild(figure);
    });

    parent.appendChild(rail);
  }

  function youtubeUrl(url) {
    var match = value(url).match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );

    return match
      ? "https://www.youtube.com/embed/" +
          match[1]
      : "";
  }

  function youtube(parent, url) {
    var embed = youtubeUrl(url);

    if (!embed) return;

    text(
      parent,
      "h3",
      "",
      "活動報告動画"
    );

    var box = el("div", "video");
    var iframe = document.createElement(
      "iframe"
    );

    iframe.src = embed;
    iframe.title = "活動報告動画";
    iframe.loading = "lazy";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    box.appendChild(iframe);
    parent.appendChild(box);
  }

  function socialInfo(url) {
    var source = value(url).toLowerCase();

    if (source.indexOf("facebook.com") >= 0) {
      return {
        name: "Facebook（フェイスブック）",
        icon: "f",
        css: "facebook"
      };
    }

    if (source.indexOf("instagram.com") >= 0) {
      return {
        name: "Instagram（インスタグラム）",
        icon: "◎",
        css: "instagram"
      };
    }

    if (
      source.indexOf("twitter.com") >= 0 ||
      source.indexOf("x.com") >= 0
    ) {
      return {
        name: "X（旧Twitter）",
        icon: "X",
        css: "x"
      };
    }

    if (
      source.indexOf("youtube.com") >= 0 ||
      source.indexOf("youtu.be") >= 0
    ) {
      return {
        name: "YouTube",
        icon: "▶",
        css: "youtube"
      };
    }

    if (source.indexOf("ameblo.jp") >= 0) {
      return {
        name: "アメブロ",
        icon: "A",
        css: "ameblo"
      };
    }

    if (source.indexOf("line.me") >= 0) {
      return {
        name: "公式LINE",
        icon: "L",
        css: "line"
      };
    }

    if (source.indexOf("tiktok.com") >= 0) {
      return {
        name: "TikTok",
        icon: "♪",
        css: "other"
      };
    }

    if (source.indexOf("note.com") >= 0) {
      return {
        name: "note",
        icon: "n",
        css: "other"
      };
    }

    return {
      name: "公式SNSリンク",
      icon: "↗",
      css: "other"
    };
  }

  function socialCard(
    parent,
    name,
    url,
    icon,
    css
  ) {
    if (!url || !safeUrl(url)) return;

    var link = el(
      "a",
      "social-card " + css
    );

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    text(
      link,
      "span",
      "social-icon",
      icon
    );

    var copy = el(
      "span",
      "social-text"
    );

    text(
      copy,
      "strong",
      "social-name",
      name
    );

    text(
      copy,
      "small",
      "social-url",
      domain(url)
    );

    link.appendChild(copy);
    parent.appendChild(link);
  }

  function renderHero() {
    var root = el(
      "section",
      "hero"
    );

    var inner = el(
      "div",
      "hero-inner"
    );

    var copy = el(
      "div",
      "hero-copy"
    );

    var visual = el(
      "div",
      "hero-visual"
    );

    text(
      copy,
      "p",
      "hero-kicker",
      "埼玉県議会議員・鈴木正人"
    );

    text(
      copy,
      "h2",
      "hero-name",
      D.politician
        ? D.politician.name
        : D.title
    );

    if (D.politician) {
      text(
        copy,
        "p",
        "hero-role",
        [
          D.politician.role,
          D.politician.area
        ]
          .filter(Boolean)
          .join("｜")
      );
    }

    text(
      copy,
      "p",
      "hero-lead",
      D.appeal || D.description
    );

    var nav = el(
      "nav",
      "page-nav"
    );

    button(
      nav,
      "活動報告",
      "#activity",
      false
    );

    button(
      nav,
      "プロフィール",
      "#profile",
      false
    );

    button(
      nav,
      "政策・活動",
      "#policy",
      false
    );

    button(
      nav,
      "市民相談",
      "#consultation",
      false
    );

    button(
      nav,
      "公式サイト",
      D.officialSite,
      true
    );

    share(nav);
    copy.appendChild(nav);

    var main = el(
      "figure",
      "hero-photo-main"
    );

    image(
      main,
      (
        D.politician &&
        D.politician.image
      ) || photos[0],
      "鈴木正人の活動写真",
      ""
    );

    visual.appendChild(main);

    if (photos[1]) {
      var sub = el(
        "figure",
        "hero-photo-sub"
      );

      image(
        sub,
        photos[1],
        "鈴木正人の活動写真",
        ""
      );

      visual.appendChild(sub);
    }

    text(
      visual,
      "p",
      "photo-note",
      "地域の声を県政へ"
    );

    inner.appendChild(copy);
    inner.appendChild(visual);
    root.appendChild(inner);

    document
      .getElementById("app")
      .appendChild(root);
  }

  function renderProfile() {
    if (!D.politician) return;

    var block = featureSection(
      "profile",
      "PROFILE",
      "プロフィール",
      D.politician.image ||
        photos[0],
      "鈴木正人のプロフィール写真",
      false
    );

    text(
      block.content,
      "h3",
      "",
      D.politician.name
    );

    text(
      block.content,
      "p",
      "hero-role",
      [
        D.politician.role,
        D.politician.area
      ]
        .filter(Boolean)
        .join("｜")
    );

    body(
      block.content,
      D.politician.profile
    );

    photoRail(
      block.root,
      photos,
      2
    );
  }

  function renderActivity() {
    if (!D.article) return;

    var articlePhotos = (
      D.articleImages || photos
    )
      .filter(Boolean);

    var block = featureSection(
      "activity",
      "ACTIVITY REPORT",
      "活動報告",
      articlePhotos[2] ||
        articlePhotos[0] ||
        photos[0],
      "活動報告の代表写真",
      true
    );

    text(
      block.content,
      "div",
      "feature-date",
      D.article.date
    );

    text(
      block.content,
      "h3",
      "",
      D.article.title
    );

    body(
      block.content,
      D.article.body
    );

    youtube(
      block.content,
      D.article.youtube ||
        D.youtube
    );

    photoRail(
      block.root,
      articlePhotos,
      3
    );
  }

  function renderPolicy() {
    if (!D.politician) return;

    var block = featureSection(
      "policy",
      "POLICY",
      "政策・活動の柱",
      photos[3] ||
        photos[0],
      "地域活動の写真",
      false
    );

    var list = el(
      "ul",
      "policy-list"
    );

    value(D.politician.policy)
      .split(/\\n|\n/)
      .filter(Boolean)
      .forEach(function (line) {
        text(
          list,
          "li",
          "",
          line
            .replace(/^・/, "")
            .trim()
        );
      });

    block.content.appendChild(list);
  }

  function renderConsultation() {
    var block = featureSection(
      "consultation",
      "CONSULTATION",
      "市民相談",
      photos[4] ||
        photos[0],
      "地域の声を聞く活動",
      true
    );

    var box = el(
      "div",
      "contact-box"
    );

    body(
      box,
      (
        D.politician &&
        D.politician.consultation
      ) || D.contact
    );

    button(
      box,
      "お問い合わせページを開く",
      D.contactUrl ||
        "https://masato.trans.ne.jp/?page_id=47",
      true
    );

    block.content.appendChild(box);
  }

  function renderSocial() {
    var root = section(
      "social",
      "OFFICIAL / SNS",
      "公式サイト・SNS"
    );

    var layout = el(
      "div",
      "social-layout"
    );

    var visual = el(
      "div",
      "social-visual"
    );

    var copy = el(
      "div",
      "social-content"
    );

    image(
      visual,
      photos[5] ||
        photos[0],
      "鈴木正人の活動写真",
      "social-image"
    );

    layout.appendChild(visual);

    text(
      copy,
      "p",
      "social-lead",
      "公式ホームページやSNSから、最新の活動をご覧いただけます。"
    );

    var grid = el(
      "div",
      "social-grid"
    );

    socialCard(
      grid,
      "公式ホームページ",
      D.officialSite,
      "Web",
      "other"
    );

    (D.sns || [])
      .filter(Boolean)
      .forEach(function (url) {
        var info = socialInfo(url);

        socialCard(
          grid,
          info.name,
          url,
          info.icon,
          info.css
        );
      });

    if (
      D.youtube &&
      !(D.sns || []).some(
        function (url) {
          return socialInfo(url).css === "youtube";
        }
      )
    ) {
      socialCard(
        grid,
        "YouTube",
        D.youtube,
        "▶",
        "youtube"
      );
    }

    socialCard(
      grid,
      "お問い合わせページ",
      D.contactUrl ||
        "https://masato.trans.ne.jp/?page_id=47",
      "✉",
      "other"
    );

    copy.appendChild(grid);
    layout.appendChild(copy);
    root.appendChild(layout);
  }

  function render() {
    var app = document.getElementById("app");
    var title = document.getElementById("siteTitle");

    if (!app || !title) return;

    app.innerHTML = "";
    title.textContent = value(D.title);

    renderHero();
    renderActivity();
    renderProfile();
    renderPolicy();
    renderConsultation();
    renderSocial();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      render
    );
  } else {
    render();
  }
})();
