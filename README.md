# node-env

Deno CLI for managing Polkadot Revive development environments.

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
node-env eth-anvil [run|proxy] [--port=N]
node-env anvil    [build|run|proxy] [--port=N] [--bin=<path>]
node-env geth     [run|proxy] [--port=N] [--retester]
node-env retester-test <path> [--pvm] [--rpc-url <url>] [--profile <profile>]
```

### Stacks (tmux multi-pane)

```sh
node-env revive-dev-stack  [--release] [--retester] [--build] [--consensus=<mode>]
node-env westend-dev-stack [--build] [--retester]
node-env paseo-dev-stack   [--build]
node-env anvil-dev-stack   [--build] [--eth]
node-env geth-dev-stack    [--retester] [--proxy]
```

Stacks open a tmux window named `servers` with the node in one pane and eth-rpc in another, then wait for the RPC to be ready.

### Shell completions

```sh
# Add to .zshrc
eval "$(node-env completions zsh)"
```

## Claude Code integration

This repo ships slash commands in `.claude/commands/` that let you start
stacks, view logs, and run any node-env subcommand from Claude Code.

To make them available in **any project**, add this repo as an extra directory
in `~/.claude/settings.json`:

```json
{
    "additionalDirectories": ["~/github/node-env"]
}
```

Then from any Claude Code session you can type:

| Command            | What it does                         |
| ------------------ | ------------------------------------ |
| `/dev-stack`       | Start dev-node + eth-rpc in tmux     |
| `/anvil-stack`     | Start anvil in tmux                  |
| `/westend-stack`   | Start westend + eth-rpc in tmux      |
| `/paseo-stack`     | Start paseo + eth-rpc in tmux        |
| `/geth-stack`      | Start geth in tmux                   |
| `/kill-servers`    | Kill the running servers tmux window |
| `/logs <service>`  | View or tail logs from a service     |
| `/node-env <args>` | Run any node-env subcommand          |

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

## Dependencies

All services are built from source. Clone sibling repos next to `node-env`:

```
github/
    node-env/              # this repo
    polkadot-sdk/          # git@github.com:parity-revive/polkadot-sdk.git
    foundry-polkadot/      # git@github.com:parity-revive/foundry-polkadot.git
    paseo/                 # git@github.com:paseo-network/runtimes.git
    mitmproxy/             # git@github.com:pgherveou/mitmproxy.git (optional, for proxy mode)
```

Required tooling:

- [Deno](https://deno.land) — runs node-env itself
- [Rust](https://rustup.rs) — builds polkadot-sdk, foundry, etc.
- [tmux](https://github.com/tmux/tmux) — stacks and proxy mode run services in tmux windows
- [mitmproxy](https://mitmproxy.org) — only needed for `proxy` mode (Python venv inside `mitmproxy/`)

Pre-built / system binaries (not built from source):

- `geth` — used by `eth-anvil` command (system install)
- `anvil` — used by `anvil --bin anvil` / `anvil-dev-stack --eth` (system Foundry install)

## Environment variables

All repo paths default to siblings of `node-env` (`../<name>`). Override with env vars if your layout differs.

| Variable           | Default                        | Description                        |
| ------------------ | ------------------------------ | ---------------------------------- |
| `POLKADOT_SDK_DIR` | `../polkadot-sdk`              | Polkadot SDK checkout              |
| `FOUNDRY_DIR`      | `../foundry-polkadot`          | Foundry Polkadot checkout          |
| `RETESTER_DIR`     | `../revive-differential-tests` | Differential tests repo            |
| `PASEO_DIR`        | `../paseo`                     | Paseo runtimes checkout            |
| `MITMPROXY_DIR`    | `../mitmproxy`                 | mitmproxy checkout (proxy mode)    |
| `RUST_LOG`         | per-command defaults           | Override log level for any command |
