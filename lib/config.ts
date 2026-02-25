import { join } from '@std/path'

const home = Deno.env.get('HOME') ?? ''

export const POLKADOT_SDK_DIR = Deno.env.get('POLKADOT_SDK_DIR') ??
    join(home, 'polkadot-sdk')

export const FOUNDRY_DIR = Deno.env.get('FOUNDRY_DIR') ??
    join(home, 'github', 'foundry-polkadot')

export const RETESTER_DIR = Deno.env.get('RETESTER_DIR') ??
    join(home, 'github', 'revive-differential-tests')

export const PASSET_HUB_DIR = join(home, 'github', 'passet-hub')

export const CONTRACTS_BOILERPLATE_DIR =
    Deno.env.get('CONTRACTS_BOILERPLATE_DIR') ??
        join(home, 'github', 'contracts-boilerplate')

export const REVIVE_DIR = join(home, '.revive')
export const LOG_DIR = join(REVIVE_DIR, 'logs')

// Default RUST_LOG per command
export const RUST_LOG = {
    devNode: 'error,sc_rpc_server=info,runtime::revive=debug',
    ethRpc: 'info,eth-rpc=debug,jsonrpsee-server=trace',
    westend: 'error,sc_rpc_server=info,runtime::revive=debug',
    paseo: 'error,sc_rpc_server=info,runtime::revive=debug',
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
