// Pitch-signup flow:
//  - "Apply" reveals the form
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

    function msg(key, fallback) {
        return form.getAttribute("data-msg-" + key) || fallback;
    }

    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : "";
    }

    if (applyBtn) {
        applyBtn.addEventListener("click", function () {
            applyBtn.hidden = true;
            if (successEl) successEl.hidden = true;
            if (card) card.hidden = false;
            submitBtn.disabled = false;
            status.className = "pitch-status";
            status.textContent = "";
            var first = document.getElementById("pf-name");
            if (first) first.focus();
        });
    }

    function showError(key) {
        status.textContent = msg(key, "Something went wrong. Please try again.");
        status.classList.add("is-error");
        submitBtn.disabled = false;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        status.className = "pitch-status";
        status.textContent = msg("sending", "Sending…");
        submitBtn.disabled = true;

        var hp = form.querySelector('[name="website"]');

        var payload = {
            name: val("pf-name"),
            email: val("pf-email"),
            startup_name: val("pf-startup"),
            description: val("pf-desc"),
            website: hp ? hp.value : "",
            language: document.documentElement.lang || ""
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
                } else {
                    showError("error");
                }
            })
            .catch(function () {
                showError("error");
            });
    });
})();
