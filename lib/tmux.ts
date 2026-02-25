const DENO_CMD = 'deno'
const MOD_PATH = new URL('../mod.ts', import.meta.url).pathname

function nodeEnvCmd(subcommand: string): string {
    return `${DENO_CMD} run --allow-all ${MOD_PATH} ${subcommand}`
}

/** Get the current tmux session name */
async function resolveSession(): Promise<string> {
    const out = await new Deno.Command('tmux', {
        args: ['display-message', '-p', '#S'],
        stdout: 'piped',
        stderr: 'null',
    }).output()
    const name = new TextDecoder().decode(out.stdout).trim()
    if (!name) throw new Error('Not running inside a tmux session')
    return name
}

function sessionTarget(session: string, suffix?: string): string {
    return suffix ? `${session}:${suffix}` : session
}

/** Kill existing 'servers' tmux window if it exists */
export async function killServersWindow(): Promise<void> {
    const session = await resolveSession()
    try {
        await new Deno.Command('tmux', {
            args: [
                'kill-window',
                '-t',
                sessionTarget(session, 'servers'),
            ],
            stdout: 'null',
            stderr: 'null',
        }).output()
    } catch {
        // window doesn't exist, ok
    }
}

/** Create a new tmux window running a node-env subcommand */
export async function newWindow(
    name: string,
    subcommand: string,
): Promise<void> {
    const session = await resolveSession()
    // Kill existing window with the same name to avoid "index in use"
    await new Deno.Command('tmux', {
        args: ['kill-window', '-t', sessionTarget(session, name)],
        stdout: 'null',
        stderr: 'null',
    }).output()
    await exec('tmux', [
        'new-window',
        '-d',
        '-n',
        name,
        nodeEnvCmd(subcommand),
    ])
}

/** Split the window and run another subcommand */
export async function splitWindow(
    target: string,
    subcommand: string,
): Promise<void> {
    const session = await resolveSession()
    await exec('tmux', [
        'split-window',
        '-t',
        sessionTarget(session, target),
        '-d',
        nodeEnvCmd(subcommand),
    ])
}

/** Select a pane */
export async function selectPane(target: string): Promise<void> {
    const session = await resolveSession()
    await exec('tmux', [
        'select-pane',
        '-t',
        sessionTarget(session, target),
    ])
}

async function exec(cmd: string, args: string[]): Promise<void> {
    const status = await new Deno.Command(cmd, {
        args,
        stdout: 'inherit',
        stderr: 'inherit',
    }).output()
    if (!status.success) {
        throw new Error(`${cmd} ${args.join(' ')} failed`)
    }
}
