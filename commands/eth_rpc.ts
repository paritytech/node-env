import { Command } from '@cliffy/command'
import { join } from '@std/path'
import {
    POLKADOT_SDK_DIR,
    rustLog,
    validatePolkadotSdkDir,
} from '../lib/config.ts'
import { cargoBuild } from '../lib/cargo.ts'
import { serve } from '../lib/process.ts'
import { startMitmproxy } from '../lib/mitmproxy.ts'

export interface EthRpcOptions {
    mode?: string
    nodeRpcUrl?: string
    release?: boolean
}

export async function ethRpc(opts: EthRpcOptions = {}): Promise<void> {
    await validatePolkadotSdkDir()

    const mode = opts.mode ?? 'run'
    const profile = opts.release ? 'release' : 'debug'
    const log = rustLog('ethRpc')
    const nodeRpcUrl = opts.nodeRpcUrl ?? 'ws://localhost:9944'
    const binary = join(POLKADOT_SDK_DIR, 'target', profile, 'eth-rpc')

    if (mode === 'build') {
        await cargoBuild({
            manifestPath: join(POLKADOT_SDK_DIR, 'Cargo.toml'),
            package: 'pallet-revive-eth-rpc',
            bin: 'eth-rpc',
            release: opts.release,
        })
        return
    }

    if (mode === 'proxy') {
        await startMitmproxy(['8545:8546'])
    }

    const args = [
        binary,
        `--log=${log}`,
        '--no-prometheus',
        '--dev',
        '--rpc-max-response-size',
        '50',
        '--rpc-max-connections',
        '2000',
        '--node-rpc-url',
        nodeRpcUrl,
    ]

    if (mode === 'proxy') {
        args.push('--rpc-port', '8546')
    }

    await serve({ name: 'eth-rpc', cmd: args })
}

export const ethRpcCommand = new Command()
    .name('eth-rpc')
    .description('Build or run eth-rpc bridge')
    .arguments('[mode:string]')
    .option('--release', 'Use release build')
    .option(
        '--node-rpc-url <url:string>',
        'Substrate node RPC URL',
        { default: 'ws://localhost:9944' },
    )
    .action((options, mode) => {
        return ethRpc({
            mode,
            nodeRpcUrl: options.nodeRpcUrl,
            release: options.release,
        })
    })
