/* Runs in <head> before paint: applies saved display prefs so there is no flash. */
(function () {
  try {
    var r = document.documentElement;
    r.classList.add("js");
    var t = localStorage.getItem("mak-theme");
    if (t === "light") r.removeAttribute("data-theme"); // default is dark
    else r.setAttribute("data-theme", "dark");
    var c = localStorage.getItem("mak-contrast");
    if (c === "high") r.setAttribute("data-contrast", "high");
    else if (c === "normal") r.setAttribute("data-contrast", "normal");
    var s = parseInt(localStorage.getItem("mak-textstep") || "0", 10);
    if (!isNaN(s) && s) r.style.setProperty("--step", String(s));
    if (t === "dark") {
      var m = document.querySelector('meta[name="theme-color"]:not([media])');
      if (m) m.setAttribute("content", "#0d0d0d");
    }
  } catch (e) {}
})();
