import { ensureDir } from '@std/fs'
import { dirname, join } from '@std/path'
import { Twox128 } from '@polkadot-api/substrate-bindings'
import { CHAINSPEC_DIR, POLKADOT_SDK_DIR } from './config.ts'
import { cargoBuild } from './cargo.ts'
import { capture } from './process.ts'

export interface BuildChainSpecOptions {
    paraId: number
    runtime: string
    preset: string
    outputPath: string
    relayChain?: string
}

export const OMNI_NODE_BIN = join(
    POLKADOT_SDK_DIR,
    'target/release/polkadot-omni-node',
)

/** Build polkadot-omni-node from source if the release binary doesn't exist */
async function ensureOmniNode(): Promise<string> {
    try {
        await Deno.stat(OMNI_NODE_BIN)
    } catch {
        console.log('Building polkadot-omni-node (release)...')
        await cargoBuild({
            manifestPath: join(POLKADOT_SDK_DIR, 'Cargo.toml'),
            package: 'polkadot-omni-node',
            bin: 'polkadot-omni-node',
            release: true,
        })
    }
    return OMNI_NODE_BIN
}

/** Build chain spec using polkadot-omni-node chain-spec-builder */
export async function buildChainSpec(
    opts: BuildChainSpecOptions,
): Promise<void> {
    const binary = await ensureOmniNode()
    await ensureDir(dirname(opts.outputPath))
    const stdout = await capture([
        binary,
        'chain-spec-builder',
        '--chain-spec-path',
        opts.outputPath,
        'create',
        '--relay-chain',
        opts.relayChain ?? 'dontcare',
        '--para-id',
        String(opts.paraId),
        '--runtime',
        opts.runtime,
        'named-preset',
        opts.preset,
    ])
    if (stdout.trim()) console.log(stdout.trim())
}

/** Generate chain spec from dev-node's build-spec */
export async function buildDevNodeSpec(
    binary: string,
    outputPath: string,
): Promise<void> {
    await ensureDir(dirname(outputPath))
    const stdout = await capture([binary, 'build-spec', '--dev'])
    await Deno.writeTextFile(outputPath, stdout)
}

export interface PatchOptions {
    retester?: boolean
    devBalance?: boolean
    devStakers?: boolean
    customPatch?: string
}

const RETESTER_PATCH_PATH = join(
    dirname(import.meta.dirname!),
    'data',
    'retester-chainspec-patch.json',
)

const DEV_BALANCE_ENTRY: [string, bigint] = [
    '5HYRCKHYJN9z5xUtfFkyMj4JUhsAwWyvuU8vKB1FcnYTf9ZQ',
    100_000_000_000_000_001_000_000_000n,
]

/** Patch a chain spec JSON file */
export async function patchChainSpec(
    inputPath: string,
    outputPath: string,
    opts: PatchOptions,
): Promise<void> {
    await ensureDir(dirname(outputPath))
    // deno-lint-ignore no-explicit-any
    let spec: any = JSON.parse(await Deno.readTextFile(inputPath))

    if (opts.retester) {
        const patch = JSON.parse(await Deno.readTextFile(RETESTER_PATCH_PATH))
        spec = deepMerge(spec, patch)
    }

    if (opts.devBalance) {
        const balances: [string, bigint][] = spec.genesis?.runtimeGenesis
            ?.patch?.balances?.balances ?? []
        const existing = balances.find((b) => b[0] === DEV_BALANCE_ENTRY[0])
        if (!existing) balances.push(DEV_BALANCE_ENTRY)
        spec.genesis ??= {}
        spec.genesis.runtimeGenesis ??= {}
        spec.genesis.runtimeGenesis.patch ??= {}
        spec.genesis.runtimeGenesis.patch.balances ??= {}
        spec.genesis.runtimeGenesis.patch.balances.balances = balances
    }

    if (opts.devStakers) {
        spec.genesis ??= {}
        spec.genesis.runtimeGenesis ??= {}
        spec.genesis.runtimeGenesis.patch ??= {}
        spec.genesis.runtimeGenesis.patch.staking ??= {}
        spec.genesis.runtimeGenesis.patch.staking.devStakers = [0, 0]
    }

    if (opts.customPatch) {
        const customData = JSON.parse(
            await Deno.readTextFile(opts.customPatch),
        )
        const revive = spec.genesis?.runtimeGenesis?.patch?.revive ?? {}
        spec.genesis ??= {}
        spec.genesis.runtimeGenesis ??= {}
        spec.genesis.runtimeGenesis.patch ??= {}
        spec.genesis.runtimeGenesis.patch.revive = deepMerge(
            revive,
            customData,
        )
    }

    await Deno.writeTextFile(outputPath, jsonStringify(spec))
    console.log(`Chain spec written to ${outputPath}`)
}

