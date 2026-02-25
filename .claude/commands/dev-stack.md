---
description: Start the Revive dev stack (dev-node + eth-rpc) in tmux
allowed-tools: Bash(deno run:*), Bash(tmux:*)
argument-hint: [--release] [--retester] [--build] [--consensus=<mode>]
---

Start the Revive development stack. This launches dev-node and eth-rpc in a tmux window named `servers`, then waits for the RPC endpoint to be ready.

User provided these flags: `$ARGUMENTS`

Run the following command (include any flags the user specified):

```
deno run --allow-all ~/github/node-env/mod.ts revive-dev-stack $ARGUMENTS
```

After the stack is running, confirm the eth-rpc URL (`http://localhost:8545`) is ready by checking the output. If the user didn't specify flags, run with no flags (debug build, default chain spec).
