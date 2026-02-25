# node-env

Deno CLI for managing Polkadot Revive development environments. Replaces the monolithic `node-env.sh` shell script with structured, typed commands.

## Install

```sh
# Run directly
deno run --allow-all mod.ts <command>

# Or via deno task
deno task start <command>

# Or create a shell alias
alias node-env='deno run --allow-all ~/github/node-env/mod.ts'
```

## Commands

### Individual services

```sh
node-env dev-node [build|run] [--release] [--retester] [--patch=<path>] [--consensus=<mode>]
node-env eth-rpc  [build|run] [--release] [--node-rpc-url <url>]
node-env westend  [build|run] [--retester]
node-env paseo    [build|run]
node-env eth-anvil [--port=N]
node-env anvil    [build|run] [--port=N] [--bin=<path>]
```

### Stacks (tmux multi-pane)

```sh
node-env revive-dev-stack  [--release] [--retester] [--build] [--consensus=<mode>]
node-env westend-dev-stack [--build] [--retester]
node-env paseo-dev-stack   [--build]
node-env anvil-dev-stack   [--build] [--eth]
```

Stacks open a tmux window named `servers` with the node in one pane and eth-rpc in another, then wait for the RPC to be ready.

### Shell completions

```sh
# Add to .zshrc
eval "$(node-env completions zsh)"
```

## Logging

All process output is teed to `~/.revive/logs/<name>.log` (e.g. `dev-node.log`, `eth-rpc.log`).

## Programmatic use

Every command exports a typed async function alongside its CLI command:

```ts
import { devNode } from './commands/dev_node.ts'

await devNode({ mode: 'run', release: true, consensus: 'manual-seal-12000' })
```

## Project structure

```
mod.ts              # Entry point, cliffy command tree
lib/
    config.ts       # Paths, env vars, RUST_LOG defaults
    process.ts      # Spawn with tee-to-logfile
    cargo.ts        # Cargo build helper
    chain_spec.ts   # Chain spec building & patching
    health.ts       # waitForEthRpc(), fundDefaultAddress()
    tmux.ts         # Tmux window/pane management
commands/
    dev_node.ts     # revive-dev-node
    eth_rpc.ts      # eth-rpc bridge
    westend.ts      # asset-hub-westend
    paseo.ts        # passet-hub
    eth_anvil.ts    # system anvil
    anvil.ts        # anvil-polkadot
stacks/
    revive_dev.ts   # dev-node + eth-rpc
    westend_dev.ts  # westend + eth-rpc
    paseo_dev.ts    # paseo + eth-rpc
    anvil_dev.ts    # anvil standalone
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `POLKADOT_SDK_DIR` | `~/polkadot-sdk` | Polkadot SDK checkout |
| `FOUNDRY_DIR` | `~/github/foundry-polkadot` | Foundry Polkadot checkout |
| `CONTRACTS_BOILERPLATE_DIR` | `~/github/contracts-boilerplate` | Contracts boilerplate (for retester chainspec patch) |
| `RUST_LOG` | per-command defaults | Override log level for any command |
