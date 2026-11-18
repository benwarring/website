---
title: bIDE
summary: A dependency-free terminal text editor written in C with multi-cursor editing, undo/redo, search and syntax highlighting.
tags: [C17, LSP, Bash, POSIX]
repo: https://github.com/benwarring/bIDE
order: 1
---

## Overview

bIDE is a modeless terminal text editor built from libc and the terminal itself, with no external dependencies. It started as a read-only file viewer and grew into an editor for writing code. It supports multi-cursor editing, undo/redo, search and syntax highlighting, and connects to language servers for completion, diagnostics and go-to-definition.

## What I built

- Multi-cursor editing, undo/redo, search and syntax highlighting, with no external dependencies.
- An LSP client and a JSON parser, both written from scratch, for completion, diagnostics and go-to-definition.
- A single event loop that multiplexes user input and language-server pipes without blocking.

## Features

- Editing with insert, delete and save, preserving CRLF line endings.
- Undo/redo, multi-cursor editing and incremental search.
- Syntax highlighting for C and Python.
- Multiple buffers, tmux-style split panes, a command palette and a fuzzy file picker.
- Language server support (completion, hover, diagnostics, go-to-definition) through clangd and pylsp.
- Copy and paste through OSC 52, and mouse support.

Built with C17, gcc or clang and make, for a POSIX terminal (Linux, macOS or WSL).

## Screenshots

Screenshots and a terminal recording will be added here.
