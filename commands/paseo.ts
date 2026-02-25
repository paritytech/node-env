import { Command } from '@cliffy/command'
import { join } from '@std/path'
import { PASSET_HUB_DIR, rustLog, validateDir } from '../lib/config.ts'
import { cargoBuild } from '../lib/cargo.ts'
import { buildPaseoChainSpec } from '../lib/chain_spec.ts'
import { serve } from '../lib/process.ts'

export interface PaseoOptions {
    mode?: string
}

export async function paseo(opts: PaseoOptions = {}): Promise<void> {
    await validateDir(PASSET_HUB_DIR, 'Passet Hub directory')

    const mode = opts.mode ?? 'default'
    const log = rustLog('paseo')

    if (mode === 'build' || mode === 'default') {
        await cargoBuild({
            manifestPath: join(PASSET_HUB_DIR, 'Cargo.toml'),
            package: 'passet-hub-runtime',
            quiet: true,
        })
        await buildPaseoChainSpec()
        if (mode === 'build') return
    }

    const chainSpec = join(
        Deno.env.get('HOME') ?? '',
        'passet-spec.json',
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
    .description('Build or run passet-hub')
    .arguments('[mode:string]')
    .action((_options, mode) => paseo({ mode: mode ?? 'default' }))
