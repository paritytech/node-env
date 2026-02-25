import { Command } from '@cliffy/command'
import { paseo } from '../commands/paseo.ts'
import { ethRpc } from '../commands/eth_rpc.ts'
import { waitForEthRpc } from '../lib/health.ts'
import * as tmux from '../lib/tmux.ts'

export interface PaseoDevStackOptions {
    build?: boolean
}

export async function paseoDevStack(
    opts: PaseoDevStackOptions = {},
): Promise<void> {
    if (opts.build) {
        console.log('Building paseo and eth-rpc...')
        await paseo({ mode: 'build' })
        await ethRpc({ mode: 'build' })
    }

    await tmux.killServersWindow()
    await tmux.newWindow('servers', 'paseo run')
    await tmux.splitWindow('servers', 'eth-rpc run')
    await tmux.selectPane('servers.1')
    await waitForEthRpc()
}

export const paseoDevStackCommand = new Command()
    .name('paseo-dev-stack')
    .description('Run paseo + eth-rpc in tmux')
    .option('--build', 'Build before starting')
    .action((options) => paseoDevStack(options))
