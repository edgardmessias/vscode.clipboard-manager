# [1.7.0](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.6.1...v1.7.0) (2026-08-12)


### Features

* add status bar indicator ([3760a9c](https://github.com/edgardmessias/vscode.clipboard-manager/commit/3760a9c81b4b90b6bbf996ba450f217bcc9de2f3)), closes [#279](https://github.com/edgardmessias/vscode.clipboard-manager/issues/279)
* ban clips by content hash with SecretStorage ([963a847](https://github.com/edgardmessias/vscode.clipboard-manager/commit/963a847ef61663fd2b9f90dc6323912fa6080caf)), closes [#269](https://github.com/edgardmessias/vscode.clipboard-manager/issues/269)
* exclude captures by file glob patterns ([2297f6d](https://github.com/edgardmessias/vscode.clipboard-manager/commit/2297f6db921589b4ff29c83f27fb6e907aeb0dd3)), closes [#274](https://github.com/edgardmessias/vscode.clipboard-manager/issues/274)
* pause and resume clipboard capture ([b38eaa6](https://github.com/edgardmessias/vscode.clipboard-manager/commit/b38eaa6a68cbb05d1d45e36c41052003e95f5282)), closes [#273](https://github.com/edgardmessias/vscode.clipboard-manager/issues/273)
* show compact relative timestamps in history ([5e7a17a](https://github.com/edgardmessias/vscode.clipboard-manager/commit/5e7a17a9be5b059cc378e1ae9b47a8edcf5f1809)), closes [#277](https://github.com/edgardmessias/vscode.clipboard-manager/issues/277)

## [1.6.1](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.6.0...v1.6.1) (2026-08-12)


### Bug Fixes

* include production dependencies in VSIX package ([b6ab66e](https://github.com/edgardmessias/vscode.clipboard-manager/commit/b6ab66ed720707b37242d9d93825e53b51bd6fd4)), closes [#268](https://github.com/edgardmessias/vscode.clipboard-manager/issues/268)

# [1.6.0](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.5.0...v1.6.0) (2026-08-10)

# 1.6.0-rc.1 (2026-08-10)


### Features

* add settings screen to clipboard history webview ([f1eb6c6](https://github.com/edgardmessias/vscode.clipboard-manager/commit/f1eb6c665e124bc74bae0dc79580da6019d6f525))
* **storage:** migrate clipboard history to append-log persistence ([d6b92f7](https://github.com/edgardmessias/vscode.clipboard-manager/commit/d6b92f75f87331884a35eb300d54fd13e3a6076d)), closes [#233](https://github.com/edgardmessias/vscode.clipboard-manager/issues/233) [#263](https://github.com/edgardmessias/vscode.clipboard-manager/issues/263)
* **ui:** replace clipboard history tree with React webview panel ([8ec6c0f](https://github.com/edgardmessias/vscode.clipboard-manager/commit/8ec6c0f964a68215d3467f57b8523efc761a2645))

# [1.5.0](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.4.2...v1.5.0) (2023-03-17)


### Bug Fixes

* Fixed paste preview issue ([#256](https://github.com/edgardmessias/vscode.clipboard-manager/issues/256), fix [#255](https://github.com/edgardmessias/vscode.clipboard-manager/issues/255)) ([401265f](https://github.com/edgardmessias/vscode.clipboard-manager/commit/401265f5149cbba7758382c47785dd8a8f9a694c))
* Updated the minimal VSCode to 1.65.0 ([b923a1b](https://github.com/edgardmessias/vscode.clipboard-manager/commit/b923a1b5e33efc95e000a74e84a2ffc3fd67c74f))

## [1.4.2](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.4.1...v1.4.2) (2020-04-03)


### Bug Fixes

* Added inline button to remove item (close [#48](https://github.com/edgardmessias/vscode.clipboard-manager/issues/48)) ([9062ea0](https://github.com/edgardmessias/vscode.clipboard-manager/commit/9062ea0eadec8aedab4ddfdecf72ee651848a615))
* Added prompt before clear all history ([d3aab06](https://github.com/edgardmessias/vscode.clipboard-manager/commit/d3aab06fb3e8ff62c5ef55209a8473c86698fa6c))

## [1.4.1](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.4.0...v1.4.1) (2020-02-11)


### Bug Fixes

* Allow only to run on local OS (close [#40](https://github.com/edgardmessias/vscode.clipboard-manager/issues/40)) ([e6d9e9a](https://github.com/edgardmessias/vscode.clipboard-manager/commit/e6d9e9add9168e51bc12293fb0888631c94c299c))

# [1.4.0](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.3.0...v1.4.0) (2020-02-10)


### Features

* Added option to limit size of clipboard ([3ae3427](https://github.com/edgardmessias/vscode.clipboard-manager/commit/3ae3427f94518451d5f4604193537cf7eb2b885e))

# [1.3.0](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.2.1...v1.3.0) (2020-02-07)


### Bug Fixes

* Fixed configuration reload for monitor (checkInterval and onlyWindowFocused) ([5a3e3a7](https://github.com/edgardmessias/vscode.clipboard-manager/commit/5a3e3a7ad215c3576984703a29d566a8b865f5f1))


### Features

* Added shortcut key to copy to clipboard history (close [#26](https://github.com/edgardmessias/vscode.clipboard-manager/issues/26)) ([0d24eab](https://github.com/edgardmessias/vscode.clipboard-manager/commit/0d24eabd6c7c03acafb54e46f41b3b02bb030ac1))

## [1.2.1](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.2.0...v1.2.1) (2020-02-06)


### Bug Fixes

* Fixed shortcut for MacOs (close [#27](https://github.com/edgardmessias/vscode.clipboard-manager/issues/27)) ([3be9b73](https://github.com/edgardmessias/vscode.clipboard-manager/commit/3be9b73a403c4f365d5a2dcfa6bbecd119155587))

# [1.2.0](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.1.0...v1.2.0) (2020-02-06)


### Bug Fixes

* Fix travis/appveyor error on downloading VS Code ([8afa9bc](https://github.com/edgardmessias/vscode.clipboard-manager/commit/8afa9bc79caf4cccbda26107c3519cbec1a45084))
* Fixed pick and paste for multi cursor selection (close [#23](https://github.com/edgardmessias/vscode.clipboard-manager/issues/23)) ([5205112](https://github.com/edgardmessias/vscode.clipboard-manager/commit/5205112d642396ff973e0861fc3ec7599b42ae68))
* **package:** update clipboardy to version 2.0.0 ([0f80945](https://github.com/edgardmessias/vscode.clipboard-manager/commit/0f809450424f53be80a6e2cc55eba7dcacd4f561))
* Show command to clear clipboard history ([9fc3fe2](https://github.com/edgardmessias/vscode.clipboard-manager/commit/9fc3fe289e233301315bf34fa066e1c869cf159b))


### Features

* Added option to set path for clipboard file ([0039f84](https://github.com/edgardmessias/vscode.clipboard-manager/commit/0039f84cdc7301cdf2c5642f697127aa5832f667))
* Added option to set path for clipboard file (close [#25](https://github.com/edgardmessias/vscode.clipboard-manager/issues/25)) ([bedd470](https://github.com/edgardmessias/vscode.clipboard-manager/commit/bedd4707d551fed57847e4d3dbe4d767c5a03568))

# [1.1.0](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.0.2...v1.1.0) (2018-12-11)

## [1.0.2](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.0.1...v1.0.2) (2018-12-10)

## [1.0.1](https://github.com/edgardmessias/vscode.clipboard-manager/compare/v1.0.0...v1.0.1) (2018-12-05)

# 1.0.0 (2018-11-28)
