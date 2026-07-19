const STORAGE_KEY = "theme";

export function initTheme() {
    const savedTheme =
        localStorage.getItem(STORAGE_KEY) ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light");

    applyTheme(savedTheme);
}

export function applyTheme(theme) {
    const html = document.documentElement;
    const button = document.getElementById("themeToggle");

    html.classList.toggle("light-theme", theme === "light");

    localStorage.setItem(STORAGE_KEY, theme);

    if (button) {
        button.textContent = theme === "light" ? "☀️" : "🌙";

        button.setAttribute(
            "aria-label",
            theme === "light"
                ? "Switch to dark theme"
                : "Switch to light theme"
        );

        button.setAttribute(
            "aria-pressed",
            theme === "light"
        );
    }
}

export function toggleTheme() {
    const isLight =
        document.documentElement.classList.contains("light-theme");

    applyTheme(isLight ? "dark" : "light");
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();

    document
        .getElementById("themeToggle")
        ?.addEventListener("click", toggleTheme);
});

window.toggleTheme = toggleTheme;