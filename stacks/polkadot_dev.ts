import { Command } from '@cliffy/command'
import { polkadot } from '../commands/polkadot.ts'
import { ethRpc } from '../commands/eth_rpc.ts'
import { waitForEthRpc } from '../lib/health.ts'
import * as tmux from '../lib/tmux.ts'

export interface PolkadotDevStackOptions {
    build?: boolean
    proxy?: boolean
    devBlockTime?: number
}

export async function polkadotDevStack(
    opts: PolkadotDevStackOptions = {},
): Promise<void> {
    const rustLog = Deno.env.get('RUST_LOG')
    const flags = [
        opts.devBlockTime ? `--dev-block-time ${opts.devBlockTime}` : '',
        rustLog ? `--log '${rustLog}'` : '',
    ].filter(Boolean).join(' ')

    if (opts.build) {
        console.log('Building polkadot and eth-rpc...')
        await polkadot({ mode: 'build' })
        await ethRpc({ mode: 'build' })
    }

    await tmux.killServersWindow()
    await tmux.newWindow('servers', `polkadot run ${flags}`.trimEnd())
    const ethRpcMode = opts.proxy ? 'proxy' : 'run'
    await tmux.splitWindow('servers', `eth-rpc ${ethRpcMode}`)
    await tmux.selectPane('servers.1')
    await waitForEthRpc()
}

export const polkadotDevStackCommand = new Command()
    .name('polkadot-dev-stack')
    .description('Run polkadot + eth-rpc in tmux')
    .option('--build', 'Build before starting')
    .option('--proxy', 'Run mitmproxy in front of eth-rpc')
    .option(
        '--dev-block-time <ms:number>',
        'Block production interval in ms (default: instant seal)',
    )
    .action((options) => polkadotDevStack(options))
