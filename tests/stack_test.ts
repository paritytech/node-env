import { assertEquals } from '@std/assert'
import {
    cleanup,
    drain,
    startNodeEnv,
    tmuxWindowExists,
    waitForPort,
} from './test_utils.ts'

/** Count panes in a tmux window */
async function paneCount(window: string): Promise<number> {
    try {
        const out = await new Deno.Command('tmux', {
            args: ['list-panes', '-t', window, '-F', '#{pane_index}'],
            stdout: 'piped',
            stderr: 'null',
        }).output()
        const lines = new TextDecoder().decode(out.stdout).trim().split('\n')
        return lines.filter((l) => l.length > 0).length
    } catch {
        return 0
    }
}

Deno.test({
    name: 'revive-dev-stack: servers window with 2 panes, port 8545',
    fn: async () => {
        const proc = startNodeEnv(['revive-dev-stack'])
        drain(proc.stdout)
        drain(proc.stderr)
        try {
            await waitForPort(8545, 60_000)
            assertEquals(
                await tmuxWindowExists('servers'),
                true,
                'servers tmux window should exist',
            )
            assertEquals(
                await paneCount('servers'),
                2,
                'servers window should have 2 panes',
            )
        } finally {
            await cleanup({
                procs: [proc],
                ports: [8545, 9944],
                windows: ['servers'],
            })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})

Deno.test({
    name: 'revive-dev-stack --proxy: servers + mitmproxy windows',
    fn: async () => {
        const proc = startNodeEnv(['revive-dev-stack', '--proxy'])
        drain(proc.stdout)
        drain(proc.stderr)
        try {
            await waitForPort(8545, 60_000)
            assertEquals(
                await tmuxWindowExists('servers'),
                true,
                'servers tmux window should exist',
            )
            assertEquals(
                await tmuxWindowExists('mitmproxy'),
                true,
                'mitmproxy tmux window should exist',
            )
        } finally {
            await cleanup({
                procs: [proc],
                ports: [8545, 8546, 9944],
                windows: ['servers', 'mitmproxy'],
            })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})

Deno.test({
    name: 'anvil-dev-stack: servers window, port 8545',
    fn: async () => {
        const proc = startNodeEnv(['anvil-dev-stack'])
        drain(proc.stdout)
        drain(proc.stderr)
        try {
            await waitForPort(8545, 60_000)
            assertEquals(
                await tmuxWindowExists('servers'),
                true,
                'servers tmux window should exist',
            )
        } finally {
            await cleanup({
                procs: [proc],
                ports: [8545],
                windows: ['servers'],
            })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})
