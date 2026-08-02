(function () {
  "use strict";

  var D = window.DX_DATA || {};

  function value(text) {
    return text == null ? "" : String(text);
  }

  function el(tag, className) {
    var element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    return element;
  }

  function addText(parent, tag, className, content) {
    var element = el(tag, className);

    element.textContent = value(content);
    parent.appendChild(element);

    return element;
  }

  function safeUrl(url) {
    var text = value(url).trim();

    return (
      text.indexOf("#") === 0 ||
      /^https?:\/\//i.test(text)
    );
  }

  function domain(url) {
    try {
      return new URL(url).hostname
        .replace(/^www\./i, "");
    } catch (error) {
      return "";
    }
  }

  function addLinkedText(parent, content) {
    var text = value(content);
    var pattern = /(https?:\/\/[^\s]+)/gi;
    var lastIndex = 0;
    var match;

    while ((match = pattern.exec(text)) !== null) {
      var before = text.slice(
        lastIndex,
        match.index
      );

      if (before) {
        parent.appendChild(
          document.createTextNode(before)
        );
      }

      var url = match[0];
      var ending = "";

      while (
        /[。、「」』）)】,，.!！?？]$/.test(url)
      ) {
        ending = url.slice(-1) + ending;
        url = url.slice(0, -1);
      }

      if (safeUrl(url)) {
        var link = document.createElement("a");

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = url;

        parent.appendChild(link);
      } else {
        parent.appendChild(
          document.createTextNode(url)
        );
      }

      if (ending) {
        parent.appendChild(
          document.createTextNode(ending)
        );
      }

      lastIndex =
        match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parent.appendChild(
        document.createTextNode(
          text.slice(lastIndex)
        )
      );
    }
  }

  function addBody(parent, content) {
    if (!content) return;

    var body = el("div", "body-text");

    addLinkedText(body, content);
    parent.appendChild(body);
  }

  function addButton(parent, label, url, secondary) {
    if (!url || !safeUrl(url)) return;

    var link = el(
      "a",
      "button" + (secondary ? " sub" : "")
    );

    link.href = url;
    link.textContent = label;

    if (url.indexOf("#") !== 0) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    parent.appendChild(link);
  }

  function addShareButton(parent) {
    var button = el(
      "button",
      "button share-button"
    );

    button.type = "button";
    button.textContent = "このページをシェア";

    button.addEventListener("click", function () {
      var shareUrl =
        D.publicUrl ||
        window.location.href;

      var shareData = {
        title: value(D.title),
        text: value(D.description),
        url: shareUrl
      };

      if (navigator.share) {
        navigator.share(shareData).catch(
          function () {}
        );
        return;
      }

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(function () {
            button.textContent =
              "リンクをコピーしました";

            setTimeout(function () {
              button.textContent =
                "このページをシェア";
            }, 2200);
          });

        return;
      }

      window.prompt(
        "下のURLをコピーしてください",
        shareUrl
      );
    });

    parent.appendChild(button);
  }

  function addImage(
    parent,
    source,
    alt,
    className
  ) {
    if (!source) return null;

    var image = el("img", className);

    image.src = source;
    image.alt = alt || "鈴木正人の活動写真";
    image.loading = "lazy";

    image.onerror = function () {
      image.remove();
    };

    parent.appendChild(image);

    return image;
  }

  function addHeroCollage(parent, images) {
    var list = (images || []).filter(Boolean);

    if (!list.length) return;

    var collage = el("div", "hero-collage");

    list.slice(0, 6).forEach(function (
      source,
      index
    ) {
      var figure = el(
        "figure",
        "hero-photo hero-photo-" +
          (index + 1)
      );

      var image = el("img");

      image.src = source;
      image.alt =
        "鈴木正人の活動写真" +
        (index + 1);
      image.loading = "lazy";

      image.onerror = function () {
        figure.remove();
      };

      figure.appendChild(image);
      collage.appendChild(figure);
    });

    parent.appendChild(collage);
  }

  function addGallery(parent, images) {
    var list = (images || []).filter(Boolean);

    if (!list.length) return;

    var gallery = el("div", "gallery");

    list.forEach(function (source, index) {
      var figure = el("figure");
      var image = el("img");

      image.src = source;
      image.alt =
        "活動報告写真" + (index + 1);
      image.loading = "lazy";

      image.onerror = function () {
        figure.remove();
      };

      figure.appendChild(image);

      var caption = el("figcaption");

      caption.textContent =
        "活動写真 " + (index + 1);

      figure.appendChild(caption);
      gallery.appendChild(figure);
    });

    parent.appendChild(gallery);
  }

  function addSection(title, id) {
    var section = el("section", "section");

    if (id) {
      section.id = id;
    }

    addText(section, "h2", "", title);

    document
      .getElementById("app")
      .appendChild(section);

    return section;
  }

  function addPersonProfile(politician) {
    var section = addSection(
      "プロフィール",
      "profile"
    );

    var layout = el(
      "div",
      "profile-layout"
    );

    var visual = el(
      "div",
      "profile-visual"
    );

    var photoWrap = el(
      "figure",
      "person-photo-wrap"
    );

    addImage(
      photoWrap,
      politician.image ||
        (D.commonImages || [])[0],
      "鈴木正人のプロフィール写真",
      "person-photo"
    );

    visual.appendChild(photoWrap);

    var mini = el(
      "div",
      "profile-mini-gallery"
    );

    (D.commonImages || [])
      .slice(1, 4)
      .forEach(function (source, index) {
        addImage(
          mini,
          source,
          "活動写真" + (index + 2),
          ""
        );
      });

    if (mini.children.length) {
      visual.appendChild(mini);
    }

    layout.appendChild(visual);

    var text = el(
      "div",
      "profile-copy"
    );

    addText(
      text,
      "h3",
      "",
      politician.name
    );

    addText(
      text,
      "div",
      "meta",
      [
        politician.role,
        politician.area
      ]
        .filter(Boolean)
        .join("｜")
    );

    addBody(text, politician.profile);

    layout.appendChild(text);
    section.appendChild(layout);
  }

  function addActivity(article) {
    var section = addSection(
      "活動報告",
      "activity"
    );

    addText(
      section,
      "div",
      "meta",
      article.date
    );

    addText(
      section,
      "h3",
      "",
      article.title
    );

    addBody(section, article.body);

    var images =
      (D.articleImages || []).filter(Boolean);

    if (images.length) {
      var feature = el(
        "div",
        "activity-feature"
      );

      addImage(
        feature,
        images[0],
        "活動報告の代表写真",
        ""
      );

      section.appendChild(feature);

      addGallery(
        section,
        images.slice(1)
      );
    }

    addYouTube(
      section,
      article.youtube
    );
  }

  function addPolicy(politician) {
    var lines = value(
      politician.policy
    )
      .split(/\\n|\n/)
      .map(function (line) {
        return line
          .replace(/^・/, "")
          .trim();
      })
      .filter(Boolean);

    if (!lines.length) return;

    var section = addSection(
      "政策・活動の柱"
    );

    var list = el(
      "ul",
      "policy-list"
    );

    lines.forEach(function (line) {
      addText(list, "li", "", line);
    });

    section.appendChild(list);
  }

  function addConsultation() {
    var section = addSection(
      "市民相談"
    );

    var box = el(
      "div",
      "consultation-box"
    );

    addBody(
      box,
      D.politician &&
        D.politician.consultation ||
        D.contact
    );

    addButton(
      box,
      "お問い合わせページを開く",
      D.contactUrl ||
        "https://masato.trans.ne.jp/?page_id=47",
      false
    );

    section.appendChild(box);
  }

  function socialInfo(url) {
    var text = value(url).toLowerCase();

    if (text.indexOf("facebook.com") >= 0) {
      return {
        name: "Facebook（フェイスブック）",
        shortName: "Facebook",
        icon: "f",
        className: "facebook"
      };
    }

    if (
      text.indexOf("instagram.com") >= 0
    ) {
      return {
        name: "Instagram（インスタグラム）",
        shortName: "Instagram",
        icon: "◎",
        className: "instagram"
      };
    }

    if (
      text.indexOf("twitter.com") >= 0 ||
      text.indexOf("x.com") >= 0
    ) {
      return {
        name: "X（旧Twitter）",
        shortName: "X",
        icon: "X",
        className: "x"
      };
    }

    if (
      text.indexOf("youtube.com") >= 0 ||
      text.indexOf("youtu.be") >= 0
    ) {
      return {
        name: "YouTube",
        shortName: "YouTube",
        icon: "▶",
        className: "youtube"
      };
    }

    if (text.indexOf("ameblo.jp") >= 0) {
      return {
        name: "アメブロ",
        shortName: "アメブロ",
        icon: "A",
        className: "ameblo"
      };
    }

    if (text.indexOf("line.me") >= 0) {
      return {
        name: "LINE",
        shortName: "公式LINE",
        icon: "L",
        className: "line"
      };
    }

    if (text.indexOf("tiktok.com") >= 0) {
      return {
        name: "TikTok",
        shortName: "TikTok",
        icon: "♪",
        className: "tiktok"
      };
    }

    if (text.indexOf("note.com") >= 0) {
      return {
        name: "note",
        shortName: "note",
        icon: "n",
        className: "note"
      };
    }

    return {
      name: "公式SNSリンク",
      shortName: domain(url),
      icon: "↗",
      className: "other"
    };
  }

  function addSocialCard(
    parent,
    label,
    url,
    className,
    icon
  ) {
    if (!url || !safeUrl(url)) return;

    var link = el(
      "a",
      "social-card " + className
    );

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    var iconElement = el(
      "span",
      "social-icon"
    );

    iconElement.textContent = icon;
    link.appendChild(iconElement);

    var text = el(
      "span",
      "social-text"
    );

    var name = el(
      "strong",
      "social-name"
    );

    name.textContent = label;
    text.appendChild(name);

    var urlText = el(
      "small",
      "social-url"
    );

    urlText.textContent = domain(url);
    text.appendChild(urlText);

    link.appendChild(text);
    parent.appendChild(link);
  }

  function addSocialSection() {
    var section = addSection(
      "公式サイト・SNS"
    );

    addText(
      section,
      "p",
      "social-lead",
      "公式ホームページやSNSから、最新の活動をご覧いただけます。"
    );

    var grid = el(
      "div",
      "social-grid"
    );

    addSocialCard(
      grid,
      "公式ホームページ",
      D.officialSite,
      "official-card",
      "Web"
    );

    (D.sns || []).forEach(function (url) {
      var info = socialInfo(url);

      addSocialCard(
        grid,
        info.name,
        url,
        info.className,
        info.icon
      );
    });

    if (D.youtube) {
      var youtubeAlready = (
        D.sns || []
      ).some(function (url) {
        return socialInfo(url).className === "youtube";
      });

      if (!youtubeAlready) {
        addSocialCard(
          grid,
          "YouTube",
          D.youtube,
          "youtube",
          "▶"
        );
      }
    }

    addSocialCard(
      grid,
      "お問い合わせページ",
      D.contactUrl ||
        "https://masato.trans.ne.jp/?page_id=47",
      "contact-card",
      "✉"
    );

    section.appendChild(grid);
  }

  function youtubeEmbedUrl(url) {
    var text = value(url).trim();

    var match = text.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );

    if (!match) return "";

    return (
      "https://www.youtube.com/embed/" +
      match[1]
    );
  }

  function addYouTube(parent, url) {
    var embedUrl = youtubeEmbedUrl(url);

    if (!embedUrl) return;

    addText(
      parent,
      "h3",
      "",
      "活動報告動画"
    );

    var video = el(
      "div",
      "video"
    );

    var iframe = document.createElement(
      "iframe"
    );

    iframe.src = embedUrl;
    iframe.title = "活動報告動画";
    iframe.loading = "lazy";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    video.appendChild(iframe);
    parent.appendChild(video);
  }

  function render() {
    var titleElement =
      document.getElementById("siteTitle");

    var app =
      document.getElementById("app");

    if (!titleElement || !app) return;

    app.innerHTML = "";

    titleElement.textContent =
      value(D.title);

    var hero = el(
      "section",
      "hero"
    );

    var heroGrid = el(
      "div",
      "hero-grid"
    );

    var heroCopy = el(
      "div",
      "hero-copy"
    );

    addText(
      heroCopy,
      "h2",
      "",
      D.title
    );

    addText(
      heroCopy,
      "p",
      "",
      D.description
    );

    if (D.appeal) {
      addText(
        heroCopy,
        "div",
        "appeal",
        D.appeal
      );
    }

    var navigation = el(
      "div",
      "buttons"
    );

    addButton(
      navigation,
      "プロフィール",
      "#profile",
      true
    );

    addButton(
      navigation,
      "活動報告",
      "#activity",
      true
    );

    addButton(
      navigation,
      "お問い合わせ",
      D.contactUrl ||
        "https://masato.trans.ne.jp/?page_id=47",
      false
    );

    addShareButton(navigation);

    heroCopy.appendChild(navigation);
    heroGrid.appendChild(heroCopy);

    var collageWrap = el(
      "div",
      "hero-visual"
    );

    addHeroCollage(
      collageWrap,
      D.commonImages
    );

    heroGrid.appendChild(collageWrap);
    hero.appendChild(heroGrid);
    app.appendChild(hero);

    if (D.politician) {
      addPersonProfile(
        D.politician
      );
    }

    if (D.article) {
      addActivity(
        D.article
      );
    }

    if (D.politician) {
      addPolicy(
        D.politician
      );

      addConsultation();
    }

    addSocialSection();
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
