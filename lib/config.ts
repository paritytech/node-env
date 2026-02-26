import { dirname, fromFileUrl, join } from '@std/path'

// Repo root = parent of lib/
const REPO_DIR = dirname(dirname(fromFileUrl(import.meta.url)))
const SIBLING = (name: string) => join(REPO_DIR, '..', name)

export const POLKADOT_SDK_DIR = Deno.env.get('POLKADOT_SDK_DIR') ??
    SIBLING('polkadot-sdk')

export const FOUNDRY_DIR = Deno.env.get('FOUNDRY_DIR') ??
    SIBLING('foundry-polkadot')

export const RETESTER_DIR = Deno.env.get('RETESTER_DIR') ??
    SIBLING('revive-differential-tests')

export const PASEO_DIR = Deno.env.get('PASEO_DIR') ??
    SIBLING('paseo')

export const RUNTIMES_DIR = Deno.env.get('RUNTIMES_DIR') ??
    SIBLING('runtimes')

export const MITMPROXY_DIR = Deno.env.get('MITMPROXY_DIR') ??
    SIBLING('mitmproxy')

const home = Deno.env.get('HOME') ?? ''
export const NODE_ENV_DIR = join(home, '.node-env')
export const LOG_DIR = join(NODE_ENV_DIR, 'logs')
export const CHAINSPEC_DIR = join(NODE_ENV_DIR, 'chainspecs')

// Default RUST_LOG per command
export const RUST_LOG = {
    devNode: 'error,sc_rpc_server=info,runtime::revive=debug',
    ethRpc: 'info,eth-rpc=debug,jsonrpsee-server=trace',
    westend: 'error,sc_rpc_server=info,runtime::revive=debug',
    paseo: 'error,sc_rpc_server=info,runtime::revive=debug',
    polkadot: 'error,sc_rpc_server=info,runtime::revive=debug',
    kusama: 'error,sc_rpc_server=info,runtime::revive=debug',
    anvil: 'runtime=debug,pallet_revive=debug',
}

// Dev account
export const DEV_ADDRESS = '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac'
export const DEV_PRIVATE_KEY =
    '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
export const DEV_SS58 = '5HYRCKHYJN9z5xUtfFkyMj4JUhsAwWyvuU8vKB1FcnYTf9ZQ'

export function rustLog(command: keyof typeof RUST_LOG): string {
    return Deno.env.get('RUST_LOG') ?? RUST_LOG[command]
}

export async function validateDir(
    dir: string,
    label: string,
): Promise<void> {
    try {
        await Deno.stat(dir)
    } catch {
        throw new Error(
            `${label} does not exist at ${dir}`,
        )
    }
}

export async function validatePolkadotSdkDir(): Promise<void> {
    await validateDir(POLKADOT_SDK_DIR, 'POLKADOT_SDK_DIR')
    try {
        await Deno.stat(join(POLKADOT_SDK_DIR, '.git'))
    } catch {
        throw new Error(`${POLKADOT_SDK_DIR} is not a git repository`)
    }
}
