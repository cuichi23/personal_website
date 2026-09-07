/* The password gate on /oscillatory-computing/.

   The panel ships as AES-256-GCM ciphertext and is decrypted here, in the
   reader's browser, from a key derived from what they type. Nothing is sent
   anywhere: there is no server to ask, and a wrong password fails on the
   authentication tag rather than on a comparison we could be talked out of.

   The ciphertext holds two things. The prose that describes the model is in it
   as well as the simulator, because an equation on a public page gives away as
   much as the panel does. Until the password is entered, neither exists in this
   document.

   Without JavaScript the page shows the blurred poster and says so. That is
   the honest fallback, because the panel is a simulation and cannot run
   without JavaScript in the first place. */
(function () {
  "use strict";

  var gate = document.querySelector("[data-gate]");
  if (!gate) return;

  var form = gate.querySelector("[data-gate-form]");
  var input = gate.querySelector("[data-gate-input]");
  var submit = gate.querySelector("[data-gate-submit]");
  var message = gate.querySelector("[data-gate-message]");
  var stage = gate.querySelector("[data-gate-stage]");
  var caption = gate.querySelector("[data-gate-caption]");
  var intro = document.querySelector("[data-gate-intro]");

  var payload = null;   // fetched once, on the first attempt

  function say(text, kind) {
    message.textContent = text;
    message.dataset.kind = kind || "";
  }

  function bytes(base64) {
    var binary = atob(base64);
    var out = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }

  function loadPayload() {
    if (payload) return Promise.resolve(payload);
    /* Revalidate rather than trust the cache. Re-running the packer changes the
       salt, so a stale copy would fail to decrypt and the reader would be told
       their correct password is wrong. */
    return fetch(gate.dataset.payload, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("http " + response.status);
        return response.json();
      })
      .then(function (json) { payload = json; return json; });
  }

  function decrypt(data, password) {
    var encoder = new TextEncoder();
    return crypto.subtle
      .importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"])
      .then(function (material) {
        return crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: bytes(data.kdf.salt),
            iterations: data.kdf.iterations,
            hash: data.kdf.hash
          },
          material,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      })
      .then(function (key) {
        return crypto.subtle.decrypt(
          { name: "AES-GCM", iv: bytes(data.iv) }, key, bytes(data.ct));
      })
      .then(function (plain) { return JSON.parse(new TextDecoder().decode(plain)); });
  }

  /* The panel writes its own stylesheet against `body` and bare element
     selectors, so it goes in an iframe rather than into this document. srcdoc
     keeps it same-origin, which is what the height-and-theme bridge needs. */
  /* The decrypted document is {intro, panel}: prose above, simulator below. */
  function reveal(opened) {
    if (intro && opened.intro) {
      intro.innerHTML = opened.intro;
      intro.hidden = false;
      if (window.renderMathIn) window.renderMathIn(intro);
    }

    var frame = document.createElement("iframe");
    frame.className = "embed__frame gate__frame";
    frame.title = "Oscillatory computing with phase oscillators";
    frame.setAttribute("loading", "lazy");
    frame.srcdoc = opened.panel;

    stage.replaceChildren(frame);
    gate.dataset.state = "open";
    if (caption) {
      caption.textContent =
        "Unlocked. The panel runs in your browser and keeps no state; reload the " +
        "page to lock it again.";
    }

    frame.addEventListener("load", function () {
      if (frame.contentWindow) {
        var stamped = document.documentElement.dataset.theme;
        var theme = stamped || (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark" : "light");
        frame.contentWindow.postMessage({ theme: theme }, "*");
      }
    });

    window.addEventListener("message", function (event) {
      if (event.source !== frame.contentWindow) return;
      var height = event.data && event.data.embedHeight;
      if (height) frame.style.height = Math.max(560, Math.min(height, 4000)) + "px";
    });

    window.addEventListener("themechange", function () {
      if (!frame.contentWindow) return;
      frame.contentWindow.postMessage(
        { theme: document.documentElement.dataset.theme ||
          (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") },
        "*");
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var password = input.value;
    if (!password) return;

    /* Web Crypto is only available in a secure context. Saying so beats a
       thrown TypeError the reader cannot act on. */
    if (!window.crypto || !crypto.subtle) {
      say("This browser will not decrypt the panel over an insecure connection. " +
          "Open the page over https.", "error");
      return;
    }

    submit.disabled = true;
    gate.dataset.state = "working";
    say("Checking…");

    loadPayload()
      .then(function (data) { return decrypt(data, password); })
      .then(function (opened) {
        say("");
        reveal(opened);
      })
      .catch(function (error) {
        gate.dataset.state = "";
        submit.disabled = false;
        input.select();
        var network = String(error && error.message || "").indexOf("http") === 0;
        say(network
          ? "The panel could not be fetched. Try again in a moment."
          : "That password does not open this panel.", "error");
      });
  });

  input.addEventListener("input", function () {
    if (message.dataset.kind === "error") say("");
  });
})();
