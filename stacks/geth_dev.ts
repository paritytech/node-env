import { Command } from '@cliffy/command'
import { fundDefaultAddress, waitForEthRpc } from '../lib/health.ts'
import * as tmux from '../lib/tmux.ts'

export interface GethDevStackOptions {
    retester?: boolean
    proxy?: boolean
}

export async function gethDevStack(
    opts: GethDevStackOptions = {},
): Promise<void> {
    const retesterFlag = opts.retester ? ' --retester' : ''
    const mode = opts.proxy ? 'proxy' : 'run'

    await tmux.killServersWindow()
    await tmux.newWindow(
        'servers',
        `geth ${mode}${retesterFlag}`,
    )
    await waitForEthRpc()
    await fundDefaultAddress()
}

export const gethDevStackCommand = new Command()
    .name('geth-dev-stack')
    .description('Run geth in tmux')
    .option('--retester', 'Use retester genesis spec')
    .option('--proxy', 'Run mitmproxy in front of geth')
    .action((options) => gethDevStack(options))
