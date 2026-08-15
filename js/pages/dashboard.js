import {
    getTheme,
    setTheme,
    clearDemoUser,
} from "../components/storage.js";
import {
    setTheme as applyTheme,
} from "../components/ui.js";

const tabs = {
    Overview: {
        title: "Recent activity",
        subtitle: "Latest updates from your demo workspace.",
        content: `
            <div class="activities">
                <div><i></i><b>Purchased</b><span>Minimal UI Kit</span><time>2h ago</time></div>
                <div><i></i><b>Saved</b><span>Creator Workspace</span><time>Yesterday</time></div>
                <div><i></i><b>Published</b><span>Personal Finance Template</span><time>3d ago</time></div>
                <div><i></i><b>Viewed</b><span>3D Studio Objects</span><time>1w ago</time></div>
            </div>
        `,
    },
    "My Library": {
        title: "My Library",
        subtitle: "18 items saved in your demo library.",
        content: `
            <div style="padding:20px 0;">
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;">
                    <div style="padding:15px;border:1px solid var(--line);border-radius:12px;"><span style="font-size:9px;color:var(--muted);">UI</span><p style="font-size:11px;margin:8px 0 0;"><b>Minimal UI Kit</b><br/><small style="color:var(--muted);">★4.9 • \$12</small></p></div>
                    <div style="padding:15px;border:1px solid var(--line);border-radius:12px;"><span style="font-size:9px;color:var(--muted);">N</span><p style="font-size:11px;margin:8px 0 0;"><b>Creator Workspace</b><br/><small style="color:var(--muted);">★4.8 • \$8</small></p></div>
                    <div style="padding:15px;border:1px solid var(--line);border-radius:12px;"><span style="font-size:9px;color:var(--muted);">3D</span><p style="font-size:11px;margin:8px 0 0;"><b>Studio Objects</b><br/><small style="color:var(--muted);">★4.9 • \$10</small></p></div>
                </div>
            </div>
        `,
    },
    Saved: {
        title: "Saved",
        subtitle: "6 products you have saved.",
        content: `
            <div class="activities" style="padding-top:0;">
                <div><i></i><b>Minimal UI Kit</b><span>Design</span><time>Saved 2 weeks ago</time></div>
                <div><i></i><b>Creator Workspace</b><span>Productivity</span><time>Saved 1 month ago</time></div>
                <div><i></i><b>Motion Design Pack</b><span>Design</span><time>Saved 1 month ago</time></div>
                <div><i></i><b>Code Components</b><span>Development</span><time>Saved 2 months ago</time></div>
            </div>
        `,
    },
    Orders: {
        title: "Orders",
        subtitle: "12 demo orders completed.",
        content: `
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
                <tr style="border-bottom:1px solid var(--line);">
                    <th style="text-align:left;padding:12px 0;font-weight:600;">Product</th>
                    <th style="text-align:left;padding:12px 0;font-weight:600;">Amount</th>
                    <th style="text-align:left;padding:12px 0;font-weight:600;">Date</th>
                    <th style="text-align:left;padding:12px 0;font-weight:600;">Status</th>
                </tr>
                <tr style="border-bottom:1px solid var(--line);"><td style="padding:12px 0;">Minimal UI Kit</td><td>\$12.00</td><td>Aug 13</td><td><span style="background:var(--band);padding:4px 8px;border-radius:4px;font-size:9px;">Delivered</span></td></tr>
                <tr style="border-bottom:1px solid var(--line);"><td style="padding:12px 0;">Creator Workspace</td><td>\$8.00</td><td>Aug 12</td><td><span style="background:var(--band);padding:4px 8px;border-radius:4px;font-size:9px;">Delivered</span></td></tr>
                <tr style="border-bottom:1px solid var(--line);"><td style="padding:12px 0;">Studio Objects 3D</td><td>\$10.00</td><td>Aug 10</td><td><span style="background:var(--band);padding:4px 8px;border-radius:4px;font-size:9px;">Delivered</span></td></tr>
            </table>
        `,
    },
    Selling: {
        title: "Selling",
        subtitle: "3 demo products are currently live.",
        content: `
            <div style="padding:20px 0;">
                <div style="display:grid;grid-template-columns:1fr;gap:15px;">
                    <div style="padding:18px;border:1px solid var(--line);border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <p style="margin:0;font-weight:600;font-size:12px;">Advanced Dashboard Template</p>
                            <small style="color:var(--muted);font-size:9px;">Development • \$29 • 145 sales</small>
                        </div>
                        <button style="border:0;background:none;color:var(--muted);cursor:pointer;font-size:14px;">⋮</button>
                    </div>
                    <div style="padding:18px;border:1px solid var(--line);border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <p style="margin:0;font-weight:600;font-size:12px;">Notion Productivity System</p>
                            <small style="color:var(--muted);font-size:9px;">Productivity • \$19 • 89 sales</small>
                        </div>
                        <button style="border:0;background:none;color:var(--muted);cursor:pointer;font-size:14px;">⋮</button>
                    </div>
                </div>
            </div>
        `,
    },
    Settings: {
        title: "Settings",
        subtitle: "Manage your demo account preferences.",
        content: `
            <div style="padding:20px 0;">
                <div style="margin-bottom:20px;">
                    <label style="display:block;font-size:10px;font-weight:600;margin-bottom:8px;">Email Notifications</label>
                    <div style="display:flex;align-items:center;gap:10px;"><input type="checkbox" checked style="width:16px;height:16px;cursor:pointer;"/> <span style="font-size:11px;">Receive order updates</span></div>
                    <div style="display:flex;align-items:center;gap:10px;margin-top:8px;"><input type="checkbox" checked style="width:16px;height:16px;cursor:pointer;"/> <span style="font-size:11px;">Receive sales notifications</span></div>
                </div>
                <div style="padding-top:20px;border-top:1px solid var(--line);">
                    <label style="display:block;font-size:10px;font-weight:600;margin-bottom:8px;">Privacy</label>
                    <div style="display:flex;align-items:center;gap:10px;"><input type="checkbox" style="width:16px;height:16px;cursor:pointer;"/> <span style="font-size:11px;">Make profile public</span></div>
                    <div style="display:flex;align-items:center;gap:10px;margin-top:8px;"><input type="checkbox" checked style="width:16px;height:16px;cursor:pointer;"/> <span style="font-size:11px;">Allow direct messages</span></div>
                </div>
            </div>
        `,
    },
};

const tabTitle = document.querySelector("#tabTitle");
const tabSubtitle = document.querySelector("#tabSub");
const activitiesContainer = document.querySelector(".activities");

document.querySelectorAll("[data-tab]").forEach(
    (button) => {
        button.addEventListener("click", () => {
            document
                .querySelectorAll("[data-tab]")
                .forEach((item) =>
                    item.classList.remove("active")
                );

            button.classList.add("active");

            const tabData =
                tabs[button.dataset.tab];

            tabTitle.textContent = tabData.title;
            tabSubtitle.textContent = tabData.subtitle;

            if (activitiesContainer) {
                activitiesContainer.innerHTML = tabData.content;
            }
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
