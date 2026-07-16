// Pitch-signup flow:
//  - "Apply" reveals the form (and renders Turnstile in a visible container)
//  - submit -> POST /api/pitch
//  - on success: hide the form, show the success message
(function () {
    var form = document.getElementById("pitch-form");
    if (!form) return;

    var card = document.getElementById("pitch-card");
    var applyBtn = document.getElementById("pitch-apply");
    var successEl = document.getElementById("pitch-success");
    var status = form.querySelector(".pitch-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var turnstileEl = document.getElementById("pf-turnstile");
    var widgetId = null;

    function msg(key, fallback) {
        return form.getAttribute("data-msg-" + key) || fallback;
    }

    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : "";
    }

    // Render Turnstile explicitly once the form is visible. Retries until the
    // Turnstile script has loaded.
    function renderTurnstile(retries) {
        if (!turnstileEl || widgetId !== null) return;
        if (window.turnstile && window.turnstile.render) {
            var opts = { sitekey: turnstileEl.getAttribute("data-sitekey") };
            // The normal widget is a fixed 300px, which overflows narrow
            // phone screens; use the compact size there.
            if (window.innerWidth < 500) opts.size = "compact";
            widgetId = window.turnstile.render(turnstileEl, opts);
            setTimeout(neutralizeOverflowIframes, 600);
            setTimeout(neutralizeOverflowIframes, 2000);
        } else if ((retries || 0) < 25) {
            setTimeout(function () {
                renderTurnstile((retries || 0) + 1);
            }, 200);
        }
    }

    function resetTurnstile() {
        if (window.turnstile && widgetId !== null) {
            try { window.turnstile.reset(widgetId); } catch (e) {}
        }
    }

    // Safety net: Cloudflare/Turnstile can inject an iframe onto <body> that
    // overflows the viewport and causes a horizontal scroll on mobile. Pin any
    // stray iframe that sticks out past the viewport to 1x1 (it still works via
    // postMessage; it doesn't need to be visible).
    function neutralizeOverflowIframes() {
        var frames = document.querySelectorAll("body > iframe, #pf-turnstile ~ iframe");
        for (var i = 0; i < frames.length; i++) {
            var f = frames[i];
            if (turnstileEl && turnstileEl.contains(f)) continue; // keep the real widget
            var r = f.getBoundingClientRect();
            if (r.right > window.innerWidth + 1 || r.left < -1 || r.width > window.innerWidth) {
                f.style.setProperty("position", "fixed", "important");
                f.style.setProperty("left", "0", "important");
                f.style.setProperty("top", "0", "important");
                f.style.setProperty("width", "1px", "important");
                f.style.setProperty("height", "1px", "important");
                f.style.setProperty("opacity", "0", "important");
                f.style.setProperty("pointer-events", "none", "important");
            }
        }
    }
    if (window.MutationObserver) {
        new MutationObserver(neutralizeOverflowIframes)
            .observe(document.body, { childList: true, subtree: true });
    }

    if (applyBtn) {
        applyBtn.addEventListener("click", function () {
            applyBtn.hidden = true;
            if (successEl) successEl.hidden = true;
            if (card) {
                card.hidden = false;
                card.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
            submitBtn.disabled = false;
            status.className = "pitch-status";
            status.textContent = "";
            // Fresh token if the widget already exists, otherwise render it.
            if (widgetId !== null) resetTurnstile();
            else renderTurnstile(0);
            var first = document.getElementById("pf-name");
            if (first) first.focus();
        });
    }

    function showError(key) {
        status.textContent = msg(key, "Something went wrong. Please try again.");
        status.classList.add("is-error");
        submitBtn.disabled = false;
        resetTurnstile();
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        status.className = "pitch-status";
        status.textContent = msg("sending", "Sending…");
        submitBtn.disabled = true;

        var token = "";
        if (window.turnstile && widgetId !== null) {
            token = window.turnstile.getResponse(widgetId) || "";
        }
        var hp = form.querySelector('[name="website"]');

        var payload = {
            name: val("pf-name"),
            email: val("pf-email"),
            startup_name: val("pf-startup"),
            description: val("pf-desc"),
            website: hp ? hp.value : "",
            language: document.documentElement.lang || "",
            turnstileToken: token
        };

        fetch("/api/pitch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(function (r) {
                return r.json().then(function (d) {
                    return { ok: r.ok, data: d };
                });
            })
            .then(function (res) {
                if (res.ok && res.data && res.data.ok) {
                    if (card) card.hidden = true;
                    if (successEl) successEl.hidden = false;
                    if (applyBtn) applyBtn.hidden = false;
                    submitBtn.disabled = false;
                    form.reset();
                    // Fully tear down Turnstile (removes the iframe it injects
                    // into <body>, which can otherwise cause horizontal scroll).
                    if (window.turnstile && widgetId !== null) {
                        try { window.turnstile.remove(widgetId); } catch (e) {}
                        widgetId = null;
                    }
                } else {
                    showError(res.data && res.data.error === "captcha" ? "captcha" : "error");
                }
            })
            .catch(function () {
                showError("error");
            });
    });
})();
