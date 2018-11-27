# Clipboard Manager

[![Version](https://vsmarketplacebadge.apphb.com/version-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)
[![Ratings](https://vsmarketplacebadge.apphb.com/rating-short/EdgardMessias.clipboard-manager.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.clipboard-manager)

[![Build Status](https://travis-ci.org/edgardmessias/vscode.clipboard-manager.svg?branch=master)](https://travis-ci.org/edgardmessias/vscode.clipboard-manager)
[![Build Status](https://ci.appveyor.com/api/projects/status/github/edgardmessias/vscode.clipboard-manager?branch=master&svg=true)](https://ci.appveyor.com/project/edgardmessias/vscode.clipboard-manager)

[![Dependencies Status](https://david-dm.org/edgardmessias/vscode.clipboard-manager/status.svg)](https://david-dm.org/edgardmessias/vscode.clipboard-manager)
[![DevDependencies Status](https://david-dm.org/edgardmessias/vscode.clipboard-manager/dev-status.svg)](https://david-dm.org/edgardmessias/vscode.clipboard-manager?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/edgardmessias/vscode.clipboard-manager.svg)](https://greenkeeper.io/)

[![Known Vulnerabilities](https://snyk.io/test/github/edgardmessias/vscode.clipboard-manager/badge.svg)](https://snyk.io/test/github/edgardmessias/vscode.clipboard-manager)

[![Average time to resolve an issue](https://isitmaintained.com/badge/resolution/edgardmessias/vscode.clipboard-manager.svg)](https://isitmaintained.com/project/edgardmessias/vscode.clipboard-manager "Average time to resolve an issue")
[![Percentage of issues still open](https://isitmaintained.com/badge/open/edgardmessias/vscode.clipboard-manager.svg)](https://isitmaintained.com/project/edgardmessias/vscode.clipboard-manager "Percentage of issues still open")

Keep a history of your copied and cut items and re-paste.

## Features

1. Save history of all copied and cut items
1. Paste from history
1. Snippets to paste

## Extension Settings

This extension contributes the following settings:

* `clipboard-manager.checkInterval`: Time in milliseconds to check changes in clipboard
* `clipboard-manager.maxClips`: Maximum number of clips to save in clipboard
* `clipboard-manager.maxSnippets`: Maximum number of clips to suggests in snippets
* `clipboard-manager.avoidDuplicates`: Avoid duplicate clips in the list
* `clipboard-manager.moveToTop`: Move used clip to top int the list
* `clipboard-manager.onlyWindowFocused`: Get clips only from VSCode
* `clipboard-manager.snippetPrefix`: Default prefix for snippets completion (clip1, clip2, ...)
