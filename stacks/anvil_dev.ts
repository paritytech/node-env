import { Command } from '@cliffy/command'
import { waitForEthRpc } from '../lib/health.ts'
import { fundAnvilAddress } from '../lib/health.ts'
import * as tmux from '../lib/tmux.ts'

export interface AnvilDevStackOptions {
    build?: boolean
    eth?: boolean
}

export async function anvilDevStack(
    opts: AnvilDevStackOptions = {},
): Promise<void> {
    const buildFlag = opts.build ? ' --build' : ''
    const binFlag = opts.eth ? ' --bin anvil' : ''

    await tmux.killServersWindow()
    await tmux.newWindow(
        'servers',
        `anvil run${buildFlag}${binFlag}`,
    )
    await waitForEthRpc()
    await fundAnvilAddress()
}

export const anvilDevStackCommand = new Command()
    .name('anvil-dev-stack')
    .description('Run anvil in tmux')
    .option('--build', 'Build before starting')
    .option('--eth', 'Use system anvil instead of anvil-polkadot')
    .action((options) => anvilDevStack(options))
