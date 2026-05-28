// Right-click context menu: "Send selection to Cyberpunk Termux"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-cyberpunk-termux",
    title: "⚡ Send to Cyberpunk Termux",
    contexts: ["selection", "page"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "send-to-cyberpunk-termux") return;
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) {
    chrome.action.openPopup?.();
    return;
  }

  const projectRef = "myzldjuiklczgttasjlx";
  const url = `https://${projectRef}.supabase.co/functions/v1/extension-bridge`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-cyberpunk-extension": "0.1.0",
      },
      body: JSON.stringify({
        origin_url: tab?.url || null,
        page_title: tab?.title || null,
        selection: info.selectionText || null,
        prompt: null,
        metadata: { via: "context-menu" },
      }),
    });
  } catch (e) {
    console.error("[cyberpunk-bridge]", e);
  }
});
