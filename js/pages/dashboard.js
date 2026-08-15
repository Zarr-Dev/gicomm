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
        "Aktivitas terbaru akun demo.",
    ],
    "My Library": [
        "My Library",
        "18 produk tersimpan di library demo.",
    ],
    Saved: [
        "Saved",
        "6 produk yang kamu simpan.",
    ],
    Orders: [
        "Orders",
        "12 order demo telah selesai.",
    ],
    Selling: [
        "Selling",
        "3 produk demo sedang dijual.",
    ],
    Settings: [
        "Settings",
        "Preferensi akun demo.",
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

document.querySelector("#logout").addEventListener(
    "click",
    () => {
        clearDemoUser();
        window.location.href = "../pages/index.html";
    }
);

applyTheme(getTheme());
