// Lightweight floating "Send to Cyberpunk Termux" button on supported AI chat sites.
// Appears only after the user makes a text selection. Click → drops the selected
// text into the IDE inbox via the background service worker.
(function () {
  if (window.__cyberpunkTermuxBridgeLoaded) return;
  window.__cyberpunkTermuxBridgeLoaded = true;

  const btn = document.createElement("button");
  btn.textContent = "⚡ Send to Cyberpunk Termux";
  Object.assign(btn.style, {
    position: "fixed",
    zIndex: 2147483647,
    bottom: "24px",
    right: "24px",
    padding: "10px 14px",
    background: "linear-gradient(90deg, #39ff14, #8b5cf6)",
    color: "#0a0a0f",
    border: "0",
    borderRadius: "6px",
    fontFamily: "ui-monospace, monospace",
    fontWeight: "700",
    fontSize: "12px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "0 4px 18px rgba(57,255,20,0.35)",
    display: "none",
  });
  document.documentElement.appendChild(btn);

  document.addEventListener("selectionchange", () => {
    const sel = String(window.getSelection() || "").trim();
    btn.style.display = sel.length > 8 ? "block" : "none";
  });

  btn.addEventListener("click", async () => {
    const selection = String(window.getSelection() || "").trim();
    if (!selection) return;
    const { token } = await chrome.storage.local.get(["token"]);
    if (!token) {
      alert("Open the Cyberpunk Termux Bridge popup and link your IDE account first.");
      return;
    }
    const projectRef = "myzldjuiklczgttasjlx";
    const url = `https://${projectRef}.supabase.co/functions/v1/extension-bridge`;
    btn.textContent = "Beaming…";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-cyberpunk-extension": "0.2.0",
        },
        body: JSON.stringify({
          origin_url: location.href,
          page_title: document.title,
          selection,
          prompt: null,
          metadata: { via: "content-script" },
        }),
      });
      btn.textContent = res.ok ? "✓ Sent" : "✗ Failed";
    } catch {
      btn.textContent = "✗ Failed";
    } finally {
      setTimeout(() => (btn.textContent = "⚡ Send to Cyberpunk Termux"), 1800);
    }
  });
})();
