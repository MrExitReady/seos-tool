/* NoteDeck — notes → slides, entirely client-side. */
(function () {
  "use strict";

  var CONFIG = {
    // Replace with your Stripe Payment Link or Gumroad product URL before launch.
    paymentUrl: "REPLACE_WITH_PAYMENT_LINK",
    price: "A$29",
    freeMaxSlides: 8,
    // Must match the salt in generate-keys.mjs. Changing it invalidates all issued keys.
    licenseSalt: "notedeck-v1-7f3k",
    storageKeys: { notes: "notedeck_notes", theme: "notedeck_theme", license: "notedeck_license" }
  };

  var THEMES = [
    { id: "paper",    name: "Paper",    pro: false, swatch: "#fdfcf8", border: "#c9a227" },
    { id: "midnight", name: "Midnight", pro: false, swatch: "#0e1726", border: "#e0b64f" },
    { id: "ocean",    name: "Ocean",    pro: true,  swatch: "linear-gradient(135deg,#0a3d62,#0f62fe)" },
    { id: "sunset",   name: "Sunset",   pro: true,  swatch: "linear-gradient(135deg,#6b1b3f,#f2a541)" },
    { id: "forest",   name: "Forest",   pro: true,  swatch: "#10281c", border: "#4f9d69" },
    { id: "mono",     name: "Mono",     pro: true,  swatch: "#ffffff", border: "#000000" }
  ];

  var EXAMPLE = [
    "# Quarterly Review",
    "Q2 results and what comes next",
    "",
    "## Where we landed",
    "- Revenue up 18% on Q1",
    "- Two new hires in operations",
    "- Churn steady at 2.1%",
    "",
    "## What worked",
    "- The referral program drove 40% of new signups",
    "- Support response time halved",
    "",
    "> The best marketing we did this quarter was answering the phone faster.",
    "",
    "## Focus for Q3",
    "- Launch the annual plan",
    "- Automate onboarding emails",
    "- One pricing experiment, measured properly",
    "",
    "---",
    "Questions?"
  ].join("\n");

  /* ---------------- License ---------------- */

  var KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

  function keyHash(body) {
    var s = CONFIG.licenseSalt + body;
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    var out = "";
    for (var j = 0; j < 5; j++) {
      out += KEY_ALPHABET[h % KEY_ALPHABET.length];
      h = Math.imul(h ^ (h >>> 7), 0x01000193) >>> 0;
    }
    return out;
  }

  function validateKey(raw) {
    var k = (raw || "").toUpperCase().replace(/\s+/g, "");
    var m = k.match(/^NDK-([A-Z2-9]{5})-([A-Z2-9]{5})-([A-Z2-9]{5})$/);
    return !!(m && keyHash(m[1] + m[2]) === m[3]);
  }

  function isPro() {
    return validateKey(localStorage.getItem(CONFIG.storageKeys.license));
  }

  /* ---------------- Parser ---------------- */

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(s) {
    return escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  // Returns an array of slide objects: { type, title, subtitle, blocks }
  function parseNotes(text) {
    var lines = text.replace(/\r\n?/g, "\n").split("\n");
    var hasStructure = lines.some(function (l) {
      return /^#{1,2}\s/.test(l) || /^---\s*$/.test(l);
    });
    return hasStructure ? parseStructured(lines) : parsePlain(text);
  }

  function parseStructured(lines) {
    var slides = [];
    var cur = null;

    function push() { if (cur) slides.push(cur); cur = null; }
    function ensure() { if (!cur) cur = { type: "content", title: "", blocks: [] }; return cur; }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/^---\s*$/.test(line)) { push(); continue; }
      var h1 = line.match(/^#\s+(.*)/);
      var h2 = line.match(/^##\s+(.*)/);
      if (h1) { push(); cur = { type: "title", title: h1[1].trim(), subtitle: "", blocks: [] }; continue; }
      if (h2) { push(); cur = { type: "content", title: h2[1].trim(), blocks: [] }; continue; }
      if (!line.trim()) continue;
      addLine(ensure(), line);
    }
    push();
    return slides.length ? slides : [emptySlide()];
  }

  function parsePlain(text) {
    var chunks = text.split(/\n\s*\n/).map(function (c) { return c.trim(); }).filter(Boolean);
    if (!chunks.length) return [emptySlide()];
    return chunks.map(function (chunk, idx) {
      var ls = chunk.split("\n");
      if (ls.length === 1) {
        var s = { type: "statement", title: "", blocks: [] };
        addLine(s, ls[0]);
        return s;
      }
      var slide = {
        type: idx === 0 ? "title" : "content",
        title: ls[0].replace(/:\s*$/, "").trim(),
        subtitle: "",
        blocks: []
      };
      var rest = ls.slice(1);
      if (idx === 0 && rest.length === 1 && !/^[-*>]|\d+\./.test(rest[0].trim())) {
        slide.subtitle = rest[0].trim();
        return slide;
      }
      rest.forEach(function (l) { if (l.trim()) addLine(slide, l); });
      return slide;
    });
  }

  function addLine(slide, line) {
    var t = line.trim();
    var bullet = t.match(/^[-*]\s+(.*)/);
    var num = t.match(/^\d+[.)]\s+(.*)/);
    var quote = t.match(/^>\s+(.*)/);
    var blocks = slide.blocks;
    var last = blocks[blocks.length - 1];

    if (bullet) {
      if (!last || last.kind !== "ul") { last = { kind: "ul", items: [] }; blocks.push(last); }
      last.items.push(bullet[1]);
    } else if (num) {
      if (!last || last.kind !== "ol") { last = { kind: "ol", items: [] }; blocks.push(last); }
      last.items.push(num[1]);
    } else if (quote) {
      blocks.push({ kind: "quote", text: quote[1] });
    } else if (slide.type === "title" && !slide.subtitle && !blocks.length) {
      slide.subtitle = t;
    } else {
      blocks.push({ kind: "p", text: t });
    }
  }

  function emptySlide() {
    return {
      type: "title",
      title: "Your deck appears here",
      subtitle: "Start typing your notes on the left",
      blocks: []
    };
  }

  /* ---------------- Rendering ---------------- */

  function slideElement(slide, themeId, watermarked) {
    var el = document.createElement("div");
    var cls = "slide theme-" + themeId;
    if (slide.type === "title") cls += " title-slide";
    if (slide.type === "statement") cls += " statement-slide";
    el.className = cls;

    var html = '<div class="accent-bar"></div>';
    if (slide.type === "title") {
      html += "<h1>" + inline(slide.title) + "</h1>";
      if (slide.subtitle) html += '<p class="subtitle">' + inline(slide.subtitle) + "</p>";
    } else if (slide.title) {
      html += "<h2>" + inline(slide.title) + "</h2>";
    }
    slide.blocks.forEach(function (b) {
      if (b.kind === "ul" || b.kind === "ol") {
        var tag = b.kind;
        html += "<" + tag + ">" + b.items.map(function (it) { return "<li>" + inline(it) + "</li>"; }).join("") + "</" + tag + ">";
      } else if (b.kind === "quote") {
        html += "<blockquote>" + inline(b.text) + "</blockquote>";
      } else {
        html += "<p>" + inline(b.text) + "</p>";
      }
    });
    if (watermarked) html += '<div class="watermark">Made with NoteDeck</div>';
    el.innerHTML = html;
    return el;
  }

  function upgradeSlide(hiddenCount) {
    return {
      type: "content",
      title: "+" + hiddenCount + " more slide" + (hiddenCount === 1 ? "" : "s"),
      blocks: [
        { kind: "p", text: "The free plan shows the first " + CONFIG.freeMaxSlides + " slides of a deck." },
        { kind: "ul", items: ["**NoteDeck Pro** unlocks unlimited slides, all themes and badge-free exports", "One-time payment of " + CONFIG.price + " — no subscription"] }
      ]
    };
  }

  /* ---------------- App state & DOM ---------------- */

  var $ = function (id) { return document.getElementById(id); };
  var notesEl = $("notes"), stage = $("stage"), counter = $("counter"), proHint = $("proHint");
  var presenter = $("presenter"), presenterStage = $("presenterStage"), presenterCounter = $("presenterCounter");

  var state = {
    slides: [emptySlide()],
    index: 0,
    theme: localStorage.getItem(CONFIG.storageKeys.theme) || "paper",
    presenting: false
  };

  function effectiveDeck() {
    var slides = state.slides.slice();
    var truncated = false;
    if (!isPro() && slides.length > CONFIG.freeMaxSlides) {
      var hidden = slides.length - CONFIG.freeMaxSlides;
      slides = slides.slice(0, CONFIG.freeMaxSlides);
      slides.push(upgradeSlide(hidden));
      truncated = true;
    }
    return { slides: slides, truncated: truncated };
  }

  function fitSlide(el, container) {
    var scale = container.clientWidth / 1280;
    el.style.transform = "scale(" + scale + ")";
  }

  function renderStage() {
    var deck = effectiveDeck();
    if (state.index >= deck.slides.length) state.index = deck.slides.length - 1;
    if (state.index < 0) state.index = 0;

    var target = state.presenting ? presenterStage : stage;
    target.innerHTML = "";
    var el = slideElement(deck.slides[state.index], state.theme, !isPro());
    target.appendChild(el);

    if (state.presenting) {
      // Center and letterbox within the fullscreen viewport.
      var scale = Math.min(target.clientWidth / 1280, target.clientHeight / 720);
      el.style.transformOrigin = "center center";
      el.style.left = "50%";
      el.style.top = "50%";
      el.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
      el.style.position = "absolute";
      el.style.inset = "auto";
      presenterCounter.textContent = (state.index + 1) + " / " + deck.slides.length;
    } else {
      fitSlide(el, stage);
      counter.textContent = (state.index + 1) + " / " + deck.slides.length;
    }

    proHint.innerHTML = isPro()
      ? "✓ Pro active — all themes, unlimited slides, no badge."
      : (deck.truncated
          ? "Free plan shows the first " + CONFIG.freeMaxSlides + ' slides. <a href="#pricing">Go Pro</a> for unlimited.'
          : 'Free plan: 2 themes, up to ' + CONFIG.freeMaxSlides + ' slides, small badge on slides. <a href="#pricing">Go Pro</a> to unlock everything.');
  }

  function renderThemePicker() {
    var picker = $("themePicker");
    picker.innerHTML = "";
    THEMES.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "theme-dot" + (t.id === state.theme ? " active" : "");
      b.title = t.name + (t.pro && !isPro() ? " (Pro)" : "");
      b.setAttribute("aria-label", b.title);
      b.style.background = t.swatch;
      if (t.border) b.style.boxShadow = "inset 0 0 0 3px " + t.border;
      if (t.pro && !isPro()) b.innerHTML = '<span class="lock">🔒</span>';
      b.addEventListener("click", function () {
        if (t.pro && !isPro()) {
          openLicenseModal("The “" + t.name + "” theme is part of NoteDeck Pro. Enter a key, or get one below.");
          return;
        }
        state.theme = t.id;
        localStorage.setItem(CONFIG.storageKeys.theme, t.id);
        renderThemePicker();
        renderStage();
      });
      picker.appendChild(b);
    });
  }

  function reparse() {
    state.slides = parseNotes(notesEl.value);
    localStorage.setItem(CONFIG.storageKeys.notes, notesEl.value);
    renderStage();
  }

  /* ---------------- Navigation & presenting ---------------- */

  function move(delta) {
    var len = effectiveDeck().slides.length;
    state.index = Math.max(0, Math.min(len - 1, state.index + delta));
    renderStage();
  }

  function startPresenting() {
    state.presenting = true;
    presenter.hidden = false;
    if (presenter.requestFullscreen) presenter.requestFullscreen().catch(function () {});
    renderStage();
  }

  function stopPresenting() {
    state.presenting = false;
    presenter.hidden = true;
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    renderStage();
  }

  /* ---------------- PDF export ---------------- */

  function exportPdf() {
    var deck = effectiveDeck();
    var printDeck = $("printDeck");
    printDeck.innerHTML = "";
    deck.slides.forEach(function (s) {
      var page = document.createElement("div");
      page.className = "print-page";
      page.appendChild(slideElement(s, state.theme, !isPro()));
      printDeck.appendChild(page);
    });
    window.print();
  }

  /* ---------------- License modal ---------------- */

  function openLicenseModal(msg) {
    $("licenseModal").hidden = false;
    var m = $("licenseMsg");
    m.textContent = msg || "";
    m.className = "license-msg";
    $("licenseInput").focus();
  }

  function closeLicenseModal() { $("licenseModal").hidden = true; }

  function activate() {
    var input = $("licenseInput").value;
    var m = $("licenseMsg");
    if (validateKey(input)) {
      localStorage.setItem(CONFIG.storageKeys.license, input.toUpperCase().replace(/\s+/g, ""));
      m.textContent = "✓ Pro activated. Enjoy!";
      m.className = "license-msg ok";
      renderThemePicker();
      renderStage();
      setTimeout(closeLicenseModal, 900);
    } else {
      m.textContent = "That key doesn’t look valid — check for typos and try again.";
      m.className = "license-msg err";
    }
  }

  /* ---------------- Wire-up ---------------- */

  function init() {
    var saved = localStorage.getItem(CONFIG.storageKeys.notes);
    notesEl.value = saved !== null ? saved : EXAMPLE;

    // Never start on a locked theme (e.g. license removed between visits).
    var theme = THEMES.filter(function (t) { return t.id === state.theme; })[0];
    if (!theme || (theme.pro && !isPro())) state.theme = "paper";

    var buy = $("buyBtn");
    if (CONFIG.paymentUrl.indexOf("REPLACE") === 0) {
      buy.addEventListener("click", function (e) {
        e.preventDefault();
        openLicenseModal("Payments aren’t connected yet — set CONFIG.paymentUrl in app.js (see slides/README.md).");
      });
    } else {
      buy.href = CONFIG.paymentUrl;
      buy.target = "_blank";
    }
    $("proPrice").textContent = CONFIG.price;

    notesEl.addEventListener("input", debounce(reparse, 150));
    $("exampleBtn").addEventListener("click", function () { notesEl.value = EXAMPLE; reparse(); });
    $("prevBtn").addEventListener("click", function () { move(-1); });
    $("nextBtn").addEventListener("click", function () { move(1); });
    $("presentBtn").addEventListener("click", startPresenting);
    $("pdfBtn").addEventListener("click", exportPdf);
    $("licenseBtn").addEventListener("click", function () { openLicenseModal(); });
    $("haveKeyBtn").addEventListener("click", function () { openLicenseModal(); });
    $("activateBtn").addEventListener("click", activate);
    $("closeModalBtn").addEventListener("click", closeLicenseModal);
    $("licenseInput").addEventListener("keydown", function (e) { if (e.key === "Enter") activate(); });
    $("licenseModal").addEventListener("click", function (e) { if (e.target === this) closeLicenseModal(); });

    presenter.addEventListener("click", function () { if (state.presenting) move(1); });

    document.addEventListener("keydown", function (e) {
      if (e.target === notesEl || e.target.tagName === "INPUT") {
        if (e.key === "Escape" && !$("licenseModal").hidden) closeLicenseModal();
        return;
      }
      if (state.presenting) {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); move(1); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); move(-1); }
        else if (e.key === "Escape") stopPresenting();
      } else {
        if (e.key === "ArrowRight") move(1);
        else if (e.key === "ArrowLeft") move(-1);
        else if (e.key === "Escape" && !$("licenseModal").hidden) closeLicenseModal();
      }
    });

    document.addEventListener("fullscreenchange", function () {
      if (!document.fullscreenElement && state.presenting) stopPresenting();
    });

    window.addEventListener("resize", renderStage);

    renderThemePicker();
    reparse();
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  init();
})();
