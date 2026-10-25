/* MAK Synth — progressive enhancement only.
   The site is fully usable without this file; it wires display settings and the menu. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---- Apply saved preferences (also done inline in <head> to avoid flash) ---- */
  function applyTheme(v) {
    if (v === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    var m = document.querySelector('meta[name="theme-color"]:not([media])');
    if (m) m.setAttribute("content", v === "dark" ? "#0d0d0d" : "#ffffff");
  }
  function applyContrast(v) {
    if (v === "high") root.setAttribute("data-contrast", "high");
    else if (v === "normal") root.setAttribute("data-contrast", "normal");
    else root.removeAttribute("data-contrast");
  }
  function applyStep(n) { root.style.setProperty("--step", String(n)); }

  var theme = store.get("mak-theme") || "dark";
  var contrast = store.get("mak-contrast") || "auto";
  var step = parseInt(store.get("mak-textstep") || "0", 10);
  if (isNaN(step)) step = 0;
  applyTheme(theme); applyContrast(contrast); applyStep(step);

  /* ---- Segmented controls ---- */
  function wireSeg(name, getCur, onSet) {
    var btns = document.querySelectorAll('[data-seg="' + name + '"]');
    function refresh() {
      var cur = getCur();
      btns.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-val") === cur ? "true" : "false");
      });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () { onSet(b.getAttribute("data-val")); refresh(); });
    });
    refresh();
    return refresh;
  }

  /* ---- Theme toggle button (light / dark) ---- */
  var themeBtn = document.querySelector("[data-theme-toggle]");
  function refreshThemeBtn() {
    if (themeBtn) themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      theme = (theme === "dark") ? "light" : "dark";
      store.set("mak-theme", theme); applyTheme(theme); refreshThemeBtn();
    });
  }
  refreshThemeBtn();

  wireSeg("contrast", function () { return contrast === "auto" ? "auto" : contrast; }, function (v) {
    contrast = v; store.set("mak-contrast", v); applyContrast(v);
  });

  var stepLabel = document.querySelector("[data-step-label]");
  function showStep() { if (stepLabel) stepLabel.textContent = (step > 0 ? "+" : "") + step; }
  document.querySelectorAll("[data-textstep]").forEach(function (b) {
    b.addEventListener("click", function () {
      var act = b.getAttribute("data-textstep");
      if (act === "inc") step = Math.min(step + 1, 4);
      else if (act === "dec") step = Math.max(step - 1, -1);
      else step = 0;
      store.set("mak-textstep", String(step)); applyStep(step); showStep();
    });
  });
  showStep();

  /* ---- Display-settings popover (gear) ---- */
  var setToggle = document.querySelector("[data-settings-toggle]");
  var setPanel = document.querySelector("[data-settings-panel]");
  if (setToggle && setPanel) {
    function closeSettings() { setPanel.hidden = true; setToggle.setAttribute("aria-expanded", "false"); }
    function openSettings() {
      setPanel.hidden = false; setToggle.setAttribute("aria-expanded", "true");
      var first = setPanel.querySelector("button, a, input");
      if (first) first.focus();
    }
    setToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (setPanel.hidden) openSettings(); else closeSettings();
    });
    document.addEventListener("click", function (e) {
      if (!setPanel.hidden && !setPanel.contains(e.target) && e.target !== setToggle && !setToggle.contains(e.target)) closeSettings();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !setPanel.hidden) { closeSettings(); setToggle.focus(); }
    });
    setPanel.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  /* ---- Footer links jump to the top of the target page ---- */
  document.querySelectorAll("[data-top]").forEach(function (a) {
    a.addEventListener("click", function () {
      try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch (e) { window.scrollTo(0, 0); }
    });
  });

  /* ---- Current year in footer ---- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---- Mobile menu ---- */
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("navmenu");
  if (navToggle && navMenu) {
    function closeNav() { navMenu.classList.remove("open"); navToggle.setAttribute("aria-expanded", "false"); }
    navToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navMenu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navMenu.classList.contains("open")) { closeNav(); navToggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (navMenu.classList.contains("open") && !navMenu.contains(e.target) && e.target !== navToggle && !navToggle.contains(e.target)) closeNav();
    });
    var mqn = window.matchMedia("(min-width: 56rem)");
    (mqn.addEventListener ? mqn.addEventListener.bind(mqn, "change") : mqn.addListener.bind(mqn))(function () {
      if (mqn.matches) closeNav();
    });
  }
})();
