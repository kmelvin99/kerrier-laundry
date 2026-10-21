/* Kerrier Laundry Co. — shared site behavior (all pages), v6 */
(function () {
    var root = document.documentElement;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Header: hairline once scrolled
    var header = document.getElementById("site-header");
    var bar = document.getElementById("book-bar");
    var hero = document.querySelector("[data-bar-after]");
    var closingVisible = false;

    function updateBar() {
        if (!bar) return;
        var threshold = hero ? hero.getBoundingClientRect().bottom + window.scrollY - 80 : 480;
        var show = window.scrollY > threshold && !closingVisible;
        bar.classList.toggle("is-visible", show);
        document.body.classList.toggle("bar-visible", show);
        bar.setAttribute("aria-hidden", String(!show));
        bar.querySelectorAll("a").forEach(function (a) { a.tabIndex = show ? 0 : -1; });
    }
    function onScroll() {
        if (header) header.classList.toggle("is-scrolled", window.scrollY > 4);
        updateBar();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateBar, { passive: true });

    if (bar && "IntersectionObserver" in window) {
        var endObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { closingVisible = e.isIntersecting; });
            updateBar();
        }, { threshold: 0 });
        document.querySelectorAll(".closing, .site-footer").forEach(function (el) { endObs.observe(el); });
    }
    onScroll();

    // Mobile menu sheet
    var toggle = document.getElementById("menu-toggle");
    var nav = document.getElementById("main-nav");
    if (toggle && nav) {
        var setMenu = function (open, returnFocus) {
            nav.classList.toggle("is-open", open);
            root.classList.toggle("menu-open", open);
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            if (open) {
                var first = nav.querySelector("a");
                if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
            } else if (returnFocus) {
                toggle.focus({ preventScroll: true });
            }
        };
        toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
        nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setMenu(false, true);
        });
        window.matchMedia("(min-width: 834px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
    }

    // FAQ accordion (button + aria-expanded + region)
    document.querySelectorAll(".faq-question").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var open = btn.getAttribute("aria-expanded") === "true";
            btn.setAttribute("aria-expanded", String(!open));
            var panel = document.getElementById(btn.getAttribute("aria-controls"));
            if (panel) panel.hidden = open;
        });
    });

    // Hero image: gentle settle once loaded
    document.querySelectorAll(".hero-media").forEach(function (m) {
        var img = m.querySelector("img");
        var done = function () { requestAnimationFrame(function () { m.classList.add("is-loaded"); }); };
        if (!img || img.complete) done(); else { img.addEventListener("load", done); img.addEventListener("error", done); }
    });

    // Reveal on scroll (skipped for reduced motion)
    var els = document.querySelectorAll(".reveal, .photo-moment, .photo-band");
    if (reduce || !("IntersectionObserver" in window)) {
        els.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        els.forEach(function (el) { observer.observe(el); });
    }

    // Footer year
    document.querySelectorAll(".footer-year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
