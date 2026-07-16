// Pitch-signup form: submits to POST /api/pitch and shows status.
(function () {
    var form = document.getElementById("pitch-form");
    if (!form) return;

    var status = form.querySelector(".pitch-status");
    var button = form.querySelector('button[type="submit"]');

    function msg(key, fallback) {
        return form.getAttribute("data-msg-" + key) || fallback;
    }

    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : "";
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        status.className = "pitch-status";
        status.textContent = msg("sending", "Sending…");
        button.disabled = true;

        var tokenEl = form.querySelector('[name="cf-turnstile-response"]');
        var hp = form.querySelector('[name="website"]');

        var payload = {
            name: val("pf-name"),
            email: val("pf-email"),
            startup_name: val("pf-startup"),
            description: val("pf-desc"),
            website: hp ? hp.value : "",
            language: document.documentElement.lang || "",
            turnstileToken: tokenEl ? tokenEl.value : ""
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
                    status.textContent = msg("success", "Thanks! We received your application.");
                    status.classList.add("is-success");
                    form.reset();
                } else {
                    var key = res.data && res.data.error === "captcha" ? "captcha" : "error";
                    status.textContent = msg(key, "Something went wrong. Please try again.");
                    status.classList.add("is-error");
                }
            })
            .catch(function () {
                status.textContent = msg("error", "Something went wrong. Please try again.");
                status.classList.add("is-error");
            })
            .then(function () {
                button.disabled = false;
                if (window.turnstile) {
                    try { window.turnstile.reset(); } catch (e) {}
                }
            });
    });
})();
