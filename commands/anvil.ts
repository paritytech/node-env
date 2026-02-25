import { Command } from '@cliffy/command'
import { join } from '@std/path'
import { FOUNDRY_DIR, rustLog } from '../lib/config.ts'
import { cargoBuild } from '../lib/cargo.ts'
import { serve } from '../lib/process.ts'
import { startMitmproxy } from '../lib/mitmproxy.ts'

export interface AnvilOptions {
    mode?: string
    port?: number
    bin?: string
}

export async function anvil(opts: AnvilOptions = {}): Promise<void> {
    const mode = opts.mode ?? 'run'
    const port = String(opts.port ?? 8545)
    const bin = opts.bin ??
        join(FOUNDRY_DIR, 'target', 'release', 'anvil-polkadot')
    const log = rustLog('anvil')

    if (mode === 'build') {
        await cargoBuild({
            manifestPath: join(FOUNDRY_DIR, 'Cargo.toml'),
            package: 'anvil-polkadot',
            release: true,
            env: { SQLX_OFFLINE: 'true' },
        })
        return
    }

    let serverPort = port
    if (mode === 'proxy') {
        const numPort = Number(port)
        serverPort = String(numPort + 1)
        await startMitmproxy([`${port}:${serverPort}`])
    }

    await serve({
        name: 'anvil',
        cmd: [bin, '-p', serverPort, '--timestamp', '0'],
        env: { RUST_LOG: log },
    })
}

export const anvilCommand = new Command()
    .name('anvil')
    .description('Build or run anvil-polkadot')
    .arguments('[mode:string]')
    .option('--port <port:number>', 'Port to listen on', { default: 8545 })
    .option('--bin <path:string>', 'Path to anvil binary')
    .action((options, mode) =>
        anvil({ mode, port: options.port, bin: options.bin })
    )
