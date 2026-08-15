import {
    getTheme,
    setTheme,
    clearDemoUser,
} from "../components/storage.js";
import {
    setTheme as applyTheme,
} from "../components/ui.js";

const tabs = {
    Overview: [
        "Recent activity",
        "Latest updates from your demo workspace.",
    ],
    "My Library": [
        "My Library",
        "18 items saved in your demo library.",
    ],
    Saved: [
        "Saved",
        "6 products you have saved.",
    ],
    Orders: [
        "Orders",
        "12 demo orders completed.",
    ],
    Selling: [
        "Selling",
        "3 demo products are currently live.",
    ],
    Settings: [
        "Settings",
        "Manage your demo account preferences.",
    ],
};

const tabTitle = document.querySelector("#tabTitle");
const tabSubtitle = document.querySelector("#tabSub");

document.querySelectorAll("[data-tab]").forEach(
    (button) => {
        button.addEventListener("click", () => {
            document
                .querySelectorAll("[data-tab]")
                .forEach((item) =>
                    item.classList.remove("active")
                );

            button.classList.add("active");

            const [title, subtitle] =
                tabs[button.dataset.tab];

            tabTitle.textContent = title;
            tabSubtitle.textContent = subtitle;
        });
    }
);

document.querySelector("#theme").addEventListener(
    "click",
    () => {
        const nextTheme =
            document.body.classList.contains("dark")
                ? "light"
                : "dark";

        setTheme(nextTheme);
        applyTheme(nextTheme);
    }
);

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
        const nextTheme =
            document.body.classList.contains("dark")
                ? "light"
                : "dark";

        setTheme(nextTheme);
        applyTheme(nextTheme);
    });
});

document.querySelector("#logout").addEventListener(
    "click",
    () => {
        clearDemoUser();
        window.location.href = "index.html";
    }
);

applyTheme(getTheme());
