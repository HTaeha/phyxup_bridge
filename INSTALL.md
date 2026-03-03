# PhyxUp Bridge - Chrome Extension Installation Guide

## What it does

Drag to select text on an EMR page and a **"PhyxUp에 보내기"** (Send to PhyxUp) button will appear.
Click the button and the text is sent to the PhyxUp web app (https://phyxupbridge.vercel.app) for automatic analysis.

## Installation

### 1. Unzip

Extract the `phyxup-bridge-extension.zip` file to any location on your computer.

The folder should contain these files:

```
phyxup-bridge-extension/
├── manifest.json
├── background.js
├── content.js
├── content.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 2. Load the extension in Chrome

1. Go to `chrome://extensions` in Chrome
2. Toggle **Developer mode** on (top-right corner)
3. Click **"Load unpacked"**
4. Select the unzipped folder

### 3. Usage

1. On any EMR page, **drag to select** the text you want to analyze
2. Click the **"PhyxUp에 보내기"** button that appears near your selection
3. A PhyxUp web app tab will open automatically and display the analysis results

## Troubleshooting

| Symptom | Solution |
|---------|----------|
| "PhyxUp 익스텐션이 업데이트되었습니다" notice appears | Refresh the EMR page |
| Button does not appear | Check that PhyxUp Bridge is enabled at `chrome://extensions` |
| Nothing happens after clicking send | Open DevTools (F12) > Console tab and look for `[PhyxUp]` logs |

## Notes

- This extension is not published on the Chrome Web Store, so **Developer mode** must be enabled.
- After restarting Chrome, you may see a "Disable developer mode extensions" popup. You can dismiss it.
