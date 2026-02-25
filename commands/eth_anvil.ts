import { Command } from '@cliffy/command'
import { serve } from '../lib/process.ts'
import { startMitmproxy } from '../lib/mitmproxy.ts'

export interface EthAnvilOptions {
    mode?: string
    port?: number
}

export async function ethAnvil(opts: EthAnvilOptions = {}): Promise<void> {
    const mode = opts.mode ?? 'run'
    const port = opts.port ?? 8545

    let serverPort = port
    if (mode === 'proxy') {
        serverPort = port + 1
        await startMitmproxy([`${port}:${serverPort}`])
    }

    await serve({
        name: 'eth-anvil',
        cmd: ['anvil', '--port', String(serverPort)],
    })
}

export const ethAnvilCommand = new Command()
    .name('eth-anvil')
    .description('Run system anvil (standard Ethereum)')
    .arguments('[mode:string]')
    .option('--port <port:number>', 'Port to listen on', { default: 8545 })
    .action((options, mode) => ethAnvil({ mode, port: options.port }))
