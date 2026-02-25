import { Command } from '@cliffy/command'
import { devNode } from '../commands/dev_node.ts'
import { ethRpc } from '../commands/eth_rpc.ts'
import { waitForEthRpc } from '../lib/health.ts'
import * as tmux from '../lib/tmux.ts'

export interface ReviveDevStackOptions {
    release?: boolean
    retester?: boolean
    build?: boolean
    consensus?: string
    proxy?: boolean
}

export async function reviveDevStack(
    opts: ReviveDevStackOptions = {},
): Promise<void> {
    const releaseFlag = opts.release ? ' --release' : ''
    const retesterFlag = opts.retester ? ' --retester' : ''
    const consensusFlag = opts.consensus ? ` --consensus ${opts.consensus}` : ''

    if (opts.build) {
        console.log('Building dev-node and eth-rpc...')
        await devNode({
            mode: 'build',
            release: opts.release,
            retester: opts.retester,
        })
        await ethRpc({ mode: 'build', release: opts.release })
    }

    await tmux.killServersWindow()
    await tmux.newWindow(
        'servers',
        `dev-node run${releaseFlag}${retesterFlag}${consensusFlag}`,
    )
    const ethRpcMode = opts.proxy ? 'proxy' : 'run'
    await tmux.splitWindow(
        'servers',
        `eth-rpc ${ethRpcMode}${releaseFlag}`,
    )
    await tmux.selectPane('servers.1')
    await waitForEthRpc()
}

export const reviveDevStackCommand = new Command()
    .name('revive-dev-stack')
    .description('Run dev-node + eth-rpc in tmux')
    .option('--release', 'Use release builds')
    .option('--retester', 'Use retester chain spec')
    .option('--build', 'Build before starting')
    .option('--consensus <mode:string>', 'Consensus mode')
    .option('--proxy', 'Run mitmproxy in front of eth-rpc')
    .action((options) => reviveDevStack(options))
