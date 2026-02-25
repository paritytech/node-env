import { Command } from '@cliffy/command'
import { serve } from '../lib/process.ts'

export interface EthAnvilOptions {
    port?: number
}

export async function ethAnvil(opts: EthAnvilOptions = {}): Promise<void> {
    const port = String(opts.port ?? 8545)
    await serve({
        name: 'eth-anvil',
        cmd: ['anvil', '--port', port],
    })
}

export const ethAnvilCommand = new Command()
    .name('eth-anvil')
    .description('Run system anvil (standard Ethereum)')
    .option('--port <port:number>', 'Port to listen on', { default: 8545 })
    .action((options) => ethAnvil({ port: options.port }))
