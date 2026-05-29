// Cyberpunk Termux Bridge popup
// One-tap device-code OAuth-style link with the IDE — no long-lived token pasting.

const PROJECT_REF = "myzldjuiklczgttasjlx";
const FN = `https://${PROJECT_REF}.supabase.co/functions/v1`;
const $ = (id) => document.getElementById(id);

let pollTimer = null;

async function getStored() {
  return chrome.storage.local.get(["token", "userId"]);
}

async function renderState() {
  const { token, userId } = await getStored();
  if (token) {
    $("unlinked").classList.add("hidden");
    $("linked-area").classList.remove("hidden");
    $("linked-user").textContent = userId ? userId.slice(0, 8) + "…" : "user";
    // pre-fill selection
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            selection: String(window.getSelection() || ""),
            title: document.title,
            url: location.href,
          }),
        });
        if (result?.selection) $("selection").value = result.selection;
      }
    } catch {}
  } else {
    $("unlinked").classList.remove("hidden");
    $("linked-area").classList.add("hidden");
  }
}

async function startLink() {
  $("link-btn").disabled = true;
  $("status").textContent = "Minting link code…";
  $("status").className = "status";
  try {
    const res = await fetch(`${FN}/extension-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Failed to start link");
    $("link-code-block").classList.remove("hidden");
    $("link-code").textContent = data.code;
    chrome.tabs.create({ url: data.verification_url });
    pollLink(data.code);
  } catch (e) {
    $("status").textContent = `✗ ${e.message}`;
    $("status").className = "status err";
    $("link-btn").disabled = false;
  }
}

function pollLink(code) {
  let elapsed = 0;
  pollTimer = setInterval(async () => {
    elapsed += 2;
    if (elapsed > 300) {
      clearInterval(pollTimer);
      $("status").textContent = "✗ Link request expired";
      $("status").className = "status err";
      $("link-btn").disabled = false;
      return;
    }
    try {
      const res = await fetch(`${FN}/extension-link?action=poll&code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.status === "approved") {
        clearInterval(pollTimer);
        await chrome.storage.local.set({
          token: data.access_token,
          userId: data.user_id,
        });
        $("status").textContent = "✓ Linked!";
        $("status").className = "status ok";
        await renderState();
      }
    } catch {}
  }, 2000);
}

async function unlink() {
  if (pollTimer) clearInterval(pollTimer);
  await chrome.storage.local.remove(["token", "userId"]);
  $("link-btn").disabled = false;
  $("link-code-block").classList.add("hidden");
  $("status").textContent = "Unlinked";
  await renderState();
}

async function send() {
  const { token } = await getStored();
  if (!token) {
    $("status").textContent = "Not linked yet";
    $("status").className = "status err";
    return;
  }
  $("send").disabled = true;
  $("status").textContent = "Beaming context…";
  $("status").className = "status";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
        selection: $("selection").value.trim(),
        prompt: $("prompt").value.trim(),
        metadata: { extension_version: "0.2.0", via: "popup" },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    $("status").textContent = "✓ Sent. Open the IDE to see it.";
    $("status").className = "status ok";
  } catch (e) {
    $("status").textContent = `✗ ${e.message}`;
    $("status").className = "status err";
  } finally {
    $("send").disabled = false;
  }
}

$("link-btn").addEventListener("click", startLink);
$("unlink").addEventListener("click", unlink);
$("send").addEventListener("click", send);
renderState();
