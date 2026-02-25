import { ensureDir } from '@std/fs'
import { dirname, join } from '@std/path'
import { CONTRACTS_BOILERPLATE_DIR, REVIVE_DIR } from './config.ts'
import { capture } from './process.ts'

export interface BuildChainSpecOptions {
    binary: string
    paraId: number
    runtime: string
    preset: string
    outputPath: string
    relayChain?: string
}

/** Build chain spec using chain-spec-builder or polkadot-omni-node */
export async function buildChainSpec(
    opts: BuildChainSpecOptions,
): Promise<void> {
    await ensureDir(dirname(opts.outputPath))
    const stdout = await capture([
        opts.binary,
        ...(opts.binary.includes('polkadot-omni-node')
            ? ['chain-spec-builder', '--chain-spec-path', opts.outputPath]
            : ['-c', opts.outputPath]),
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
    CONTRACTS_BOILERPLATE_DIR,
    'scripts',
    'retester-chainspec-patch.json',
)

const DEV_BALANCE_ENTRY: [string, number] = [
    '5HYRCKHYJN9z5xUtfFkyMj4JUhsAwWyvuU8vKB1FcnYTf9ZQ',
    100000000000000001000000000,
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
        const balances = spec.genesis?.runtimeGenesis?.patch?.balances
            ?.balances ?? []
        balances.push(DEV_BALANCE_ENTRY)
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

    await Deno.writeTextFile(outputPath, JSON.stringify(spec, null, 2))
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

    if (opts.retester) {
        await buildChainSpec({
            binary: 'polkadot-omni-node',
            paraId: 1000,
            runtime,
            preset: 'development',
            outputPath: basePath,
        })
        await patchChainSpec(basePath, outputPath, {
            retester: true,
            devStakers: true,
        })
    } else {
        await buildChainSpec({
            binary: 'chain-spec-builder',
            paraId: 1000,
            runtime,
            preset: 'development',
            outputPath: basePath,
        })
        await patchChainSpec(basePath, outputPath, {
            devBalance: true,
            devStakers: true,
        })
    }

    return outputPath
}

/** Convenience: build + patch for paseo */
export async function buildPaseoChainSpec(): Promise<string> {
    const home = Deno.env.get('HOME') ?? ''
    const passetDir = (await import('./config.ts')).PASSET_HUB_DIR
    const basePath = '/tmp/passet-spec.json'
    const runtime = join(
        passetDir,
        'target/debug/wbuild/passet-hub-runtime/passet_hub_runtime.wasm',
    )
    const outputPath = join(home, 'passet-spec.json')

    await buildChainSpec({
        binary: 'chain-spec-builder',
        paraId: 1111,
        runtime,
        preset: 'development',
        outputPath: basePath,
    })
    await patchChainSpec(basePath, outputPath, {
        devBalance: true,
        devStakers: true,
    })

    return outputPath
}
