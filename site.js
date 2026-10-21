/* Kerrier Laundry Co. — shared site behavior (all pages) */
(function () {
    // Header: subtle shadow once scrolled
    var header = document.getElementById("site-header");
    if (header) {
        var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    // Mobile menu
    var toggle = document.getElementById("menu-toggle");
    var nav = document.getElementById("main-nav");
    if (toggle && nav) {
        var setMenu = function (open) {
            nav.classList.toggle("is-open", open);
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        };
        toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
        nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
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

    // Reveal on scroll (skipped for reduced motion)
    var els = document.querySelectorAll(".reveal");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
