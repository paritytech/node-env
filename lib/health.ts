import { DEV_ADDRESS } from './config.ts'

/** Send a JSON-RPC request, return the result */
async function rpc(
    url: string,
    method: string,
    params: unknown[] = [],
): Promise<unknown> {
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    })
    const json = await resp.json()
    if (json.error) {
        throw new Error(`RPC error: ${JSON.stringify(json.error)}`)
    }
    return json.result
}

/** Poll eth-rpc until it responds to eth_blockNumber */
export async function waitForEthRpc(
    url = 'http://localhost:8545',
    maxAttempts = 45,
): Promise<void> {
    console.log('Waiting for eth-rpc to be ready...')
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await rpc(url, 'eth_blockNumber')
            console.log('eth-rpc is ready!!')
            await notify('eth-rpc is ready!')
            return
        } catch {
            // connection refused or RPC not ready, retry
        }
        await new Promise((r) => setTimeout(r, 1000))
    }
    throw new Error(
        `eth-rpc did not become ready after ${maxAttempts} seconds`,
    )
}

/** Fund the default dev address from the geth dev account */
export async function fundDefaultAddress(
    url = 'http://localhost:8545',
): Promise<void> {
    console.log(`Funding ${DEV_ADDRESS} with 1000 ETH...`)

    const accounts = await rpc(url, 'eth_accounts') as string[]
    const devAccount = accounts[0]
    if (!devAccount) {
        throw new Error('Could not get geth dev account')
    }

    await rpc(url, 'eth_sendTransaction', [{
        from: devAccount,
        to: DEV_ADDRESS,
        value: '0x3635C9ADC5DEA00000', // 1000 ether
    }])
    console.log(`Successfully funded ${DEV_ADDRESS} with 1000 ETH`)
}

/** Fund via anvil_setBalance RPC */
export async function fundAnvilAddress(
    url = 'http://localhost:8545',
): Promise<void> {
    console.log(`Funding ${DEV_ADDRESS} via anvil_setBalance`)
    await rpc(url, 'anvil_setBalance', [
        DEV_ADDRESS,
        '0x3635C9ADC5DEA00000',
    ])
}

async function notify(message: string): Promise<void> {
    try {
        if (Deno.build.os === 'darwin') {
            await new Deno.Command('osascript', {
                args: [
                    '-e',
                    `display notification "${message}" with title "node-env"`,
                ],
            }).output()
        } else {
            await new Deno.Command('notify-send', {
                args: ['-t', '3000', message],
            }).output()
        }
    } catch {
        // notification not available, ignore
    }
}
