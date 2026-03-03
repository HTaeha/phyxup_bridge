# PhyxUp Bridge - Chrome Extension 설계

## Context

EMR 사이트에서 텍스트를 드래그(선택)하면 마우스 커서 근처에 플로팅 UI가 나타나고, 클릭 시 해당 텍스트를 특정 타겟 웹사이트에 자동으로 붙여넣는 크롬 익스텐션. 현재 타겟 사이트는 mock 페이지로 구현.

## 파일 구조

```
phyxup_bridge/
├── manifest.json            # Extension manifest (V3)
├── content.js               # 웹페이지에 주입되는 Content Script
├── content.css              # 플로팅 UI 스타일 (Shadow DOM 내부용)
├── background.js            # Service Worker (메시지 중계)
├── mock/
│   └── target.html          # Mock 타겟 페이지 (텍스트 수신/표시)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 핵심 설계

### 1. manifest.json

- Manifest V3 사용
- CSS는 Shadow DOM 내부에서 직접 주입하므로 `css` 배열은 비워둠
- `storage` 권한으로 선택 텍스트를 타겟 탭에 전달

### 2. Content Script (`content.js`) - 플로팅 UI

**Shadow DOM으로 스타일 격리:**
- 호스트 페이지 CSS와 충돌 방지를 위해 Shadow DOM 사용
- `document.createElement('div')` → `attachShadow({mode: 'closed'})` → 내부에 UI 렌더링

**텍스트 선택 감지:**
- `document.addEventListener('mouseup', handler)` 로 선택 완료 감지
- `window.getSelection().toString().trim()` 으로 선택 텍스트 추출
- 빈 문자열이면 UI 숨김

**커서 위치에 UI 표시:**
- `mouseup` 이벤트의 `e.clientX`, `e.clientY` 사용
- 화면 경계 넘침 방지: viewport 크기와 비교하여 위치 보정
- 선택 텍스트 위쪽에 표시 (커서 Y - UI높이 - 간격)

**UI 구성:**
- 작은 카드형 팝업 (최대 너비 300px)
- 선택 텍스트 미리보기 (30자 초과 시 말줄임)
- "PhyxUp에 보내기" 버튼
- 클릭 시 `chrome.runtime.sendMessage()` 로 Background에 전달

**UI 제거 조건:**
- 다른 곳 클릭 시 (mousedown on document)
- ESC 키 입력 시
- 새로운 텍스트 선택 시 기존 UI 교체

### 3. Background Service Worker (`background.js`)

**메시지 수신 및 처리:**
```
Content Script → sendMessage({type: "SEND_TEXT", text: "..."})
  → Background 수신
  → chrome.storage.local.set({bridgeText: text, timestamp: Date.now()})
  → 타겟 탭 찾기 또는 새로 열기
  → 타겟 탭에 storage 변경 이벤트로 텍스트 전달
```

**타겟 탭 관리:**
- `chrome.tabs.query()` 로 mock 타겟 페이지가 열려있는지 확인
- 없으면 `chrome.tabs.create()` 로 새 탭 열기
- 있으면 해당 탭으로 포커스 이동

### 4. Mock 타겟 페이지 (`mock/target.html`)

- 단순 HTML 페이지 (extension 내부 페이지로 `chrome-extension://` URL)
- `chrome.storage.onChanged` 리스너로 텍스트 수신
- 수신된 텍스트를 입력 필드에 자동 채움
- 히스토리 목록으로 이전 전송 텍스트 표시

### 5. 통신 흐름 요약

```
[EMR 페이지에서 텍스트 드래그]
  ↓ mouseup 이벤트
[Content Script: 플로팅 UI 표시]
  ↓ "보내기" 버튼 클릭
[Content Script → chrome.runtime.sendMessage()]
  ↓
[Background SW: 메시지 수신]
  ↓ chrome.storage.local.set({bridgeText})
  ↓ 타겟 탭 열기/포커스
[Mock Target Page: storage.onChanged로 수신]
  ↓ 입력 필드에 텍스트 채움
```

## 검증 방법

1. `chrome://extensions` → 개발자 모드 → "압축해제된 확장 프로그램을 로드합니다" 로 프로젝트 폴더 로드
2. 아무 웹페이지에서 텍스트 드래그 → 커서 근처에 플로팅 UI 표시 확인
3. "보내기" 클릭 → mock 타겟 페이지가 열리고 텍스트가 입력 필드에 채워지는지 확인
4. 여러 번 전송 → 히스토리 목록에 쌓이는지 확인
