import { Command } from '@cliffy/command'
import { westend } from '../commands/westend.ts'
import { ethRpc } from '../commands/eth_rpc.ts'
import { waitForEthRpc } from '../lib/health.ts'
import * as tmux from '../lib/tmux.ts'

export interface WestendDevStackOptions {
    build?: boolean
    retester?: boolean
}

export async function westendDevStack(
    opts: WestendDevStackOptions = {},
): Promise<void> {
    const retesterFlag = opts.retester ? ' --retester' : ''

    if (opts.build) {
        console.log('Building westend and eth-rpc...')
        await westend({ mode: 'build', retester: opts.retester })
        await ethRpc({ mode: 'build' })
    }

    await tmux.killServersWindow()
    await tmux.newWindow('servers', `westend run${retesterFlag}`)
    await tmux.splitWindow('servers', 'eth-rpc run')
    await tmux.selectPane('servers.1')
    await waitForEthRpc()
}

export const westendDevStackCommand = new Command()
    .name('westend-dev-stack')
    .description('Run westend + eth-rpc in tmux')
    .option('--build', 'Build before starting')
    .option('--retester', 'Use retester chain spec')
    .action((options) => westendDevStack(options))
