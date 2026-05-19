# 100% Free AI Sidebar

Chrome extension that brings **ChatGPT**, **Claude**, and **Gemini** directly into your browser's side panel.

## Features

- Access ChatGPT, Claude, and Gemini from a single side panel
- Quick toggle with keyboard shortcut (`Ctrl+Shift+Z`)
- Dark theme UI
- No account required — uses the official free web interfaces

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/specimencode/100-free-ai-sidebar.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the cloned folder

## Usage

- Click the extension icon or press `Ctrl+Shift+Z` to open the side panel
- Switch between ChatGPT, Claude, and Gemini using the tabs at the top

## Permissions

| Permission | Reason |
|---|---|
| `sidePanel` | Display the sidebar |
| `declarativeNetRequest` | Handle iframe embedding rules |
| `tabs` | Interact with browser tabs |
| `storage` | Save user preferences |
| `activeTab` | Access the current tab |
| `scripting` | Inject content scripts |

## License

MIT
