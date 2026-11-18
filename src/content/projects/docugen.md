---
title: DocuGen
summary: An AI-powered documentation generator that writes docstrings for Python codebases.
tags: [Python, OpenAI API, Anthropic API]
repo: https://github.com/benwarring/DocuGen
order: 3
---

## Overview

DocuGen is an AI-powered documentation generator that writes docstrings for Python codebases. It is a command-line tool that generates docstrings with an LLM and inserts them with AST-aware rewriting, so the rest of each file is preserved byte for byte. It is currently a phase 1 MVP.

## What I built

- Docstring generation for Python codebases.
- Support for Google, NumPy and Sphinx docstring formats.
- OpenAI and Anthropic backends, defaulting to GPT-3.5 Turbo for cost efficiency.

## Features

- Options for a dry run, forcing regeneration, and choosing the provider, model and docstring style.
- Skips private functions by default.
- Writes a `.bak` backup before modifying a file.
- A system prompt with an instruction against inventing behaviour the code does not have.

Built with Python 3.10+, `ast`, `libcst`, the OpenAI and Anthropic APIs, and pytest.

## Screenshots

Screenshots will be added here.
