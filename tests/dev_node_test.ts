import { assertEquals } from '@std/assert'
import {
    cleanup,
    drain,
    startNodeEnv,
    tmuxWindowExists,
    waitForPort,
} from './test_utils.ts'

Deno.test({
    name: 'dev-node run: starts and listens on 9944',
    fn: async () => {
        const proc = startNodeEnv(['dev-node', 'run'])
        drain(proc.stdout)
        drain(proc.stderr)
        try {
            await waitForPort(9944, 60_000)
        } finally {
            await cleanup({ procs: [proc], ports: [9944] })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})

Deno.test({
    name: 'dev-node proxy: node on 8844, mitmproxy on 9944',
    fn: async () => {
        const proc = startNodeEnv(['dev-node', 'proxy'])
        drain(proc.stdout)
        drain(proc.stderr)
        try {
            await waitForPort(8844, 60_000)
            await waitForPort(9944, 10_000)
            assertEquals(
                await tmuxWindowExists('mitmproxy'),
                true,
                'mitmproxy tmux window should exist',
            )
        } finally {
            await cleanup({
                procs: [proc],
                ports: [8844, 9944],
                windows: ['mitmproxy'],
            })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})
