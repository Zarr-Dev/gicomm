import {
    setDemoUser,
} from "../components/storage.js";

const form = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email =
        emailInput.value.trim() || "demo@gicomm.app";

    setDemoUser(email);
    window.location.href = "dashboard.html";
});

document.querySelector("#forgot").addEventListener(
    "click",
    (event) => {
        event.preventDefault();

        window.alert(
            "Demo: password reset will be available after " +
            "Supabase Auth is connected."
        );
    }
);

document.querySelector("#signup").addEventListener(
    "click",
    (event) => {
        event.preventDefault();

        setDemoUser("creator@gicomm.app");
        window.location.href = "dashboard.html";
    }
);


for (const id of ["googleDemo", "githubDemo"]) {
    document.querySelector(`#${id}`)?.addEventListener("click", () => {
        setDemoUser("demo@gicomm.app");
        window.location.href = "dashboard.html";
    });
}
