import { Command } from '@cliffy/command'
import { join } from '@std/path'
import { PASEO_DIR, rustLog, validateDir } from '../lib/config.ts'
import { cargoBuild } from '../lib/cargo.ts'
import { buildPaseoChainSpec } from '../lib/chain_spec.ts'
import { serve } from '../lib/process.ts'

export interface PaseoOptions {
    mode?: string
}

export async function paseo(opts: PaseoOptions = {}): Promise<void> {
    await validateDir(PASEO_DIR, 'Paseo runtimes directory')

    const mode = opts.mode ?? 'default'
    const log = rustLog('paseo')

    if (mode === 'build' || mode === 'default') {
        await cargoBuild({
            manifestPath: join(PASEO_DIR, 'Cargo.toml'),
            package: 'asset-hub-paseo-runtime',
            quiet: true,
        })
        await buildPaseoChainSpec()
        if (mode === 'build') return
    }

    const chainSpec = join(
        Deno.env.get('HOME') ?? '',
        'ah-paseo-spec.json',
    )

    await serve({
        name: 'paseo',
        cmd: [
            'polkadot-omni-node',
            '--dev',
            `--log=${log}`,
            '--instant-seal',
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
    .action((_options, mode) => paseo({ mode: mode ?? 'default' }))
