---
description: Run any node-env subcommand
allowed-tools: Bash(deno run:*), Bash(tmux:*), Bash(cast:*), Bash(curl:*)
argument-hint: <subcommand> [args...]
---

Run a node-env CLI command. Available subcommands:

- `dev-node [build|run]` — Build or run revive-dev-node
- `eth-rpc [build|run]` — Build or run eth-rpc bridge
- `westend [build|run]` — Build or run asset-hub-westend
- `paseo [build|run]` — Build or run passet-hub
- `eth-anvil` — Run system anvil
- `anvil [build|run]` — Build or run anvil-polkadot
- `revive-dev-stack` — dev-node + eth-rpc in tmux
- `westend-dev-stack` — westend + eth-rpc in tmux
- `paseo-dev-stack` — paseo + eth-rpc in tmux
- `anvil-dev-stack` — anvil in tmux

User requested: `$ARGUMENTS`

```
deno run --allow-all ~/github/node-env/mod.ts $ARGUMENTS
```

If the user wants to interact with a running node after starting it (send transactions, check balances, etc.), use `cast` commands against `http://localhost:8545`.
