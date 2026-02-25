import { assertEquals } from '@std/assert'

const MOD_PATH = new URL('../mod.ts', import.meta.url).pathname

function run(args: string[]) {
    return new Deno.Command('deno', {
        args: ['run', '--allow-all', MOD_PATH, ...args],
        stdout: 'piped',
        stderr: 'piped',
    }).output()
}

Deno.test('no args shows help and exits 0', async () => {
    const out = await run([])
    assertEquals(out.code, 0)
    const stdout = new TextDecoder().decode(out.stdout)
    assertEquals(
        stdout.includes('dev-node'),
        true,
        'no-args output missing subcommands',
    )
})

Deno.test('--help lists all subcommands', async () => {
    const out = await run(['--help'])
    const stdout = new TextDecoder().decode(out.stdout)
    for (
        const name of [
            'dev-node',
            'eth-rpc',
            'westend',
            'paseo',
            'eth-anvil',
            'anvil',
            'geth',
            'revive-dev-stack',
            'westend-dev-stack',
            'paseo-dev-stack',
            'anvil-dev-stack',
            'geth-dev-stack',
            'completions',
        ]
    ) {
        assertEquals(
            stdout.includes(name),
            true,
            `--help output missing subcommand: ${name}`,
        )
    }
})

for (
    const sub of [
        'dev-node',
        'eth-rpc',
        'anvil',
        'geth',
        'revive-dev-stack',
        'anvil-dev-stack',
        'geth-dev-stack',
    ]
) {
    Deno.test(`${sub} --help exits 0`, async () => {
        const out = await run([sub, '--help'])
        assertEquals(out.code, 0)
    })
}
