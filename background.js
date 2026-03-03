const TARGET_URL = "https://phyxupbridge.vercel.app";

console.log("[PhyxUp] Background service worker loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SEND_TEXT") return;

  console.log("[PhyxUp] Received text:", message.text);

  const text = message.text;
  const timestamp = Date.now();

  // POST to Next.js API
  fetch(`${TARGET_URL}/api/bridge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, timestamp }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("[PhyxUp] Bridge response:", data);
      openOrFocusTarget();
      sendResponse({ ok: true });
    })
    .catch((err) => {
      console.error("[PhyxUp] Bridge POST failed:", err);
      sendResponse({ ok: false, error: err.message });
    });

  // async sendResponse
  return true;
});

function openOrFocusTarget() {
  chrome.tabs.query({}, (tabs) => {
    const existing = tabs.find(
      (tab) => tab.url && tab.url.startsWith(TARGET_URL)
    );

    if (existing) {
      console.log("[PhyxUp] Focusing existing tab:", existing.id);
      chrome.tabs.update(existing.id, { active: true });
      chrome.windows.update(existing.windowId, { focused: true });
    } else {
      console.log("[PhyxUp] Creating new target tab");
      chrome.tabs.create({ url: TARGET_URL });
    }
  });
}
