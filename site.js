/* Kerrier Laundry Co. - shared site behavior (all pages), v10 */

// ── Analytics helper ─────────────────────────────────────────
// Sends a GA4 event through gtag. Never throws, and does nothing if
// gtag is missing (blocked by an ad blocker, offline, etc.).
// Only send counts and categories here: never names, phones, emails
// or typed addresses.
// ── Form backend (swap here) ─────────────────────────────────
// Every site form (out-of-area lead form and newsletter signup) posts
// JSON to this one endpoint. Today it is the "Lead Inquiry" Formspree
// form on kerrierlaundryco@gmail.com. To move to an email tool later,
// change this URL (and, if that tool needs a different body, the
// buildBody function below).
var KERRIER_FORM_ENDPOINT = "https://formspree.io/f/mkolbevp";

(function () {
    var SUBJECTS = {
        map_form: "Out of area inquiry",
        newsletter_footer: "Newsletter signup"
    };
    function buildBody(data) {
        var body = {};
        for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) body[k] = data[k];
        body.submitted_at = new Date().toISOString();
        body.page = location.pathname.split("/").pop() || "index.html";
        if (!body._subject && SUBJECTS[body.source]) body._subject = SUBJECTS[body.source];
        return body;
    }
    // Resolves true when the backend accepted the submission.
    window.kerrierSubmitForm = function (data) {
        try {
            return fetch(KERRIER_FORM_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(buildBody(data))
            }).then(function (r) { return r.ok; }, function () { return false; });
        } catch (e) { return Promise.resolve(false); }
    };
})();

(function () {
    function pageName() {
        var p = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
        return p === "index" || p === "" ? "home" : p;
    }
    function track(name, params) {
        try {
            if (typeof window.gtag !== "function") return;
            var p = { page: pageName() };
            if (params) for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) p[k] = params[k];
            window.gtag("event", name, p);
        } catch (e) { /* analytics must never break the site */ }
    }
    window.kerrierTrack = track;

    // Where on the page a link sits (for book_click / call_tap / text_tap)
    function linkLocation(a) {
        if (a.getAttribute("data-track-location")) return a.getAttribute("data-track-location");
        if (a.closest(".book-bar")) return "mobile_bookbar";
        if (a.closest(".nav-sheet-foot")) return "nav_menu";
        if (a.closest(".site-header")) return "nav";
        if (a.closest(".site-footer")) return "footer";
        if (a.closest(".calculator-card")) return "address_checker";
        if (a.closest(".hero, .page-hero")) return "hero";
        if (a.closest(".closing")) return "closing_cta";
        if (a.closest(".help-card")) return "help_card";
        if (a.closest(".book-summary, .book-quick")) return "booking_page";
        if (a.closest(".faq-list")) return "faq_answer";
        return a.classList.contains("btn") ? "page_cta" : "inline_link";
    }
    var BOOK_RE = /(^|\/)scheduling_page\.html(\?|#|$)|(^|\/\/)(app\.)?cal\.com\//i;

    // One delegated listener catches every link, including ones added later.
    document.addEventListener("click", function (e) {
        var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
        if (!a) return;
        var href = a.getAttribute("href") || "";
        if (/^tel:/i.test(href)) track("call_tap", { link_location: linkLocation(a) });
        else if (/^sms:/i.test(href)) track("text_tap", { link_location: linkLocation(a) });
        else if (BOOK_RE.test(href)) track("book_click", { link_location: linkLocation(a) });
    }, true);

    // Cal.com booking embed (booking page only). Listeners are queued on the
    // "15min" namespace and attach when Cal's embed.js loads.
    // Documented public events: linkReady, bookerReady, bookingSuccessfulV2,
    // bookingSuccessful (deprecated), linkFailed. Cal exposes no event for
    // picking a date or time slot, so time_selected cannot be tracked here.
    try {
        var cal = window.Cal && window.Cal.ns && window.Cal.ns["15min"];
        if (typeof cal === "function") {
            var sent = {};
            var once = function (name, params) { if (sent[name]) return; sent[name] = true; track(name, params); };
            var on = function (action, fn) { cal("on", { action: action, callback: fn }); };
            // linkReady has been reported to not always fire, so bookerReady is a backup.
            on("linkReady", function () { once("calendar_loaded", { embed_event: "linkReady" }); });
            on("bookerReady", function () { once("calendar_loaded", { embed_event: "bookerReady" }); });
            on("linkFailed", function (e) {
                var d = (e && e.detail && e.detail.data) || {};
                once("calendar_error", { error_code: String(d.code || "unknown").slice(0, 40) });
            });
            // Booking finished. Only non-personal fields are sent.
            var booked = function (e) {
                var d = (e && e.detail && e.detail.data) || {};
                once("booking_completed", {
                    is_recurring: d.isRecurring ? "yes" : "no",
                    booking_status: d.status ? String(d.status).toLowerCase().slice(0, 20) : "unknown"
                });
            };
            on("bookingSuccessfulV2", booked);
            on("bookingSuccessful", booked); // older name, de-duplicated by once()
        }
    } catch (e) { /* never break the page over analytics */ }
})();

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

// ── Newsletter signup (footer, all pages) ────────────────────
(function () {
    var form = document.getElementById("newsletter-form");
    if (!form) return;
    var first = form.querySelector("#nl-first");
    var email = form.querySelector("#nl-email");
    var consent = form.querySelector("#nl-consent");
    var gotcha = form.querySelector("#nl-gotcha");
    var btn = form.querySelector(".signup-btn");
    var msg = form.querySelector(".signup-msg");
    var SUCCESS = "Thanks! Watch your inbox for our next email.";

    function say(text, kind) {
        msg.textContent = text;
        msg.className = "signup-msg" + (kind ? " is-" + kind : "");
    }
    function invalid(el, text) {
        el.setAttribute("aria-invalid", "true");
        say(text, "error");
        el.focus();
    }
    [email, consent].forEach(function (el) {
        el.addEventListener("input", function () { el.removeAttribute("aria-invalid"); if (msg.classList.contains("is-error")) say(""); });
        el.addEventListener("change", function () { el.removeAttribute("aria-invalid"); });
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (btn.disabled) return;
        var addr = email.value.trim();
        email.value = addr;
        if (!addr) return invalid(email, "Please enter your email address.");
        if (!email.checkValidity()) return invalid(email, "Please check your email address.");
        if (!consent.checked) return invalid(consent, "Please check the box so we can email you.");

        var done = function () {
            form.classList.add("is-done");
            say(SUCCESS, "success");
        };
        // Bots fill the hidden field. Pretend it worked and send nothing.
        if (gotcha && gotcha.value) { done(); return; }

        btn.disabled = true;
        btn.textContent = "Signing you up...";
        say("");
        window.kerrierSubmitForm({
            source: form.getAttribute("data-source") || "newsletter_footer",
            first_name: first.value.trim(),
            email: addr,
            consent: "yes",
            subscriber: "yes"
        }).then(function (ok) {
            if (ok) {
                done();
                if (typeof window.kerrierTrack === "function") window.kerrierTrack("newsletter_signup", { form_location: "footer" });
            } else {
                btn.disabled = false;
                btn.textContent = "Sign me up";
                say("Something went wrong. Please try again, or call or text us at (270) 776-2464.", "error");
            }
        });
    });
})();
