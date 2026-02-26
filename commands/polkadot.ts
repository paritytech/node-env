import { Command } from '@cliffy/command'
import { join } from '@std/path'
import { CHAINSPEC_DIR, RUNTIMES_DIR, validateDir } from '../lib/config.ts'
import { cargoBuild } from '../lib/cargo.ts'
import { buildPolkadotChainSpec, OMNI_NODE_BIN } from '../lib/chain_spec.ts'
import { serve } from '../lib/process.ts'

export interface PolkadotOptions {
    mode?: string
    devBlockTime?: number
    log?: string
}

export async function polkadot(opts: PolkadotOptions = {}): Promise<void> {
    await validateDir(RUNTIMES_DIR, 'Runtimes directory')

    const mode = opts.mode ?? 'default'
    const log = opts.log ?? Deno.env.get('RUST_LOG') ??
        'info,runtime::revive=debug'

    if (mode === 'build' || mode === 'default') {
        await cargoBuild({
            manifestPath: join(RUNTIMES_DIR, 'Cargo.toml'),
            package: 'asset-hub-polkadot-runtime',
            quiet: true,
        })
        await buildPolkadotChainSpec()
        if (mode === 'build') return
    }

    const chainSpec = join(CHAINSPEC_DIR, 'ah-polkadot-spec.json')

    await serve({
        name: 'polkadot',
        cmd: [
            OMNI_NODE_BIN,
            '--dev',
            `--log=${log}`,
            ...(opts.devBlockTime
                ? ['--dev-block-time', String(opts.devBlockTime)]
                : ['--instant-seal']),
            '--no-prometheus',
            '--no-hardware-benchmarks',
            '--chain',
            chainSpec,
        ],
    })
}

export const polkadotCommand = new Command()
    .name('polkadot')
    .description('Build or run polkadot')
    .arguments('[mode:string]')
    .option('--log <level:string>', 'Log filter (default: RUST_LOG or info)')
    .option(
        '--dev-block-time <ms:number>',
        'Block production interval in ms (default: instant seal)',
    )
    .action((options, mode) =>
        polkadot({ mode: mode ?? 'default', ...options })
    )
