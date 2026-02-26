import { ensureDir } from '@std/fs'
import { dirname, join } from '@std/path'
import { POLKADOT_SDK_DIR, REVIVE_DIR } from './config.ts'
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

/** Convenience: build + patch for westend */
export async function buildWestendChainSpec(
    opts: { retester?: boolean },
): Promise<string> {
    const basePath = '/tmp/ah-westend-spec-base.json'
    const sdkDir = (await import('./config.ts')).POLKADOT_SDK_DIR
    const runtime = join(
        sdkDir,
        'target/debug/wbuild/asset-hub-westend-runtime/asset_hub_westend_runtime.wasm',
    )

    const outputPath = opts.retester
        ? join(REVIVE_DIR, 'ah-westend-spec.json')
        : join(Deno.env.get('HOME') ?? '', 'ah-westend-spec.json')

    await buildChainSpec({
        paraId: 1000,
        runtime,
        preset: 'development',
        outputPath: basePath,
    })
    await patchChainSpec(
        basePath,
        outputPath,
        opts.retester
            ? { retester: true, devStakers: true }
            : { devBalance: true, devStakers: true },
    )

    return outputPath
}

/** Convenience: build + patch for paseo */
export async function buildPaseoChainSpec(): Promise<string> {
    const home = Deno.env.get('HOME') ?? ''
    const paseoDir = (await import('./config.ts')).PASEO_DIR
    const basePath = '/tmp/ah-paseo-spec-base.json'
    const runtime = join(
        paseoDir,
        'target/debug/wbuild/asset-hub-paseo-runtime/asset_hub_paseo_runtime.wasm',
    )
    const outputPath = join(home, 'ah-paseo-spec.json')

    await buildChainSpec({
        paraId: 1000,
        runtime,
        preset: 'development',
        outputPath: basePath,
    })
    await patchChainSpec(basePath, outputPath, {
        devBalance: true,
    })

    return outputPath
}
