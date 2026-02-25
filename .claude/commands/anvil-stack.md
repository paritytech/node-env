---
description: Start the Anvil dev stack (anvil-polkadot or system anvil) in tmux
allowed-tools: Bash(deno run:*), Bash(tmux:*)
argument-hint: [--build] [--eth]
---

Start anvil in a tmux window. Use `--eth` for the system anvil (standard Ethereum) or no flag for anvil-polkadot.

User provided these flags: `$ARGUMENTS`

```
deno run --allow-all ~/github/node-env/mod.ts anvil-dev-stack $ARGUMENTS
```
