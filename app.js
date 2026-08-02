(function () {
  "use strict";

  var D = window.DX_DATA || {};
  var photos = (D.commonImages || []).filter(Boolean);
  var defaultContact = "https://masato.trans.ne.jp/?page_id=47";

  function value(input) {
    return input == null ? "" : String(input);
  }

  function el(tag, className) {
    var node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    return node;
  }

  function addText(parent, tag, className, content) {
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
      return "公式リンク";
    }
  }

  function addImage(parent, source, alt, className) {
    if (!source) {
      return null;
    }

    var image = el("img", className || "");
    image.src = source;
    image.alt = alt || "鈴木正人の活動写真";
    image.loading = "lazy";

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

  function addLink(parent, label, url, primary) {
    if (!url || !safeUrl(url)) {
      return null;
    }

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
    return link;
  }

  function addBody(parent, content) {
    if (!content) {
      return;
    }

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
        node.appendChild(document.createTextNode(url));
      }

      if (ending) {
        node.appendChild(document.createTextNode(ending));
      }

      last = match.index + match[0].length;
    }

    node.appendChild(
      document.createTextNode(source.slice(last))
    );

    parent.appendChild(node);
  }

  function addShare(parent) {
    var button = el("button", "share-button");
    button.type = "button";
    button.textContent = "このページをシェア";

    button.onclick = function () {
      var url = D.publicUrl || window.location.href;
      var data = {
        title: value(D.title),
        text: value(D.description),
        url: url
      };

      if (navigator.share) {
        navigator.share(data).catch(function () {});
        return;
      }

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        navigator.clipboard.writeText(url).then(function () {
          button.textContent = "リンクをコピーしました";

          window.setTimeout(function () {
            button.textContent = "このページをシェア";
          }, 2200);
        });
        return;
      }

      window.prompt(
        "下のURLをコピーしてください",
        url
      );
    };

    parent.appendChild(button);
  }

  function makeSection(id, kicker, title) {
    var root = el("section", "section");
    root.id = id;

    var heading = el("div", "section-heading");
    addText(heading, "p", "section-kicker", kicker);
    addText(heading, "h2", "section-title", title);
    root.appendChild(heading);

    document.getElementById("app").appendChild(root);
    return root;
  }

  function makeFeature(
    id,
    kicker,
    title,
    source,
    alt,
    reverse
  ) {
    var root = makeSection(id, kicker, title);
    var layout = el(
      "div",
      "feature-layout" + (reverse ? " reverse" : "")
    );
    var media = el("div", "feature-media");
    var content = el("div", "feature-content");

    addImage(media, source, alt, "feature-image");
    layout.appendChild(media);
    layout.appendChild(content);
    root.appendChild(layout);

    return {
      root: root,
      content: content
    };
  }

  function addPhotoRail(parent, list, label) {
    var images = (list || []).filter(Boolean);

    if (!images.length) {
      return;
    }

    var rail = el("div", "photo-rail");

    images.forEach(function (source, index) {
      var figure = el("figure");

      addImage(
        figure,
        source,
        (label || "活動") + "写真" + (index + 1),
        ""
      );

      addText(
        figure,
        "figcaption",
        "",
        (label || "活動写真") + " " + (index + 1)
      );

      rail.appendChild(figure);
    });

    parent.appendChild(rail);
  }

  function youtubeEmbed(url) {
    var match = value(url).match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );

    return match
      ? "https://www.youtube.com/embed/" + match[1]
      : "";
  }

  function addYoutube(parent, url) {
    var embed = youtubeEmbed(url);

    if (!embed) {
      return;
    }

    addText(parent, "h3", "", "活動報告動画");

    var video = el("div", "video");
    var frame = document.createElement("iframe");

    frame.src = embed;
    frame.title = "活動報告動画";
    frame.loading = "lazy";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;

    video.appendChild(frame);
    parent.appendChild(video);
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

    return {
      name: "公式SNSリンク",
      icon: "↗",
      css: "other"
    };
  }

  function addSocialCard(parent, name, url, icon, css) {
    if (!url || !safeUrl(url)) {
      return;
    }

    var link = el("a", "social-card " + css);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    addText(link, "span", "social-icon", icon);

    var copy = el("span", "social-text");
    addText(copy, "strong", "social-name", name);
    addText(copy, "small", "social-url", domain(url));

    link.appendChild(copy);
    parent.appendChild(link);
  }

  function renderHero() {
    var politician = D.politician || {};
    var root = el("section", "hero");
    var inner = el("div", "hero-inner");
    var copy = el("div", "hero-copy");
    var visual = el("div", "hero-visual");
    var heroPhotos = photos.slice(1, 5);

    if (!heroPhotos.length) {
      heroPhotos = photos.slice(0, 4);
    }

    addText(
      copy,
      "p",
      "hero-kicker",
      politician.role || "地域の声を県政へ"
    );

    addText(
      copy,
      "h2",
      "hero-name",
      politician.name || D.title
    );

    addText(
      copy,
      "p",
      "hero-role",
      [politician.area, "活動報告DX"]
        .filter(Boolean)
        .join("｜")
    );

    addText(
      copy,
      "p",
      "hero-lead",
      D.appeal || D.description
    );

    var nav = el("nav", "page-nav");
    addLink(nav, "活動報告", "#activity", false);
    addLink(nav, "プロフィール", "#profile", false);
    addLink(nav, "政策・活動", "#policy", false);
    addLink(nav, "市民相談", "#consultation", false);
    addLink(nav, "公式サイト", D.officialSite, true);
    addShare(nav);
    copy.appendChild(nav);

    var main = el("figure", "hero-photo-main");
    addImage(
      main,
      heroPhotos[0] || photos[0],
      "鈴木正人の活動写真",
      ""
    );
    visual.appendChild(main);

    if (heroPhotos[1]) {
      var sub = el("figure", "hero-photo-sub");
      addImage(
        sub,
        heroPhotos[1],
        "鈴木正人の活動写真",
        ""
      );
      visual.appendChild(sub);
    }

    if (heroPhotos.length > 2) {
      var mini = el("div", "hero-photo-mini");

      heroPhotos.slice(2, 4).forEach(function (source, index) {
        var figure = el("figure");
        addImage(
          figure,
          source,
          "鈴木正人の活動写真" + (index + 3),
          ""
        );
        mini.appendChild(figure);
      });

      visual.appendChild(mini);
    }

    addText(
      visual,
      "p",
      "photo-note",
      "地域の声を県政へ"
    );

    inner.appendChild(copy);
    inner.appendChild(visual);
    root.appendChild(inner);
    document.getElementById("app").appendChild(root);
  }

  function renderActivity() {
    if (!D.article) {
      return;
    }

    var articlePhotos = (
      D.articleImages || photos
    ).filter(Boolean);
    var article = D.article;
    var block = makeFeature(
      "activity",
      "ACTIVITY REPORT",
      "活動報告",
      articlePhotos[0] || photos[0],
      "活動報告の代表写真",
      false
    );

    addText(block.content, "div", "feature-date", article.date);
    addText(block.content, "h3", "", article.title);
    addBody(block.content, article.body);
    addYoutube(
      block.content,
      article.youtube || D.youtube
    );
    addPhotoRail(block.root, articlePhotos, "活動写真");
  }

  function renderProfile() {
    var politician = D.politician;

    if (!politician) {
      return;
    }

    var block = makeFeature(
      "profile",
      "PROFILE",
      "プロフィール",
      politician.image || photos[0],
      "鈴木正人のプロフィール写真",
      true
    );

    addText(block.content, "h3", "", politician.name);
    addText(
      block.content,
      "p",
      "hero-role",
      [politician.role, politician.area]
        .filter(Boolean)
        .join("｜")
    );
    addBody(block.content, politician.profile);
  }

  function renderPolicy() {
    var politician = D.politician;

    if (!politician) {
      return;
    }

    var block = makeFeature(
      "policy",
      "POLICY",
      "政策・活動の柱",
      photos[3] || photos[0],
      "地域活動の写真",
      false
    );
    var list = el("ul", "policy-list");
    var lines = value(politician.policy)
      .split(/\\n|\n/)
      .map(function (line) {
        return line.replace(/^・/, "").trim();
      })
      .filter(Boolean);

    lines.forEach(function (line) {
      addText(list, "li", "", line);
    });

    block.content.appendChild(list);
  }

  function renderConsultation() {
    var politician = D.politician || {};
    var block = makeFeature(
      "consultation",
      "CONSULTATION",
      "市民相談",
      photos[4] || photos[0],
      "地域の声を聞く活動",
      true
    );
    var contact = el("div", "contact-box");

    addBody(
      contact,
      politician.consultation ||
        D.contact ||
        "お問い合わせは公式ホームページからご連絡ください。"
    );

    addLink(
      contact,
      "お問い合わせページを開く",
      D.contactUrl || defaultContact,
      true
    );

    block.content.appendChild(contact);
  }

  function renderSocial() {
    var root = makeSection(
      "social",
      "OFFICIAL / SNS",
      "公式サイト・SNS"
    );
    var layout = el("div", "social-layout");
    var visual = el("div", "social-visual");
    var copy = el("div", "social-content");
    var grid = el("div", "social-grid");

    addImage(
      visual,
      photos[5] || photos[0],
      "鈴木正人の活動写真",
      "social-image"
    );

    addText(
      copy,
      "p",
      "social-lead",
      "公式ホームページやSNSから、最新の活動をご覧いただけます。"
    );

    addSocialCard(
      grid,
      "公式ホームページ",
      D.officialSite,
      "Web",
      "other"
    );

    (D.sns || []).filter(Boolean).forEach(function (url) {
      var info = socialInfo(url);
      addSocialCard(
        grid,
        info.name,
        url,
        info.icon,
        info.css
      );
    });

    if (
      D.youtube &&
      !(D.sns || []).some(function (url) {
        return socialInfo(url).css === "youtube";
      })
    ) {
      addSocialCard(
        grid,
        "YouTube",
        D.youtube,
        "▶",
        "youtube"
      );
    }

    addSocialCard(
      grid,
      "お問い合わせページ",
      D.contactUrl || defaultContact,
      "✉",
      "other"
    );

    copy.appendChild(grid);
    layout.appendChild(visual);
    layout.appendChild(copy);
    root.appendChild(layout);
  }

  function render() {
    var app = document.getElementById("app");
    var title = document.getElementById("siteTitle");

    if (!app || !title) {
      return;
    }

    app.innerHTML = "";
    title.textContent = value(
      D.politician && D.politician.name
        ? D.politician.name
        : D.title
    );

    renderHero();
    renderActivity();
    renderProfile();
    renderPolicy();
    renderConsultation();
    renderSocial();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
