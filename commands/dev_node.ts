import { Command } from '@cliffy/command'
import { join } from '@std/path'
import {
    CHAINSPEC_DIR,
    POLKADOT_SDK_DIR,
    validatePolkadotSdkDir,
} from '../lib/config.ts'
import { cargoBuild } from '../lib/cargo.ts'
import { buildDevNodeSpec, patchChainSpec } from '../lib/chain_spec.ts'
import { serve } from '../lib/process.ts'
import { startMitmproxy } from '../lib/mitmproxy.ts'

export interface DevNodeOptions {
    mode?: string
    release?: boolean
    retester?: boolean
    patch?: string
    consensus?: string
    log?: string
}

export async function devNode(opts: DevNodeOptions = {}): Promise<void> {
    await validatePolkadotSdkDir()

    const mode = opts.mode ?? 'run'
    const profile = opts.release ? 'release' : 'debug'
    const log = opts.log ?? Deno.env.get('RUST_LOG') ??
        'info,runtime::revive=debug'
    const binary = join(POLKADOT_SDK_DIR, 'target', profile, 'revive-dev-node')

    if (opts.retester && opts.patch) {
        throw new Error('--retester and --patch are mutually exclusive')
    }

    if (mode === 'build' || mode === 'default') {
        await cargoBuild({
            manifestPath: join(POLKADOT_SDK_DIR, 'Cargo.toml'),
            package: 'revive-dev-node',
            release: opts.release,
        })

        if (opts.retester) {
            const basePath = join(
                CHAINSPEC_DIR,
                'revive-dev-node-chainspec-base.json',
            )
            const specPath = join(
                CHAINSPEC_DIR,
                'revive-dev-node-chainspec.json',
            )
            await buildDevNodeSpec(binary, basePath)
            await patchChainSpec(basePath, specPath, { retester: true })
        }

        if (opts.patch) {
            try {
                await Deno.stat(opts.patch)
            } catch {
                throw new Error(`Patch file not found: ${opts.patch}`)
            }
            const basePath = join(
                CHAINSPEC_DIR,
                'revive-dev-node-chainspec-base.json',
            )
            const specPath = join(
                CHAINSPEC_DIR,
                'revive-dev-node-chainspec.json',
            )
            await buildDevNodeSpec(binary, basePath)
            await patchChainSpec(basePath, specPath, {
                customPatch: opts.patch,
            })
        }

        if (mode === 'build') return
    }

    if (mode === 'proxy') {
        await startMitmproxy(['9944:8844'])
    }

    // run mode
    const args = [
        binary,
        `--log=${log}`,
        '--network-backend',
        'libp2p',
        '--no-prometheus',
        '--dev',
    ]

    if (mode === 'proxy') {
        args.push('--rpc-port', '8844')
    }
    if (opts.retester || opts.patch) {
        args.push(
            '--chain',
            join(CHAINSPEC_DIR, 'revive-dev-node-chainspec.json'),
        )
    }
    if (opts.consensus) {
        args.push('--consensus', opts.consensus)
    }

    await serve({ name: 'dev-node', cmd: args })
}

export const devNodeCommand = new Command()
    .name('dev-node')
    .description('Build or run revive-dev-node')
    .arguments('[mode:string]')
    .option('--release', 'Use release build')
    .option('--retester', 'Use retester chain spec')
    .option('--patch <path:string>', 'Custom genesis patch file')
    .option('--consensus <mode:string>', 'Consensus mode')
    .option('--log <level:string>', 'Log filter (default: RUST_LOG or info)')
    .action((options, mode) => devNode({ mode: mode ?? 'default', ...options }))
