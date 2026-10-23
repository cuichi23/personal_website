/* Language switch for the bilingual C-Lizenz page.
 *
 * The page carries its content twice, in .lang-block elements (German ones
 * carry lang="de"). A data-lang="de" attribute on <html> selects German; the
 * page's inline style block does the hiding, and an inline script stamps the
 * stored choice before first paint. This file only adds the toggle button,
 * styled and persisted like the site's theme switch, next to the topics list
 * in the post header. */
(function () {
  "use strict";

  // The post title and standfirst are rendered by the site template in
  // English; these are their German counterparts, swapped in by sync().
  var DE_TITLE = "American Football: Trainer-C-Lizenz";
  var DE_STANDFIRST = "Vom sportartübergreifenden Grundlehrgang zur "
    + "Trainer-C-Lizenz im American Football: wie das deutsche Lizenzsystem "
    + "funktioniert, alle Prüfungsthemen sortiert und zusammengefasst, eine "
    + "einführende Coaching-Wissensbasis für Offense und Defense und zwei "
    + "interaktive Quizze zum Selbsttest.";

  function currentLang() {
    return document.documentElement.dataset.lang === "de" ? "de" : "en";
  }

  function applyLang(lang) {
    if (lang === "de") document.documentElement.dataset.lang = "de";
    else delete document.documentElement.dataset.lang;
  }

  function init() {
    var meta = document.querySelector(".post__meta");
    if (!meta || !document.querySelector(".lang-block")) return;

    var title = document.querySelector(".post__title");
    var standfirst = document.querySelector(".post__standfirst");
    var enTitle = title ? title.textContent : "";
    var enStandfirst = standfirst ? standfirst.textContent : "";
    var enDocTitle = document.title;

    var pair = document.createElement("div");
    pair.className = "post__meta-pair";
    var label = document.createElement("dt");
    var value = document.createElement("dd");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "lang-toggle";

    var mark = document.createElement("span");
    mark.className = "lang-toggle__mark";
    mark.setAttribute("aria-hidden", "true");
    button.appendChild(mark);
    [["en", "EN"], ["de", "DE"]].forEach(function (opt) {
      var span = document.createElement("span");
      span.className = "lang-toggle__opt lang-toggle__opt--" + opt[0];
      span.setAttribute("aria-hidden", "true");
      span.textContent = opt[1];
      button.appendChild(span);
    });

    value.appendChild(button);
    pair.appendChild(label);
    pair.appendChild(value);
    meta.appendChild(pair);

    function sync() {
      var lang = currentLang();
      button.dataset.state = lang;
      label.textContent = lang === "de" ? "Sprache" : "Language";
      button.setAttribute("aria-label",
        lang === "de" ? "Switch to English" : "Auf Deutsch umschalten");
      document.documentElement.lang = lang;
      if (title) title.textContent = lang === "de" ? DE_TITLE : enTitle;
      if (standfirst) {
        standfirst.textContent = lang === "de" ? DE_STANDFIRST : enStandfirst;
      }
      document.title = lang === "de"
        ? enDocTitle.replace(enTitle, DE_TITLE)
        : enDocTitle;
    }

    button.addEventListener("click", function () {
      var next = currentLang() === "de" ? "en" : "de";
      applyLang(next);
      try { localStorage.setItem("lang", next); } catch (e) {}
      sync();
    });

    sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
