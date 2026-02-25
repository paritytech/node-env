const DENO_CMD = 'deno'
const MOD_PATH = new URL('../mod.ts', import.meta.url).pathname

function nodeEnvCmd(subcommand: string): string {
    return `${DENO_CMD} run --allow-all ${MOD_PATH} ${subcommand}`
}

/** Kill existing 'servers' tmux window if it exists */
export async function killServersWindow(): Promise<void> {
    try {
        await new Deno.Command('tmux', {
            args: ['kill-window', '-t', 'servers'],
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
    await exec('tmux', [
        'split-window',
        '-t',
        target,
        '-d',
        nodeEnvCmd(subcommand),
    ])
}

/** Select a pane */
export async function selectPane(target: string): Promise<void> {
    await exec('tmux', ['select-pane', '-t', target])
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
