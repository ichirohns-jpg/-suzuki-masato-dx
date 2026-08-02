(function () {
  "use strict";

  var D = window.DX_DATA || {};

  function createElement(tag, className) {
    var element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    return element;
  }

  function value(text) {
    return text == null ? "" : String(text);
  }

  function addText(parent, tag, className, content) {
    var element = createElement(tag, className);
    element.textContent = value(content);
    parent.appendChild(element);
    return element;
  }

  function isSafeUrl(url) {
    var text = value(url).trim();

    return (
      text.indexOf("#") === 0 ||
      /^https?:\/\//i.test(text)
    );
  }

  function addLinkedText(parent, content) {
    var text = value(content);
    var urlPattern = /(https?:\/\/[^\s]+)/gi;
    var lastIndex = 0;
    var match;

    while ((match = urlPattern.exec(text)) !== null) {
      var before = text.slice(lastIndex, match.index);

      if (before) {
        parent.appendChild(
          document.createTextNode(before)
        );
      }

      var url = match[0];
      var ending = "";

      while (/[。、「」』）)】,，.!！?？]$/.test(url)) {
        ending = url.slice(-1) + ending;
        url = url.slice(0, -1);
      }

      if (isSafeUrl(url)) {
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

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parent.appendChild(
        document.createTextNode(text.slice(lastIndex))
      );
    }
  }

  function addBody(parent, content) {
    if (!content) return;

    var element = createElement("div", "body-text");

    addLinkedText(element, content);
    parent.appendChild(element);
  }

  function addButton(parent, label, url, secondary) {
    if (!url || !isSafeUrl(url)) return;

    var link = createElement(
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
    var button = createElement(
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
        navigator.share(shareData).catch(function () {});
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

  function addGallery(parent, images) {
    var list = (images || []).filter(Boolean);

    if (!list.length) return;

    var gallery = createElement("div", "gallery");

    list.forEach(function (source, index) {
      var figure = document.createElement("figure");
      var image = document.createElement("img");

      image.src = source;
      image.alt =
        "鈴木正人の活動写真" + (index + 1);
      image.loading = "lazy";

      image.onerror = function () {
        figure.remove();
      };

      figure.appendChild(image);

      var caption = createElement("figcaption");
      caption.textContent =
        "活動写真 " + (index + 1);

      figure.appendChild(caption);
      gallery.appendChild(figure);
    });

    parent.appendChild(gallery);
  }

  function addSection(title, id) {
    var section = createElement("section", "section");

    if (id) {
      section.id = id;
    }

    addText(section, "h2", "", title);

    document
      .getElementById("app")
      .appendChild(section);

    return section;
  }

  function youtubeEmbedUrl(url) {
    var text = value(url).trim();

    var match = text.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );

    return match
      ? "https://www.youtube.com/embed/" + match[1]
      : "";
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

    var video = createElement("div", "video");

    video.style.position = "relative";
    video.style.paddingTop = "56.25%";
    video.style.overflow = "hidden";
    video.style.borderRadius = "14px";

    var iframe = document.createElement("iframe");

    iframe.src = embedUrl;
    iframe.title = "活動報告動画";
    iframe.loading = "lazy";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    iframe.style.position = "absolute";
    iframe.style.inset = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";

    video.appendChild(iframe);
    parent.appendChild(video);
  }

  function addPolicySection(politician) {
    var policySection =
      addSection("政策・活動の柱");

    var lines = value(politician.policy)
      .split(/\\n|\n/)
      .map(function (line) {
        return line
          .replace(/^・/, "")
          .trim();
      })
      .filter(Boolean);

    if (!lines.length) return;

    var list = createElement(
      "ul",
      "policy-list"
    );

    lines.forEach(function (line) {
      addText(list, "li", "", line);
    });

    policySection.appendChild(list);
  }

  function render() {
    var titleElement =
      document.getElementById("siteTitle");

    var app =
      document.getElementById("app");

    if (!titleElement || !app) return;

    titleElement.textContent = value(D.title);

    var hero = createElement("section", "hero");

    addText(hero, "h2", "", D.title);
    addText(hero, "p", "", D.description);

    if (D.appeal) {
      addText(
        hero,
        "div",
        "appeal",
        D.appeal
      );
    }

    var navigation =
      createElement("div", "buttons");

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

    hero.appendChild(navigation);
    app.appendChild(hero);

    addGallery(hero, D.commonImages);

    if (D.politician) {
      var profile =
        addSection("プロフィール", "profile");

      addText(
        profile,
        "h3",
        "",
        D.politician.name
      );

      addText(
        profile,
        "div",
        "meta",
        [
          D.politician.role,
          D.politician.area
        ]
          .filter(Boolean)
          .join("｜")
      );

      addBody(
        profile,
        D.politician.profile
      );
    }

    if (D.restaurant) {
      var restaurant =
        addSection("店舗情報", "profile");

      addText(
        restaurant,
        "h3",
        "",
        D.restaurant.name
      );

      addBody(
        restaurant,
        D.restaurant.catchCopy
      );

      addBody(
        restaurant,
        D.restaurant.address
      );

      addBody(
        restaurant,
        D.restaurant.hours
      );

      addBody(
        restaurant,
        D.restaurant.menu
      );

      addGallery(
        restaurant,
        [D.restaurant.image]
      );
    }

    if (D.article) {
      var article =
        addSection("活動報告", "activity");

      addText(
        article,
        "div",
        "meta",
        D.article.date
      );

      addText(
        article,
        "h3",
        "",
        D.article.title
      );

      addBody(
        article,
        D.article.body
      );

      addGallery(
        article,
        D.articleImages
      );

      addYouTube(
        article,
        D.article.youtube
      );
    }

    if (D.politician) {
      addPolicySection(D.politician);

      var consultation =
        addSection("市民相談");

      addBody(
        consultation,
        D.politician.consultation ||
          D.contact
      );

      addButton(
        consultation,
        "お問い合わせページを開く",
        D.contactUrl ||
          "https://masato.trans.ne.jp/?page_id=47",
        false
      );
    }

    var links =
      addSection("公式サイト・SNS");

    addButton(
      links,
      "公式ホームページ",
      D.officialSite,
      false
    );

    (D.sns || []).forEach(function (
      url,
      index
    ) {
      addButton(
        links,
        "SNS " + (index + 1),
        url,
        true
      );
    });

    addButton(
      links,
      "お問い合わせページ",
      D.contactUrl ||
        "https://masato.trans.ne.jp/?page_id=47",
      false
    );

    addYouTube(links, D.youtube);
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
