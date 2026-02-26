import { Command } from '@cliffy/command'
import { join } from '@std/path'
import { POLKADOT_SDK_DIR, validatePolkadotSdkDir } from '../lib/config.ts'
import { cargoBuild } from '../lib/cargo.ts'
import { buildWestendChainSpec, OMNI_NODE_BIN } from '../lib/chain_spec.ts'
import { REVIVE_DIR } from '../lib/config.ts'
import { serve } from '../lib/process.ts'

export interface WestendOptions {
    mode?: string
    retester?: boolean
    devBlockTime?: number
    log?: string
}

export async function westend(opts: WestendOptions = {}): Promise<void> {
    await validatePolkadotSdkDir()

    const mode = opts.mode ?? 'default'
    const log = opts.log ?? Deno.env.get('RUST_LOG') ??
        'info,runtime::revive=debug'

    if (mode === 'build' || mode === 'default') {
        await cargoBuild({
            manifestPath: join(POLKADOT_SDK_DIR, 'Cargo.toml'),
            package: 'asset-hub-westend-runtime',
            quiet: true,
        })
        await buildWestendChainSpec({ retester: opts.retester })
        if (mode === 'build') return
    }

    const chainSpec = opts.retester
        ? join(REVIVE_DIR, 'ah-westend-spec.json')
        : join(Deno.env.get('HOME') ?? '', 'ah-westend-spec.json')

    await serve({
        name: 'westend',
        cmd: [
            OMNI_NODE_BIN,
            '--dev',
            `--log=${log}`,
            ...(opts.devBlockTime
                ? ['--dev-block-time', String(opts.devBlockTime)]
                : ['--instant-seal']),
            '--no-prometheus',
            '--chain',
            chainSpec,
        ],
    })
}

export const westendCommand = new Command()
    .name('westend')
    .description('Build or run asset-hub-westend')
    .arguments('[mode:string]')
    .option('--retester', 'Use retester chain spec')
    .option('--log <level:string>', 'Log filter (default: RUST_LOG or info)')
    .option(
        '--dev-block-time <ms:number>',
        'Block production interval in ms (default: instant seal)',
    )
    .action((options, mode) => westend({ mode: mode ?? 'default', ...options }))
