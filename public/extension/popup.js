// Popup logic — stores endpoint/token in chrome.storage and POSTs to
// the IDE's extension-bridge edge function.
const $ = (id) => document.getElementById(id);

async function init() {
  const stored = await chrome.storage.local.get(["endpoint", "token"]);
  $("endpoint").value = stored.endpoint || "https://cyberpunk-termux-ide.lovable.app";
  $("token").value = stored.token || "";

  // Pre-fill from current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          selection: String(window.getSelection() || ""),
          title: document.title,
          url: location.href,
        }),
      });
      if (result?.selection) $("selection").value = result.selection;
      $("prompt").placeholder = `Optional instruction (page: ${result?.title || "untitled"})`;
    } catch {}
  }
}

$("send").addEventListener("click", async () => {
  const endpoint = $("endpoint").value.trim().replace(/\/$/, "");
  const token = $("token").value.trim();
  const prompt = $("prompt").value.trim();
  const selection = $("selection").value.trim();
  const status = $("status");

  if (!endpoint || !token) {
    status.textContent = "Endpoint and token are required.";
    status.className = "status err";
    return;
  }

  await chrome.storage.local.set({ endpoint, token });

  $("send").disabled = true;
  status.textContent = "Beaming context…";
  status.className = "status";

  try {
    // Use the Supabase project's functions endpoint directly
    const projectRef = "myzldjuiklczgttasjlx";
    const url = `https://${projectRef}.supabase.co/functions/v1/extension-bridge`;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-cyberpunk-extension": "0.1.0",
      },
      body: JSON.stringify({
        origin_url: tab?.url || null,
        page_title: tab?.title || null,
        selection,
        prompt,
        metadata: { extension_version: "0.1.0" },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    status.textContent = "✓ Sent. Open the IDE chat to see it.";
    status.className = "status ok";
  } catch (e) {
    status.textContent = `✗ ${e instanceof Error ? e.message : "Failed"}`;
    status.className = "status err";
  } finally {
    $("send").disabled = false;
  }
});

init();
