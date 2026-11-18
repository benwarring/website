---
title: my-dot-claude
summary: My Claude Code setup of agents and skills kept in git, built around a pipeline where subagents write, review, fix and test code.
tags: [Claude Code, Bash, Git]
repo: https://github.com/benwarring/my-dot-claude
order: 6
---

## Overview

my-dot-claude is my Claude Code setup of agents and skills, kept in git. The main piece is the build-pipeline skill, in which the main Claude Code session acts as a manager and has subagents write, review, fix and test code to a set of standards.

## Features

- The manager plans the job and waits for approval before building.
- Each file gets its own git branch and worktree.
- Standards and security reviews, with risk levels 1 to 3 that decide which model reviews and when a review escalates.
- Up to three fix rounds per file; each finished file is committed and merged into the starting branch. Nothing is pushed.

Built with Claude Code, bash and git.
