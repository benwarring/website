---
title: bIDE IDE
summary: A desktop IDE that brings bIDE to VS Code's open-source core, with Open VSX extensions and bIDE's matrix-rain loading screen.
tags: [PowerShell, VS Code OSS, Node.js]
repo: https://github.com/benwarring/bIDE-IDE
order: 4
---

## Overview

bIDE IDE is a desktop build of bIDE on VS Code's open-source core (Code - OSS), with bIDE's name, extensions from Open VSX, and the matrix rain as its loading screen. The repository holds only the bIDE-specific changes: a `build.ps1` script fetches a pinned VS Code release, applies the patches and builds it.

## Features

- Open VSX as the extension gallery.
- The built-in GitHub Copilot extension is left out, and the Copilot chat interface starts hidden.
- Extension signature checks default to off.
- A matrix-rain loading screen.

Built with PowerShell, git, the Visual Studio 2022 C++ build tools, and Node pinned to VS Code's version.

## Screenshots

Screenshots will be added here.
