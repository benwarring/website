---
title: bIDE
summary: A dependency-free terminal text editor written in C with multi-cursor editing, undo/redo, search and syntax highlighting.
tags: [C17, LSP, Bash, POSIX]
order: 1
---

## Overview

bIDE is a dependency-free terminal text editor written in C. It supports multi-cursor editing, undo/redo, search and syntax highlighting, and connects to language servers for completion, diagnostics and go-to-definition.

## What I built

- Multi-cursor editing, undo/redo, search and syntax highlighting, with no external dependencies.
- An LSP client and a JSON parser, both written from scratch, for completion, diagnostics and go-to-definition.
- A single event loop that multiplexes user input and language-server pipes without blocking.

## Screenshots

Screenshots and a terminal recording will be added here.
