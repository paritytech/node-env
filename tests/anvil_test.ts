import { assertEquals } from '@std/assert'
import {
    cleanup,
    drain,
    startNodeEnv,
    tmuxWindowExists,
    waitForPort,
} from './test_utils.ts'

Deno.test({
    name: 'anvil run: starts and listens on 8545',
    fn: async () => {
        const proc = startNodeEnv(['anvil', 'run'])
        drain(proc.stdout)
        drain(proc.stderr)
        try {
            await waitForPort(8545, 30_000)
        } finally {
            await cleanup({ procs: [proc], ports: [8545] })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})

Deno.test({
    name: 'anvil proxy: anvil on 8546, mitmproxy on 8545',
    fn: async () => {
        const proc = startNodeEnv(['anvil', 'proxy'])
        drain(proc.stdout)
        drain(proc.stderr)
        try {
            await waitForPort(8546, 30_000)
            await waitForPort(8545, 10_000)
            assertEquals(
                await tmuxWindowExists('mitmproxy'),
                true,
                'mitmproxy tmux window should exist',
            )
        } finally {
            await cleanup({
                procs: [proc],
                ports: [8545, 8546],
                windows: ['mitmproxy'],
            })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})

Deno.test({
    name: 'anvil run --port 9000: listens on custom port',
    fn: async () => {
        const proc = startNodeEnv(['anvil', 'run', '--port', '9000'])
        drain(proc.stdout)
        drain(proc.stderr)
        try {
            await waitForPort(9000, 30_000)
        } finally {
            await cleanup({ procs: [proc], ports: [9000] })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})
