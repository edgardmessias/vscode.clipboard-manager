# Clipboard Manager

[![Version](https://vsmarketplacebadges.dev/version-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)
[![Installs](https://vsmarketplacebadges.dev/installs-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)
[![Ratings](https://vsmarketplacebadges.dev/rating-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)

[![Build Status](https://img.shields.io/github/workflow/status/edgardmessias/vscode.clipboard-manager/test.svg)](https://github.com/edgardmessias/vscode.clipboard-manager/actions)
[![Lint Status](https://img.shields.io/github/workflow/status/edgardmessias/vscode.clipboard-manager/lint.svg?label=lint)](https://github.com/edgardmessias/vscode.clipboard-manager/actions)
[![release-it](https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-release--it-e10079.svg)](https://github.com/release-it/release-it)

[![Dependencies Status](https://david-dm.org/edgardmessias/vscode.clipboard-manager/status.svg)](https://david-dm.org/edgardmessias/vscode.clipboard-manager)
[![DevDependencies Status](https://david-dm.org/edgardmessias/vscode.clipboard-manager/dev-status.svg)](https://david-dm.org/edgardmessias/vscode.clipboard-manager?type=dev)
[![Dependabot badge](https://badgen.net/dependabot/edgardmessias/vscode.clipboard-manager/?icon=dependabot)](https://dependabot.com/)

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

# Donation
* Donation is as per your goodwill to support my development.
* If you are interested in my future developments, i would really appreciate a small donation to support this project.
<table border="0">
 <tr>
    <td align="center">
    PayPal <br>
       <img src="https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=https://www.paypal.com/donate?hosted_button_id=5KHYY5ZDTNDSY"> <br>
       <a href="https://www.paypal.com/donate?hosted_button_id=5KHYY5ZDTNDSY">
          <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif">
       </a>
    </td>
    <td align="center">
       Pix (Brazil) <br>
       <img src="https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=00020126680014BR.GOV.BCB.PIX013628571c52-8b9b-416c-a18f-8e52460608810206Doa%C3%A7%C3%A3o5204000053039865802BR5923Edgard%20Lorraine%20Messias6009SAO%20PAULO61080540900062160512NU50UnEaVM0H63042A45"> <br>
       28571c52-8b9b-416c-a18f-8e5246060881
    </td>
 </tr>
</table>