// deno-lint-ignore no-explicit-any
function deepMerge(target: any, source: any): any {
    const result = { ...target }
    for (const key of Object.keys(source)) {
        if (
            isObject(result[key]) && isObject(source[key])
        ) {
            result[key] = deepMerge(result[key], source[key])
        } else {
            result[key] = source[key]
        }
    }
    return result
}

function isObject(val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val)
}

/** JSON.stringify that serializes BigInt as plain integer literals */
function jsonStringify(obj: unknown): string {
    const placeholder = '__BIGINT_'
    let counter = 0
    const bigints = new Map<string, string>()

    const json = JSON.stringify(
        obj,
        (_, v) => {
            if (typeof v === 'bigint') {
                const key = `"${placeholder}${counter++}"`
                bigints.set(key, v.toString())
                return key.slice(1, -1)
            }
            return v
        },
        2,
    )

    let result = json
    for (const [key, value] of bigints) {
        result = result.replace(key, value)
    }
    return result
}

function hexEncode(bytes: Uint8Array): string {
    return '0x' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(
        '',
    )
}

function u32ToLeHex(n: number): string {
    const buf = new Uint8Array(4)
    new DataView(buf.buffer).setUint32(0, n, true)
    return '0x' + [...buf].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function storageKey(pallet: string, item: string): string {
    const enc = new TextEncoder()
    const a = Twox128(enc.encode(pallet))
    const b = Twox128(enc.encode(item))
    const combined = new Uint8Array(a.length + b.length)
    combined.set(a)
    combined.set(b, a.length)
    return hexEncode(combined)
}

/**
 * Convert a patched chain spec to raw format and inject genesis storage keys.
 *
 * The scheduler's on_initialize reads LastRelayChainBlockNumber as `now`.
 * Without it `now=0` and IncompleteSince gets reset every block, causing
 * the scheduler to crawl from block 1 toward the current block (~295M).
 * We inject both keys so the scheduler starts from a recent relay block.
 *
 * Key encoding: twox128(pallet_name) ++ twox128(storage_item_name)
 * Value: (unix_time_ms - 2h) / 6000 as u32 LE — recomputed each generation.
 */
export async function buildRawChainSpec(
    patchedSpecPath: string,
    rawOutputPath: string,
): Promise<void> {
    const binary = await ensureOmniNode()
    await ensureDir(dirname(rawOutputPath))

    const stdout = await capture([
        binary,
        'build-spec',
        '--raw',
        '--chain',
        patchedSpecPath,
    ])

    // deno-lint-ignore no-explicit-any
    const spec: any = JSON.parse(stdout)

    const relayBlock = Math.floor((Date.now() - 2 * 3600_000) / 6000)
    const value = u32ToLeHex(relayBlock)

    spec.genesis.raw.top[
        storageKey('Scheduler', 'IncompleteSince')
    ] = value
    spec.genesis.raw.top[
        storageKey('ParachainSystem', 'LastRelayChainBlockNumber')
    ] = value

    await Deno.writeTextFile(rawOutputPath, JSON.stringify(spec, null, 2))
    console.log(`Raw chain spec written to ${rawOutputPath}`)
}

/** Return true if the chain spec already contains the same wasm runtime */
async function isUpToDate(
    runtime: string,
    outputPath: string,
): Promise<boolean> {
    try {
        const [wasmBytes, specText] = await Promise.all([
            Deno.readFile(runtime),
            Deno.readTextFile(outputPath),
        ])
        const spec = JSON.parse(specText)
        const codeKey = hexEncode(new TextEncoder().encode(':code'))
        const embedded: string | undefined = spec.genesis?.raw?.top?.[codeKey]
        if (!embedded) return false
        const wasmHex = hexEncode(wasmBytes)
        return embedded === wasmHex
    } catch {
        return false
    }
}

/** Convenience: build + patch + raw for westend */
export async function buildWestendChainSpec(
    opts: { retester?: boolean },
): Promise<string> {
    const basePath = '/tmp/ah-westend-spec-base.json'
    const patchedPath = '/tmp/ah-westend-spec-patched.json'
    const sdkDir = (await import('./config.ts')).POLKADOT_SDK_DIR
    const runtime = join(
        sdkDir,
        'target/debug/wbuild/asset-hub-westend-runtime/asset_hub_westend_runtime.wasm',
    )

    const outputPath = join(CHAINSPEC_DIR, 'ah-westend-spec.json')

    if (await isUpToDate(runtime, outputPath)) {
        console.log('Chain spec up to date, skipping generation')
        return outputPath
    }

    await buildChainSpec({
        paraId: 1000,
        runtime,
        preset: 'development',
        outputPath: basePath,
    })
    await patchChainSpec(
        basePath,
        patchedPath,
        opts.retester
            ? { retester: true, devStakers: true }
            : { devBalance: true, devStakers: true },
    )
    await buildRawChainSpec(patchedPath, outputPath)

    return outputPath
}

/** Convenience: build + patch + raw for polkadot */
export async function buildPolkadotChainSpec(): Promise<string> {
    const runtimesDir = (await import('./config.ts')).RUNTIMES_DIR
    const basePath = '/tmp/ah-polkadot-spec-base.json'
    const patchedPath = '/tmp/ah-polkadot-spec-patched.json'
    const runtime = join(
        runtimesDir,
        'target/debug/wbuild/asset-hub-polkadot-runtime/asset_hub_polkadot_runtime.wasm',
    )
    const outputPath = join(CHAINSPEC_DIR, 'ah-polkadot-spec.json')

    if (await isUpToDate(runtime, outputPath)) {
        console.log('Chain spec up to date, skipping generation')
        return outputPath
    }

    await buildChainSpec({
        paraId: 1000,
        runtime,
        preset: 'development',
        outputPath: basePath,
    })
    await patchChainSpec(basePath, patchedPath, {
        devBalance: true,
    })
    await buildRawChainSpec(patchedPath, outputPath)

    return outputPath
}

/** Convenience: build + patch + raw for kusama */
export async function buildKusamaChainSpec(): Promise<string> {
    const runtimesDir = (await import('./config.ts')).RUNTIMES_DIR
    const basePath = '/tmp/ah-kusama-spec-base.json'
    const patchedPath = '/tmp/ah-kusama-spec-patched.json'
    const runtime = join(
        runtimesDir,
        'target/debug/wbuild/asset-hub-kusama-runtime/asset_hub_kusama_runtime.wasm',
    )
    const outputPath = join(CHAINSPEC_DIR, 'ah-kusama-spec.json')

    if (await isUpToDate(runtime, outputPath)) {
        console.log('Chain spec up to date, skipping generation')
        return outputPath
    }

    await buildChainSpec({
        paraId: 1000,
        runtime,
        preset: 'development',
        outputPath: basePath,
    })
    await patchChainSpec(basePath, patchedPath, {
        devBalance: true,
    })
    await buildRawChainSpec(patchedPath, outputPath)

    return outputPath
}

/** Convenience: build + patch + raw for paseo */
export async function buildPaseoChainSpec(): Promise<string> {
    const paseoDir = (await import('./config.ts')).PASEO_DIR
    const basePath = '/tmp/ah-paseo-spec-base.json'
    const patchedPath = '/tmp/ah-paseo-spec-patched.json'
    const runtime = join(
        paseoDir,
        'target/debug/wbuild/asset-hub-paseo-runtime/asset_hub_paseo_runtime.wasm',
    )
    const outputPath = join(CHAINSPEC_DIR, 'ah-paseo-spec.json')

    if (await isUpToDate(runtime, outputPath)) {
        console.log('Chain spec up to date, skipping generation')
        return outputPath
    }

    await buildChainSpec({
        paraId: 1000,
        runtime,
        preset: 'development',
        outputPath: basePath,
    })
    await patchChainSpec(basePath, patchedPath, {
        devBalance: true,
    })
    await buildRawChainSpec(patchedPath, outputPath)

    return outputPath
}
