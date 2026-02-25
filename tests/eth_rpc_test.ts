import { assertEquals } from '@std/assert'
import {
    cleanup,
    drain,
    startNodeEnv,
    tmuxWindowExists,
    waitForPort,
} from './test_utils.ts'

Deno.test({
    name: 'eth-rpc run: starts with dev-node and listens on 8545',
    fn: async () => {
        const node = startNodeEnv(['dev-node', 'run'])
        drain(node.stdout)
        drain(node.stderr)
        try {
            await waitForPort(9944, 60_000)
            const rpc = startNodeEnv(['eth-rpc', 'run'])
            drain(rpc.stdout)
            drain(rpc.stderr)
            try {
                await waitForPort(8545, 30_000)
            } finally {
                await cleanup({ procs: [rpc], ports: [8545] })
            }
        } finally {
            await cleanup({ procs: [node], ports: [9944] })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})

Deno.test({
    name: 'eth-rpc proxy: rpc on 8546, mitmproxy on 8545',
    fn: async () => {
        const node = startNodeEnv(['dev-node', 'run'])
        drain(node.stdout)
        drain(node.stderr)
        try {
            await waitForPort(9944, 60_000)
            const rpc = startNodeEnv(['eth-rpc', 'proxy'])
            drain(rpc.stdout)
            drain(rpc.stderr)
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
                    procs: [rpc],
                    ports: [8545, 8546],
                    windows: ['mitmproxy'],
                })
            }
        } finally {
            await cleanup({ procs: [node], ports: [9944] })
        }
    },
    sanitizeOps: false,
    sanitizeResources: false,
})
