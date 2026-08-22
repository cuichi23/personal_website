/* Progressive enhancement only: every page reads and works without this file. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------ colour theme */

  function currentTheme() {
    var stamped = document.documentElement.dataset.theme;
    if (stamped) return stamped;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setUpThemeToggle() {
    var button = document.querySelector("[data-theme-toggle]");
    if (!button) return;

    function sync() {
      var theme = currentTheme();
      button.dataset.state = theme;
      button.setAttribute("aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }

    button.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      sync();
      window.dispatchEvent(new CustomEvent("themechange"));
    });

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      sync();
      window.dispatchEvent(new CustomEvent("themechange"));
    });
    sync();
  }

  /* -------------------------------------------------------------- maths */

  function renderMaths() {
    if (typeof katex === "undefined") return;
    document.querySelectorAll(".math[data-tex]").forEach(function (node) {
      try {
        katex.render(node.dataset.tex, node, {
          displayMode: node.classList.contains("math--display"),
          throwOnError: false,
          strict: false,
          trust: false,
          macros: { "\\bm": "\\boldsymbol" }
        });
      } catch (e) {
        node.classList.add("math--failed");
      }
    });
  }

  /* --------------------------------------------------- home section index */

  function setUpSectionIndex() {
    var links = document.querySelectorAll(".section-index__list a");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    links.forEach(function (link) { byId[link.getAttribute("href").slice(1)] = link; });

    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      links.forEach(function (link) { link.removeAttribute("aria-current"); });
      var first = Object.keys(byId).find(function (id) { return visible.has(id); });
      if (first) byId[first].setAttribute("aria-current", "true");
    }, { rootMargin: "-30% 0px -60% 0px" });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ------------------------------------------------- the hero: coupled clocks
     N clocks in a ring, coupled only to their two neighbours, with a
     transmission delay tau on every link and no reference clock anywhere:

       d(phi_k)/dt = omega_k + (K / 2) * sum_neighbours sin(phi_l(t - tau) - phi_k(t))

     Each channel is drawn as the square wave sign(sin(phi_k)) over the last few
     seconds, so the rising edges visibly slide into alignment. Same model as the
     papers, just small and slow enough to watch.                              */

  var N = 12;
  var DT = 0.006;             // integration step, seconds
  var TAU = 0.34;             // transmission delay, seconds
  var K = 2 * Math.PI * 0.42; // coupling strength, rad/s
  var WINDOW = 5.2;           // seconds of history drawn
  var SPREAD = 0.055;         // relative spread of intrinsic frequencies
  var LOCKED_AT = 0.95;       // order parameter at which the traces turn amber

  function Clocks(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.steps = Math.ceil(WINDOW / DT) + Math.ceil(TAU / DT) + 2;
    this.reset();
    this.readColours();
    for (var warm = 0; warm < Math.floor(WINDOW / DT); warm++) this.step();
  }

  Clocks.prototype.reset = function () {
    var seed = 20170630; // the date of the first post; keeps the opening frame stable
    function random() {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    }
    this.omega = [];
    this.history = [];
    this.head = 0;
    this.filled = 0;
    this.order = 0;
    for (var k = 0; k < N; k++) {
      this.omega.push(2 * Math.PI * (1 + SPREAD * (random() - 0.5)));
      this.history.push(new Float32Array(this.steps));
      var phase = random() * 2 * Math.PI;
      for (var i = 0; i < this.steps; i++) this.history[k][i] = phase;
    }
  };

  Clocks.prototype.readColours = function () {
    var style = getComputedStyle(document.documentElement);
    this.ink = style.getPropertyValue("--ink-soft").trim() || "#453e63";
    this.quiet = style.getPropertyValue("--rule").trim() || "#e3dfee";
    this.accent = style.getPropertyValue("--accent").trim() || "#b4620e";
    this.muted = style.getPropertyValue("--muted").trim() || "#6e6788";
  };

  Clocks.prototype.at = function (k, stepsBack) {
    var index = (this.head - (stepsBack % this.steps) + this.steps) % this.steps;
    return this.history[k][index];
  };

  Clocks.prototype.step = function () {
    var delaySteps = Math.round(TAU / DT);
    var next = new Float32Array(N);
    var sumSin = 0;
    var sumCos = 0;
    for (var k = 0; k < N; k++) {
      var self = this.at(k, 0);
      var left = this.at((k - 1 + N) % N, delaySteps);
      var right = this.at((k + 1) % N, delaySteps);
      var coupling = (K / 2) * (Math.sin(left - self) + Math.sin(right - self));
      next[k] = self + DT * (this.omega[k] + coupling);
      sumSin += Math.sin(next[k]);
      sumCos += Math.cos(next[k]);
    }
    this.head = (this.head + 1) % this.steps;
    for (var j = 0; j < N; j++) this.history[j][this.head] = next[j];
    this.filled = Math.min(this.filled + 1, this.steps);
    this.order = Math.hypot(sumSin, sumCos) / N;
  };

  Clocks.prototype.draw = function () {
    var canvas = this.canvas;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var width = canvas.clientWidth || 900;
    var height = Math.round(width * 5 / 8);
    if (canvas.width !== Math.round(width * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    var ctx = this.ctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    var padX = Math.max(18, width * 0.045);
    var padTop = Math.max(16, height * 0.06);
    var padBottom = Math.max(58, height * 0.22);  // clears the readout strip
    var usable = height - padTop - padBottom;
    var lane = usable / N;
    var amplitude = Math.min(lane * 0.34, 9);
    var drawSteps = Math.min(this.filled, Math.floor(WINDOW / DT));
    var locked = this.order > LOCKED_AT;

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.quiet;
    ctx.beginPath();
    ctx.moveTo(padX, padTop - 6);
    ctx.lineTo(padX, height - padBottom + 6);
    ctx.stroke();

    ctx.lineWidth = 1.35;
    ctx.lineJoin = "miter";
    ctx.strokeStyle = locked ? this.accent : this.ink;

    for (var k = 0; k < N; k++) {
      var mid = padTop + lane * (k + 0.5);
      ctx.beginPath();
      var previousHigh = null;
      for (var s = drawSteps - 1; s >= 0; s--) {
        var x = padX + (width - 2 * padX) * (1 - s / drawSteps);
        var high = Math.sin(this.at(k, s)) >= 0;
        var y = mid + (high ? -amplitude : amplitude);
        if (previousHigh === null) ctx.moveTo(x, y);
        else if (high !== previousHigh) { ctx.lineTo(x, mid + (previousHigh ? -amplitude : amplitude)); ctx.lineTo(x, y); }
        else ctx.lineTo(x, y);
        previousHigh = high;
      }
      ctx.stroke();
    }

    ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = this.muted;
    ctx.textBaseline = "alphabetic";
    var labelY = height - padBottom + 14;
    ctx.fillText("t − " + WINDOW.toFixed(1) + " s", padX, labelY);
    ctx.textAlign = "right";
    ctx.fillText("now", width - padX, labelY);
    ctx.textAlign = "left";
  };

  function setUpClocks() {
    var canvas = document.querySelector("[data-coupled-clocks]");
    if (!canvas || !canvas.getContext) return;
    var readout = document.querySelector("[data-clocks-order]");
    var clocks = new Clocks(canvas);

    function showOrder() {
      if (readout) readout.textContent = clocks.order.toFixed(2);
    }

    window.addEventListener("themechange", function () {
      clocks.readColours();
      clocks.draw();
    });
    window.addEventListener("resize", function () { clocks.draw(); });

    if (reduceMotion.matches) {
      for (var i = 0; i < Math.round(35 / DT); i++) clocks.step();
      clocks.draw();
      showOrder();
      return;
    }

    var running = true;
    var last = 0;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
        if (running) last = 0;
      }, { threshold: 0 }).observe(canvas);
    }

    function frame(now) {
      requestAnimationFrame(frame);
      if (!running || document.hidden) return;
      if (!last) last = now;
      var elapsed = Math.min((now - last) / 1000, 0.1);
      last = now;
      var count = Math.round(elapsed / DT);
      for (var i = 0; i < count; i++) clocks.step();
      clocks.draw();
      showOrder();
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------- embedded instrument panels
     A tool under /tools/ lives in an iframe so its own stylesheet cannot collide
     with the page's. It reports the height it needs and follows our theme.     */

  function setUpEmbeds() {
    var frames = document.querySelectorAll(".embed__frame");
    if (!frames.length) return;

    function pushTheme() {
      frames.forEach(function (frame) {
        if (!frame.contentWindow) return;
        frame.contentWindow.postMessage({ theme: currentTheme() }, "*");
      });
    }

    window.addEventListener("message", function (event) {
      var height = event.data && event.data.embedHeight;
      if (!height) return;
      frames.forEach(function (frame) {
        if (frame.contentWindow === event.source) {
          frame.style.height = Math.max(480, Math.min(height, 3000)) + "px";
        }
      });
    });

    frames.forEach(function (frame) { frame.addEventListener("load", pushTheme); });
    window.addEventListener("themechange", pushTheme);
  }

  /* ---------------------------------------------------------------- start */

  function start() {
    setUpThemeToggle();
    renderMaths();
    setUpSectionIndex();
    setUpClocks();
    setUpEmbeds();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
