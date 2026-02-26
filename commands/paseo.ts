import { Command } from '@cliffy/command'
import { join } from '@std/path'
import { CHAINSPEC_DIR, PASEO_DIR, validateDir } from '../lib/config.ts'
import { cargoBuild } from '../lib/cargo.ts'
import { buildPaseoChainSpec, OMNI_NODE_BIN } from '../lib/chain_spec.ts'
import { serve } from '../lib/process.ts'

export interface PaseoOptions {
    mode?: string
    devBlockTime?: number
    log?: string
}

export async function paseo(opts: PaseoOptions = {}): Promise<void> {
    await validateDir(PASEO_DIR, 'Paseo runtimes directory')

    const mode = opts.mode ?? 'default'
    const log = opts.log ?? Deno.env.get('RUST_LOG') ??
        'info,runtime::revive=debug'

    if (mode === 'build' || mode === 'default') {
        await cargoBuild({
            manifestPath: join(PASEO_DIR, 'Cargo.toml'),
            package: 'asset-hub-paseo-runtime',
            quiet: true,
        })
        await buildPaseoChainSpec()
        if (mode === 'build') return
    }

    const chainSpec = join(CHAINSPEC_DIR, 'ah-paseo-spec.json')

    await serve({
        name: 'paseo',
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

export const paseoCommand = new Command()
    .name('paseo')
    .description('Build or run paseo')
    .arguments('[mode:string]')
    .option('--log <level:string>', 'Log filter (default: RUST_LOG or info)')
    .option(
        '--dev-block-time <ms:number>',
        'Block production interval in ms (default: instant seal)',
    )
    .action((options, mode) => paseo({ mode: mode ?? 'default', ...options }))
