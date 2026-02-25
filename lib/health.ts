import { capture } from './process.ts'

/** Poll eth-rpc until it responds to `cast block` */
export async function waitForEthRpc(
    url = 'http://localhost:8545',
    maxAttempts = 45,
): Promise<void> {
    console.log('Waiting for eth-rpc to be ready...')
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await capture(['cast', 'block', '--rpc-url', url])
            console.log('eth-rpc is ready!!')
            await notify('eth-rpc is ready!')
            return
        } catch {
            await new Promise((r) => setTimeout(r, 1000))
        }
    }
    throw new Error(
        `eth-rpc did not become ready after ${maxAttempts} seconds`,
    )
}

/** Fund the default dev address from the geth dev account */
export async function fundDefaultAddress(
    url = 'http://localhost:8545',
): Promise<void> {
    const address = '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac'
    const endowment = '1000ether'
    console.log(`Funding ${address} with ${endowment}...`)

    const devAccountJson = await capture([
        'cast',
        'rpc',
        'eth_accounts',
        '--rpc-url',
        url,
    ])
    const accounts = JSON.parse(devAccountJson)
    const devAccount = accounts[0]
    if (!devAccount) {
        throw new Error('Could not get geth dev account')
    }

    await capture([
        'cast',
        'send',
        address,
        '--value',
        endowment,
        '--from',
        devAccount,
        '--unlocked',
        '--rpc-url',
        url,
    ])
    console.log(`Successfully funded ${address} with ${endowment}`)
}

/** Fund via anvil_setBalance RPC */
export async function fundAnvilAddress(
    url = 'http://localhost:8545',
): Promise<void> {
    const address = '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac'
    console.log(`Funding ${address} via anvil_setBalance`)
    await capture([
        'cast',
        'rpc',
        'anvil_setBalance',
        address,
        '0x3635C9ADC5DEA00000',
        '--rpc-url',
        url,
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
