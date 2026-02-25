---
description: Start the Westend dev stack (westend node + eth-rpc) in tmux
allowed-tools: Bash(deno run:*), Bash(tmux:*)
argument-hint: [--build] [--retester]
---

Start the Westend Asset Hub development stack in tmux.

User provided these flags: `$ARGUMENTS`

```
deno run --allow-all ~/github/node-env/mod.ts westend-dev-stack $ARGUMENTS
```
