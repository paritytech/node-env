const MOD_PATH = new URL('../mod.ts', import.meta.url).pathname

/** Spawn `deno run --allow-all mod.ts <args>` as a background child process */
export function startNodeEnv(args: string[]): Deno.ChildProcess {
    return new Deno.Command('deno', {
        args: ['run', '--allow-all', MOD_PATH, ...args],
        stdout: 'piped',
        stderr: 'piped',
    }).spawn()
}

/** Wait until a TCP port accepts connections */
export async function waitForPort(
    port: number,
    timeoutMs = 30_000,
): Promise<void> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
        try {
            const conn = await Deno.connect({ port })
            conn.close()
            return
        } catch {
            await new Promise((r) => setTimeout(r, 250))
        }
    }
    throw new Error(`Port ${port} not listening after ${timeoutMs}ms`)
}

/** Assert a port is NOT listening */
export async function assertPortFree(port: number): Promise<void> {
    try {
        const conn = await Deno.connect({ port })
        conn.close()
        throw new Error(`Expected port ${port} to be free, but it's listening`)
    } catch (e) {
        if (e instanceof Deno.errors.ConnectionRefused) return
        throw e
    }
}

/** Check if a tmux window exists by name */
export async function tmuxWindowExists(name: string): Promise<boolean> {
    try {
        const out = await new Deno.Command('tmux', {
            args: ['list-windows', '-F', '#{window_name}'],
            stdout: 'piped',
            stderr: 'null',
        }).output()
        const windows = new TextDecoder().decode(out.stdout)
        return windows.split('\n').some((w) => w.trim() === name)
    } catch {
        return false
    }
}

/** Kill a process and wait for it to exit */
export async function killProcess(
    proc: Deno.ChildProcess,
): Promise<void> {
    try {
        proc.kill('SIGTERM')
    } catch {
        // already dead
    }
    try {
        await proc.status
    } catch {
        // already collected
    }
}

/** Kill anything on a port */
export async function killPort(port: number): Promise<void> {
    try {
        await new Deno.Command('fuser', {
            args: ['-k', `${port}/tcp`],
            stdout: 'null',
            stderr: 'null',
        }).output()
    } catch {
        // nothing on that port
    }
}

/** Kill a tmux window */
export async function killTmuxWindow(name: string): Promise<void> {
    try {
        await new Deno.Command('tmux', {
            args: ['kill-window', '-t', name],
            stdout: 'null',
            stderr: 'null',
        }).output()
    } catch {
        // doesn't exist
    }
}

/** Cleanup helper — kills processes, ports, tmux windows */
export async function cleanup(opts: {
    procs?: Deno.ChildProcess[]
    ports?: number[]
    windows?: string[]
}): Promise<void> {
    for (const proc of opts.procs ?? []) {
        await killProcess(proc)
    }
    for (const port of opts.ports ?? []) {
        await killPort(port)
    }
    for (const win of opts.windows ?? []) {
        await killTmuxWindow(win)
    }
}

/** Drain a readable stream in the background (prevent backpressure stall) */
export function drain(stream: ReadableStream<Uint8Array>): void {
    stream.pipeTo(new WritableStream()).catch(() => {})
}
