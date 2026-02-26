---
description: View or tail logs from a running service
allowed-tools: Bash(tail:*), Bash(cat:*), Bash(ls:*), Read
argument-hint: <service-name> [--follow]
---

View logs from a running node-env service. Logs are stored in `~/.node-env/logs/`.

User requested: `$ARGUMENTS`

Available log files:
!`ls -lt ~/.node-env/logs/ 2>/dev/null || echo "No logs directory yet"`

If the user specified `--follow` or `tail`, use:

```
tail -f ~/.node-env/logs/<service>.log
```

Otherwise read the last 50 lines with the Read tool from the appropriate log file in `~/.node-env/logs/`. Service names map to log files: `dev-node` → `dev-node.log`, `eth-rpc` → `eth-rpc.log`, `westend` → `westend.log`, etc.
