const inputEl = document.getElementById("bridge-input");
const statusEl = document.getElementById("status");
const historyListEl = document.getElementById("history-list");
const emptyStateEl = document.getElementById("empty-state");

// storage 변경 감지
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  if (changes.bridgeText) {
    const text = changes.bridgeText.newValue;
    setCurrentText(text);
  }

  if (changes.bridgeHistory) {
    renderHistory(changes.bridgeHistory.newValue);
  }
});

// 초기 로드 시 기존 데이터 표시
chrome.storage.local.get(
  { bridgeText: "", bridgeTimestamp: 0, bridgeHistory: [] },
  (result) => {
    if (result.bridgeText) {
      inputEl.value = result.bridgeText;
      statusEl.textContent = formatTime(result.bridgeTimestamp);
    }
    renderHistory(result.bridgeHistory);
  }
);

function setCurrentText(text) {
  inputEl.value = text;

  // 시각적 피드백
  inputEl.classList.add("flash");
  setTimeout(() => inputEl.classList.remove("flash"), 800);

  statusEl.textContent = "방금 수신됨";
  statusEl.className = "status received";
  setTimeout(() => {
    statusEl.className = "status";
  }, 3000);
}

function renderHistory(history) {
  if (!history || history.length === 0) {
    historyListEl.innerHTML = "";
    historyListEl.appendChild(emptyStateEl);
    emptyStateEl.style.display = "";
    return;
  }

  emptyStateEl.style.display = "none";
  historyListEl.innerHTML = "";

  history.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const textSpan = document.createElement("span");
    textSpan.className = "history-text";
    textSpan.textContent = item.text;

    const timeSpan = document.createElement("span");
    timeSpan.className = "history-time";
    timeSpan.textContent = formatTime(item.timestamp);

    li.appendChild(textSpan);
    li.appendChild(timeSpan);
    historyListEl.appendChild(li);
  });
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
