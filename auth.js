/**
 * Client-side password gate.
 *
 * IMPORTANT: this is a static site with no server — this is NOT real
 * security. The page's HTML, data, and this very script are downloadable
 * by anyone with the URL regardless of what this gate shows (view-source,
 * the Network tab, or just reading this file defeats it). It only stops
 * casual visitors, shared links previewed in chat apps, and search-engine
 * indexing from seeing content at a glance. Do not rely on it to protect
 * anything truly sensitive — use real hosting-level access control
 * (Netlify/Vercel password protection, Cloudflare Access, etc.) for that.
 *
 * To change the password: compute a new SHA-256 hex digest and replace
 * TARGET_HASH below, e.g. in Node:
 *   node -e "console.log(require('crypto').createHash('sha256').update('your-new-password').digest('hex'))"
 * Current password: nekonomic-indonesia
 */
(function () {
  var UNLOCK_KEY = "nekonomic_unlocked_v1";
  var TARGET_HASH = "84ae6ab5458e11bba813954206b80f976491e676761dbd7d67ad876c153d77a1";

  function setLocked(locked) {
    document.documentElement.classList.toggle("locked", locked);
  }

  // Runs in <head>, before <body> paints, to avoid a flash of visible content.
  setLocked(localStorage.getItem(UNLOCK_KEY) !== TARGET_HASH);

  function sha256Hex(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("authForm");
    var input = document.getElementById("authPassword");
    var error = document.getElementById("authError");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      sha256Hex(input.value).then(function (hash) {
        if (hash === TARGET_HASH) {
          localStorage.setItem(UNLOCK_KEY, hash);
          error.classList.remove("is-visible");
          setLocked(false);
        } else {
          error.classList.add("is-visible");
          input.value = "";
          input.focus();
        }
      });
    });
  });
})();
