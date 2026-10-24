// Cyberpunk Termux Bridge service worker
// - Right-click context menu to beam selection to the IDE
// - Periodic poll for outbound IDE responses → desktop notification
const PROJECT_REF = "myzldjuiklczgttasjlx";
const FN = `https://${PROJECT_REF}.supabase.co/functions/v1`;
const SEEN_KEY = "seen_outbound_ids";
const POLL_ALARM = "cyberpunk-bridge-poll";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-cyberpunk-termux",
    title: "⚡ Send to Cyberpunk Termux",
    contexts: ["selection", "page"],
  });
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: 1 });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "send-to-cyberpunk-termux") return;
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) {
    chrome.action.openPopup?.();
    return;
  }
  try {
    const res = await fetch(`${FN}/extension-bridge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-cyberpunk-extension": "0.2.0",
      },
      body: JSON.stringify({
        origin_url: tab?.url || null,
        page_title: tab?.title || null,
        selection: info.selectionText || null,
        prompt: null,
        metadata: { via: "context-menu" },
      }),
    });
    if (!res.ok) throw new Error(`Context send failed (HTTP ${res.status})`);
    chrome.notifications?.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Cyberpunk Termux",
      message: "Selection beamed to IDE.",
    });
  } catch (e) {
    console.error("[cyberpunk-bridge]", e);
  }
});

// Poll the IDE for outbound responses (IDE → extension round-trip)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== POLL_ALARM) return;
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) return;
  try {
    const res = await fetch(
      `${FN}/extension-bridge?include_outbound=1&unconsumed=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    if (!data?.items) return;
    const outbound = data.items.filter((i) => i.direction === "outbound" && i.response);
    if (!outbound.length) return;

    const { [SEEN_KEY]: seenObj = {} } = await chrome.storage.local.get([SEEN_KEY]);
    const fresh = outbound.filter((i) => !seenObj[i.id]);
    if (!fresh.length) return;

    for (const item of fresh.slice(0, 3)) {
      chrome.notifications?.create(`bridge-${item.id}`, {
        type: "basic",
        iconUrl: "icon.png",
        title: "IDE response",
        message: (item.response || "").slice(0, 180),
      });
      seenObj[item.id] = Date.now();
    }
    await chrome.storage.local.set({ [SEEN_KEY]: seenObj });
  } catch (e) {
    console.error("[cyberpunk-bridge poll]", e);
  }
});
