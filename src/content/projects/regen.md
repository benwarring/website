---
title: ReGen
summary: An end-to-end pipeline that ingests documents and webpages, extracts structured data through LLM-based parsing, and identifies patterns across multiple sources.
tags: [Python, LLMs, Quarto]
repo: https://github.com/JustinV200/ReGen
order: 2
---

## Overview

ReGen is an end-to-end pipeline that ingests documents and webpages, extracts structured data through LLM-based parsing, and identifies patterns across multiple sources. It generates reports rendered with Quarto. The repository is hosted on JustinV200's GitHub, and I am a contributor.

## What I built

- Ingestion of documents and webpages.
- Structured data extraction through LLM-based parsing.
- Pattern identification across multiple sources.
- Report generation rendered with Quarto.
- Optional Notion database integration for collaborative workflows.

## Features

- Accepts URLs or local files: web pages, PDF, .docx, .xlsx, CSV and plain text.
- Stages: parse, chunk, LLM extraction (map-reduce), LLM analysis, section-by-section report writing, and Quarto rendering.
- Report modes `brief`, `standard` and `detailed`, output as HTML, PDF or DOCX.
- Clusters sources by topic similarity, with optional export to a Notion database.

Built with Python 3.10+, Quarto and litellm, plus trafilatura, PyMuPDF, pdfplumber, python-docx, pandas and matplotlib.

## Screenshots

Screenshots will be added here.
