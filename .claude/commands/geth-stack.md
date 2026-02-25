---
description: Start the Geth dev stack in tmux
allowed-tools: Bash(deno run:*), Bash(tmux:*)
argument-hint: [--retester] [--proxy]
---

Start geth in a tmux window, wait for RPC, and fund the default dev address.

User provided these flags: `$ARGUMENTS`

```
deno run --allow-all ~/github/node-env/mod.ts geth-dev-stack $ARGUMENTS
```
