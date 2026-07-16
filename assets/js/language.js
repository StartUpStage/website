// Language switcher — header dropdown + footer <select>

// Footer <select> navigation
function changeLanguage(url) {
    if (url) {
        window.location.href = url;
    }
}

// Header dropdown toggle
function toggleLanguageDropdown(event) {
    event.stopPropagation();
    const switcher = event.currentTarget.closest('.language-switcher');
    switcher.classList.toggle('active');
}

// Close the dropdown when clicking outside of it
document.addEventListener('click', function (event) {
    document.querySelectorAll('.language-switcher').forEach(function (switcher) {
        if (!switcher.contains(event.target)) {
            switcher.classList.remove('active');
        }
    });
});

// Footer: display the current year
(function () {
    var yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
})();
