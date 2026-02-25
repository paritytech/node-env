# node-env

Deno CLI for managing Polkadot Revive dev environments (nodes, eth-rpc bridges, tmux stacks).

## Architecture

- `mod.ts` — Cliffy command tree entry point. Re-exports all command functions.
- `lib/` — Shared utilities (process spawning with log tee, cargo build, chain spec patching, tmux, health checks).
- `commands/` — Each file exports a cliffy `Command` and an async function with typed options.
- `stacks/` — Tmux multi-pane compositions (node + eth-rpc).

## Conventions

- Use `deno fmt` and `deno lint` before committing
- Format settings are in `deno.json` (no semicolons, single quotes, 4-space indent, 80-char line width)
- Each command module exports two things: `fooCommand` (CLI) and `foo()` (programmatic)
- All long-running processes tee output to `~/.revive/logs/<name>.log`
- Config defaults live in `lib/config.ts` — all paths use env var overrides

## Running

```sh
deno task start <command>          # e.g. deno task start dev-node run --release
deno run --allow-all mod.ts <cmd>  # direct
```

## Key paths

- All sibling repos default to `../<name>` relative to node-env
- `POLKADOT_SDK_DIR` → `../polkadot-sdk`
- `FOUNDRY_DIR` → `../foundry-polkadot`
- `MITMPROXY_DIR` → `../mitmproxy`
- Logs → `~/.revive/logs/`
- Chain specs → `~/.revive/`
