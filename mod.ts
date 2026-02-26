#!/usr/bin/env -S deno run --allow-all
import { Command } from '@cliffy/command'
import { CompletionsCommand } from '@cliffy/command/completions'
import { devNodeCommand } from './commands/dev_node.ts'
import { ethRpcCommand } from './commands/eth_rpc.ts'
import { westendCommand } from './commands/westend.ts'
import { paseoCommand } from './commands/paseo.ts'
import { ethAnvilCommand } from './commands/eth_anvil.ts'
import { anvilCommand } from './commands/anvil.ts'
import { gethCommand } from './commands/geth.ts'
import { retesterTestCommand } from './commands/retester.ts'
import { reviveDevStackCommand } from './stacks/revive_dev.ts'
import { westendDevStackCommand } from './stacks/westend_dev.ts'
import { paseoDevStackCommand } from './stacks/paseo_dev.ts'
import { anvilDevStackCommand } from './stacks/anvil_dev.ts'
import { gethDevStackCommand } from './stacks/geth_dev.ts'

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
    .command('retester-test', retesterTestCommand)
    .command('revive-dev-stack', reviveDevStackCommand)
    .command('westend-dev-stack', westendDevStackCommand)
    .command('paseo-dev-stack', paseoDevStackCommand)
    .command('anvil-dev-stack', anvilDevStackCommand)
    .command('geth-dev-stack', gethDevStackCommand)
    .command('completions', new CompletionsCommand())

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
export { retesterTest } from './commands/retester.ts'
export { gethDevStack } from './stacks/geth_dev.ts'
