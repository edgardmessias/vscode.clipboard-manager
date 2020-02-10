# Clipboard Manager

[![Version](https://vsmarketplacebadge.apphb.com/version-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)
[![Ratings](https://vsmarketplacebadge.apphb.com/rating-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)

[![Dependencies Status](https://david-dm.org/edgardmessias/vscode.clipboard-manager/status.svg)](https://david-dm.org/edgardmessias/vscode.clipboard-manager)
[![DevDependencies Status](https://david-dm.org/edgardmessias/vscode.clipboard-manager/dev-status.svg)](https://david-dm.org/edgardmessias/vscode.clipboard-manager?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/edgardmessias/vscode.clipboard-manager.svg)](https://greenkeeper.io/)

[![Coverage Status](https://codecov.io/gh/edgardmessias/vscode.clipboard-manager/branch/master/graph/badge.svg)](https://codecov.io/gh/edgardmessias/vscode.clipboard-manager)
[![Known Vulnerabilities](https://snyk.io/test/github/edgardmessias/vscode.clipboard-manager/badge.svg)](https://snyk.io/test/github/edgardmessias/vscode.clipboard-manager)

[![Average time to resolve an issue](https://isitmaintained.com/badge/resolution/edgardmessias/vscode.clipboard-manager.svg)](https://isitmaintained.com/project/edgardmessias/vscode.clipboard-manager "Average time to resolve an issue")
[![Percentage of issues still open](https://isitmaintained.com/badge/open/edgardmessias/vscode.clipboard-manager.svg)](https://isitmaintained.com/project/edgardmessias/vscode.clipboard-manager "Percentage of issues still open")

Keep a history of your copied and cut items and re-paste, without override the `Ctrl+C` and `Ctrl+V` keyboard shortcuts.

To pick a copied item, only run `Ctrl+Shift+V`

## Features

1. Save history of all copied and cut items
1. Can check copied items outside the VSCode (`"clipboard-manager.onlyWindowFocused": false`)
1. Paste from history (`Ctrl+Shift+V` => Pick and Paste)
1. Preview the paste
1. Snippets to paste (Ex. `clip01, clip02, ...`)
1. Remove selected item from history
1. Clear all history
1. Open copy location
1. Double click in history view to paste

## Extension Settings

This extension contributes the following settings (default values):

<!--begin-settings-->
```js
{
  // Avoid duplicate clips in the list
  "clipboard-manager.avoidDuplicates": true,

  // Time in milliseconds to check changes in clipboard. Set zero to disable.
  "clipboard-manager.checkInterval": 500,

  // Maximum clipboard size in bytes.
  "clipboard-manager.maxClipboardSize": 1000000,

  // Maximum number of clips to save in clipboard
  "clipboard-manager.maxClips": 100,

  // Move used clip to top in the list
  "clipboard-manager.moveToTop": true,

  // Get clips only from VSCode
  "clipboard-manager.onlyWindowFocused": true,

  // View a preview while you are choosing the clip
  "clipboard-manager.preview": true,

  // Set location to save the clipboard file, set false to disable
  "clipboard-manager.saveTo": null,

  // Enable completion snippets
  "clipboard-manager.snippet.enabled": true,

  // Maximum number of clips to suggests in snippets (Zero for all)
  "clipboard-manager.snippet.max": 10,

  // Default prefix for snippets completion (clip1, clip2, ...)
  "clipboard-manager.snippet.prefix": "clip"
}
```
<!--end-settings-->

## Examples

Copy to history:
![Clipboard Manager - Copy](screenshots/copy.gif)

Pick and Paste:
![Clipboard Manager - Pick and Paste](screenshots/pick-and-paste.gif)

