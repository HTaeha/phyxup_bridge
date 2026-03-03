(() => {
  "use strict";

  const PREVIEW_MAX_LENGTH = 30;
  const GAP = 10;

  let hostEl = null;
  let shadowRoot = null;
  let cardEl = null;
  let currentText = "";

  // --- Shadow DOM 호스트 생성 (한 번만) ---
  function ensureHost() {
    if (hostEl) return;

    hostEl = document.createElement("div");
    hostEl.id = "phyxup-bridge-host";
    hostEl.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;";
    shadowRoot = hostEl.attachShadow({ mode: "closed" });

    // Shadow DOM 내부에 CSS 삽입
    const style = document.createElement("style");
    style.textContent = CSS_TEXT;
    shadowRoot.appendChild(style);

    document.documentElement.appendChild(hostEl);
  }

  // --- 플로팅 카드 표시 ---
  function showCard(text, x, y) {
    ensureHost();
    hideCard();

    currentText = text;

    const preview =
      text.length > PREVIEW_MAX_LENGTH
        ? text.slice(0, PREVIEW_MAX_LENGTH) + "…"
        : text;

    cardEl = document.createElement("div");
    cardEl.className = "phyxup-floating-card";

    const previewEl = document.createElement("div");
    previewEl.className = "phyxup-preview";
    previewEl.textContent = preview;

    const btn = document.createElement("button");
    btn.className = "phyxup-send-btn";
    btn.textContent = "PhyxUp에 보내기";
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      sendText(currentText);
      hideCard();
    });

    cardEl.appendChild(previewEl);
    cardEl.appendChild(btn);
    shadowRoot.appendChild(cardEl);

    // 위치 보정: 카드 크기를 측정한 뒤 viewport 내에 맞춤
    requestAnimationFrame(() => {
      if (!cardEl) return;

      const rect = cardEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // 기본: 커서 위쪽에 표시
      let posX = x - rect.width / 2;
      let posY = y - rect.height - GAP;

      // 위쪽 공간이 부족하면 아래로
      if (posY < GAP) {
        posY = y + GAP;
      }

      // 좌우 경계 보정
      if (posX < GAP) posX = GAP;
      if (posX + rect.width > vw - GAP) posX = vw - rect.width - GAP;

      // 아래 경계 보정
      if (posY + rect.height > vh - GAP) posY = vh - rect.height - GAP;

      cardEl.style.left = posX + "px";
      cardEl.style.top = posY + "px";
    });
  }

  // --- 카드 숨기기 ---
  function hideCard() {
    if (cardEl) {
      cardEl.remove();
      cardEl = null;
    }
    currentText = "";
  }

  // --- 익스텐션 컨텍스트 유효성 체크 ---
  function isContextValid() {
    try {
      return !!chrome.runtime.id;
    } catch {
      return false;
    }
  }

  // --- Background로 텍스트 전송 ---
  function sendText(text) {
    if (!isContextValid()) {
      showReloadNotice();
      return;
    }
    chrome.runtime.sendMessage({ type: "SEND_TEXT", text }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[PhyxUp] sendMessage error:", chrome.runtime.lastError.message);
        showReloadNotice();
      } else {
        console.log("[PhyxUp] Message sent, response:", response);
      }
    });
  }

  // --- 페이지 새로고침 안내 표시 ---
  function showReloadNotice() {
    hideCard();
    ensureHost();

    const notice = document.createElement("div");
    notice.className = "phyxup-floating-card";
    notice.style.cssText = "left:50%;top:20px;transform:translateX(-50%);";
    notice.innerHTML =
      '<div style="text-align:center;padding:4px 0;">' +
      '<div style="margin-bottom:8px;font-weight:600;">PhyxUp 익스텐션이 업데이트되었습니다</div>' +
      '<button class="phyxup-send-btn" style="background:#e74c3c;">페이지 새로고침</button>' +
      "</div>";
    notice.querySelector("button").addEventListener("click", () => location.reload());
    shadowRoot.appendChild(notice);

    setTimeout(() => notice.remove(), 5000);
  }

  // --- 이벤트 리스너 ---
  document.addEventListener("mouseup", (e) => {
    // 플로팅 UI 내부 클릭이면 무시
    if (hostEl && hostEl.contains(e.target)) return;

    // 약간의 지연으로 선택이 확정된 뒤 확인
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";

      if (text.length > 0 && isContextValid()) {
        showCard(text, e.clientX, e.clientY);
      } else if (text.length > 0 && !isContextValid()) {
        showReloadNotice();
      } else {
        hideCard();
      }
    }, 10);
  });

  document.addEventListener("mousedown", (e) => {
    if (!cardEl) return;

    // Shadow DOM 내부 클릭이면 무시
    const path = e.composedPath();
    if (path.includes(hostEl)) return;

    hideCard();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideCard();
    }
  });

  // --- CSS 텍스트 (content.css 내용을 인라인) ---
  const CSS_TEXT = `
:host {
  all: initial;
}

.phyxup-floating-card {
  position: fixed;
  z-index: 2147483647;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px 14px;
  max-width: 300px;
  min-width: 180px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #333;
  animation: phyxup-fade-in 0.15s ease-out;
  pointer-events: auto;
}

@keyframes phyxup-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.phyxup-preview {
  margin-bottom: 10px;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  line-height: 1.4;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phyxup-send-btn {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: #2eb6ad;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: inherit;
  line-height: 1;
}

.phyxup-send-btn:hover {
  background: #259e96;
}

.phyxup-send-btn:active {
  background: #1f8a83;
}
`;
})();
