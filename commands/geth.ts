import { Command } from '@cliffy/command'
import { join } from '@std/path'
import { RETESTER_DIR, REVIVE_DIR } from '../lib/config.ts'
import { serve } from '../lib/process.ts'
import { startMitmproxy } from '../lib/mitmproxy.ts'
import { capture } from '../lib/process.ts'
import { ensureDir } from '@std/fs'

export interface GethOptions {
    mode?: string
    port?: number
    retester?: boolean
}

async function buildGethSpec(): Promise<string> {
    const specPath = join(REVIVE_DIR, 'geth_spec.json')

    try {
        await Deno.stat(specPath)
        console.log(`Using existing geth spec: ${specPath}`)
        return specPath
    } catch {
        // spec doesn't exist, generate it
    }

    await ensureDir(REVIVE_DIR)
    console.log('Generating geth genesis spec...')

    const baseSpec = await capture([
        'cargo',
        'run',
        '--quiet',
        '--release',
        '--manifest-path',
        join(RETESTER_DIR, 'Cargo.toml'),
        '--',
        'export-genesis',
        'geth-evm-solc',
    ])

    // Patch alloc to fund dev accounts
    const spec = JSON.parse(baseSpec)
    const balance = '0x200000000000000000000000000000000000000'
    spec.alloc = spec.alloc ?? {}
    spec.alloc['0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac'] = {
        balance,
    }
    spec.alloc['0x71562b71999873db5b286df957af199ec94617f7'] = {
        balance,
    }

    await Deno.writeTextFile(specPath, JSON.stringify(spec, null, 2))
    console.log(`Wrote geth spec to ${specPath}`)
    return specPath
}

export async function geth(opts: GethOptions = {}): Promise<void> {
    const mode = opts.mode ?? 'run'
    const port = opts.port ?? 8545

    let serverPort = port
    if (mode === 'proxy') {
        serverPort = port + 1
        await startMitmproxy([`${port}:${serverPort}`])
    }

    const args = [
        'geth',
        '--http',
        '--http.api',
        'web3,eth,txpool,miner,debug,net',
        '--http.port',
        String(serverPort),
    ]

    if (opts.retester) {
        const specPath = await buildGethSpec()
        const dataDir = await Deno.makeTempDir({ prefix: 'geth-dev-' })

        // Init geth with custom genesis
        await capture([
            'geth',
            'init',
            '--datadir',
            dataDir,
            specPath,
        ])

        args.push('--datadir', dataDir, '--dev')
    } else {
        args.push('--dev')
    }

    await serve({ name: 'geth', cmd: args })
}

export const gethCommand = new Command()
    .name('geth')
    .description('Run geth dev node')
    .arguments('[mode:string]')
    .option('--port <port:number>', 'Port to listen on', { default: 8545 })
    .option('--retester', 'Use retester genesis spec')
    .action((options, mode) =>
        geth({ mode, port: options.port, retester: options.retester })
    )
