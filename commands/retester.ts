import { Command } from '@cliffy/command'
import { join } from '@std/path'
import { RETESTER_DIR, validateDir } from '../lib/config.ts'
import { exec } from '../lib/process.ts'

export interface RetesterTestOptions {
    pvm?: boolean
    rpcUrl?: string
    profile?: string
}

export async function retesterTest(
    testPath: string,
    opts: RetesterTestOptions = {},
): Promise<void> {
    await validateDir(RETESTER_DIR, 'RETESTER_DIR')

    const platform = opts.pvm
        ? 'revive-dev-node-polkavm-resolc'
        : 'revive-dev-node-revm-solc'
    const profile = opts.profile ?? 'debug'
    const rpcUrl = opts.rpcUrl ?? 'http://localhost:8545'

    // Prefix shorthand paths
    let resolved = testPath
    if (testPath.startsWith('complex') || testPath.startsWith('simple')) {
        resolved = `resolc-compiler-tests/fixtures/solidity/${testPath}`
    }
    const fullPath = join(RETESTER_DIR, resolved)

    await exec([
        'cargo',
        'run',
        '--quiet',
        '--release',
        '--manifest-path',
        join(RETESTER_DIR, 'Cargo.toml'),
        '--',
        'test',
        '--platform',
        platform,
        '--profile',
        profile,
        '--revive-dev-node.existing-rpc-url',
        rpcUrl,
        '--test',
        fullPath,
    ])
}

export const retesterTestCommand = new Command()
    .name('retester-test')
    .description('Run a retester differential test against a running node')
    .arguments('<test-path:string>')
    .option('--pvm', 'Use PolkaVM/resolc platform instead of revm/solc')
    .option('--rpc-url <url:string>', 'RPC endpoint URL', {
        default: 'http://localhost:8545',
    })
    .option('--profile <profile:string>', 'Build profile', {
        default: 'debug',
    })
    .action((options, testPath) =>
        retesterTest(testPath, {
            pvm: options.pvm,
            rpcUrl: options.rpcUrl,
            profile: options.profile,
        })
    )
