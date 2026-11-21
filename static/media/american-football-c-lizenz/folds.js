/* Collapsible topic folds for the "American Football: C-Lizenz" page.
 *
 * The page is long enough that reading it top to bottom is not how anyone
 * uses it, so the course notes and the position block are grouped into
 * <details class="clz-fold"> elements. Everything still ships in the HTML:
 * the folds are a reading aid, not lazy loading, so search engines, the
 * printer and a reader without JavaScript all see the full text.
 *
 * This file only removes the two ways a fold can get in the way:
 *   - a link that points inside a closed fold would scroll nowhere,
 *   - find-in-page misses closed folds in browsers that do not expand them,
 *     so every section with folds gets an "open all" control. */
(function () {
  "use strict";

  var FOLD = "details.clz-fold";

  var LABELS = {
    en: { open: "Open all", close: "Close all" },
    de: { open: "Alle öffnen", close: "Alle schließen" },
  };

  function currentLang() {
    return document.documentElement.dataset.lang === "de" ? "de" : "en";
  }

  function openAncestors(node) {
    for (var el = node; el; el = el.parentElement) {
      if (el.tagName === "DETAILS") el.open = true;
    }
  }

  function targetOf(hash) {
    if (!hash || hash.length < 2) return null;
    var id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* keep the raw id */ }
    return document.getElementById(id);
  }

  /* A browser scrolls to the anchor before this runs, and finds nothing when
     the anchor sits in a closed fold. Open it, then scroll again. */
  function revealFromHash() {
    var target = targetOf(window.location.hash);
    if (!target) return;
    openAncestors(target);
    target.scrollIntoView();
  }

  function revealOnClick(event) {
    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var target = targetOf(link.getAttribute("href"));
    if (target) openAncestors(target);
  }

  /* The h2 a fold belongs to: folds and headings are siblings inside the
     language block, so walking back over the siblings finds it. */
  function headingFor(fold) {
    for (var el = fold.previousElementSibling; el; el = el.previousElementSibling) {
      if (el.tagName === "H2") return el;
    }
    return null;
  }

  /* One "open all" button per section that has folds, placed under its
     heading. */
  function addSectionControls(folds, onLangChange) {
    var sections = new Map();
    folds.forEach(function (fold) {
      var heading = headingFor(fold);
      if (!heading) return;
      if (!sections.has(heading)) sections.set(heading, []);
      sections.get(heading).push(fold);
    });

    sections.forEach(function (group, heading) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "clz-foldall";

      function sync() {
        var allOpen = group.every(function (fold) { return fold.open; });
        var labels = LABELS[currentLang()];
        button.textContent = allOpen ? labels.close : labels.open;
        button.setAttribute("aria-expanded", allOpen ? "true" : "false");
      }

      button.addEventListener("click", function () {
        var allOpen = group.every(function (fold) { return fold.open; });
        group.forEach(function (fold) { fold.open = !allOpen; });
        sync();
      });
      group.forEach(function (fold) { fold.addEventListener("toggle", sync); });

      heading.insertAdjacentElement("afterend", button);
      sync();
      onLangChange(sync);
    });
  }

  /* The buttons are the only text this file writes, so they have to follow
     the page's EN/DE switch, which sets data-lang on <html>. */
  function languageWatcher() {
    var listeners = [];
    new MutationObserver(function () {
      listeners.forEach(function (fn) { fn(); });
    }).observe(document.documentElement,
      { attributes: true, attributeFilter: ["data-lang"] });
    return function (fn) { listeners.push(fn); };
  }

  /* Print the whole page, then put the folds back as the reader had them. */
  function addPrintHandling(folds) {
    var remembered = [];
    window.addEventListener("beforeprint", function () {
      remembered = folds.map(function (fold) { return fold.open; });
      folds.forEach(function (fold) { fold.open = true; });
    });
    window.addEventListener("afterprint", function () {
      folds.forEach(function (fold, i) { fold.open = remembered[i]; });
    });
  }

  function init() {
    var folds = Array.prototype.slice.call(document.querySelectorAll(FOLD));
    if (!folds.length) return;
    addSectionControls(folds, languageWatcher());
    addPrintHandling(folds);
    document.addEventListener("click", revealOnClick);
    window.addEventListener("hashchange", revealFromHash);
    revealFromHash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
