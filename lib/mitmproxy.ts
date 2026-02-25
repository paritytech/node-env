import { MITMPROXY_DIR } from './config.ts'

/** Kill existing mitmproxy processes and tmux window, then start fresh */
export async function startMitmproxy(
    mappings: string[],
): Promise<void> {
    // Kill existing mitmproxy processes
    try {
        await new Deno.Command('pkill', {
            args: ['-f', 'python.*mitmproxy'],
            stdout: 'null',
            stderr: 'null',
        }).output()
    } catch {
        // no processes to kill
    }

    // Kill existing mitmproxy tmux window
    try {
        await new Deno.Command('tmux', {
            args: ['kill-window', '-t', 'mitmproxy'],
            stdout: 'null',
            stderr: 'null',
        }).output()
    } catch {
        // window doesn't exist
    }

    const modes = mappings.map(
        (m) => {
            const [listen, target] = m.split(':')
            return `reverse:http://localhost:${target}@${listen}`
        },
    )

    const cmd = [
        `cd ${MITMPROXY_DIR}`,
        'source venv/bin/activate',
        `mitmproxy ${
            modes.map((m) => `--mode ${m}`).join(' ')
        } -s scripts/json-rpc.py`,
    ].join(' && ')

    const status = await new Deno.Command('tmux', {
        args: [
            'new-window',
            '-d',
            '-n',
            'mitmproxy',
            'bash',
            '-c',
            cmd,
        ],
        stdout: 'inherit',
        stderr: 'inherit',
    }).output()

    if (!status.success) {
        throw new Error('Failed to start mitmproxy tmux window')
    }

    console.log(
        `mitmproxy: ${
            mappings.map((m) => {
                const [listen, target] = m.split(':')
                return `${listen} → ${target}`
            }).join(', ')
        }`,
    )
}
