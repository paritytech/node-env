#!/usr/bin/env -S deno run --allow-all
import { Command } from '@cliffy/command'
import { devNodeCommand } from './commands/dev_node.ts'
import { ethRpcCommand } from './commands/eth_rpc.ts'
import { westendCommand } from './commands/westend.ts'
import { paseoCommand } from './commands/paseo.ts'
import { ethAnvilCommand } from './commands/eth_anvil.ts'
import { anvilCommand } from './commands/anvil.ts'
import { gethCommand } from './commands/geth.ts'
import { reviveDevStackCommand } from './stacks/revive_dev.ts'
import { westendDevStackCommand } from './stacks/westend_dev.ts'
import { paseoDevStackCommand } from './stacks/paseo_dev.ts'
import { anvilDevStackCommand } from './stacks/anvil_dev.ts'
import { gethDevStackCommand } from './stacks/geth_dev.ts'

const SUBCOMMANDS = [
    'dev-node',
    'eth-rpc',
    'westend',
    'paseo',
    'eth-anvil',
    'anvil',
    'geth',
    'revive-dev-stack',
    'westend-dev-stack',
    'paseo-dev-stack',
    'anvil-dev-stack',
    'geth-dev-stack',
    'completions',
]

function printCompletions(shell: string) {
    const cmds = SUBCOMMANDS.join(' ')
    switch (shell) {
        case 'zsh':
            console.log(`#compdef node-env
_node-env() {
  local -a commands=(${SUBCOMMANDS.map((c) => `'${c}'`).join(' ')})
  _arguments '1:command:($commands)' '*::arg:->args'
}
_node-env "$@"`)
            break
        case 'bash':
            console.log(`_node_env() {
  local cur=\${COMP_WORDS[COMP_CWORD]}
  COMPREPLY=( $(compgen -W "${cmds}" -- "$cur") )
}
complete -F _node_env node-env`)
            break
        case 'fish':
            console.log(
                SUBCOMMANDS.map((c) =>
                    `complete -c node-env -n "__fish_use_subcommand" -a "${c}"`
                ).join('\n'),
            )
            break
        default:
            console.error(
                `Unknown shell: ${shell}. Use zsh, bash, or fish.`,
            )
            Deno.exit(1)
    }
}

const cli = new Command()
    .name('node-env')
    .version('0.1.0')
    .description('Manage Polkadot Revive development environment')
    .command('dev-node', devNodeCommand)
    .command('eth-rpc', ethRpcCommand)
    .command('westend', westendCommand)
    .command('paseo', paseoCommand)
    .command('eth-anvil', ethAnvilCommand)
    .command('anvil', anvilCommand)
    .command('geth', gethCommand)
    .command('revive-dev-stack', reviveDevStackCommand)
    .command('westend-dev-stack', westendDevStackCommand)
    .command('paseo-dev-stack', paseoDevStackCommand)
    .command('anvil-dev-stack', anvilDevStackCommand)
    .command('geth-dev-stack', gethDevStackCommand)
    .command(
        'completions',
        new Command()
            .description('Generate shell completions')
            .arguments('<shell:string>')
            .action((_options, shell) => {
                printCompletions(shell)
            }),
    )

if (import.meta.main) {
    if (Deno.args.length === 0) {
        cli.showHelp()
        Deno.exit(0)
    }
    await cli.parse(Deno.args)
}

export { cli }

// Re-export functions for programmatic use
export { devNode } from './commands/dev_node.ts'
export { ethRpc } from './commands/eth_rpc.ts'
export { westend } from './commands/westend.ts'
export { paseo } from './commands/paseo.ts'
export { ethAnvil } from './commands/eth_anvil.ts'
export { anvil } from './commands/anvil.ts'
export { reviveDevStack } from './stacks/revive_dev.ts'
export { westendDevStack } from './stacks/westend_dev.ts'
export { paseoDevStack } from './stacks/paseo_dev.ts'
export { anvilDevStack } from './stacks/anvil_dev.ts'
export { geth } from './commands/geth.ts'
export { gethDevStack } from './stacks/geth_dev.ts'
