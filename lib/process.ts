import { ensureDir } from '@std/fs'
import { join } from '@std/path'
import { LOG_DIR } from './config.ts'

export interface RunResult {
    process: Deno.ChildProcess
    logFile: string
}

export interface SpawnOptions {
    name: string
    cmd: string[]
    env?: Record<string, string>
    cwd?: string
}

/** Spawn a process, tee stdout+stderr to ~/.revive/logs/<name>.log */
export async function spawn(opts: SpawnOptions): Promise<RunResult> {
    await ensureDir(LOG_DIR)
    const logFile = join(LOG_DIR, `${opts.name}.log`)
    const file = await Deno.open(logFile, {
        write: true,
        create: true,
        truncate: true,
    })

    console.log(`> ${opts.cmd.join(' ')}`)
    console.log(`  logging to ${logFile}`)

    const process = new Deno.Command(opts.cmd[0], {
        args: opts.cmd.slice(1),
        env: opts.env,
        cwd: opts.cwd,
        stdout: 'piped',
        stderr: 'piped',
    }).spawn()

    // Tee stdout to console + file
    const [stdoutA, stdoutB] = process.stdout.tee()
    stdoutA.pipeTo(Deno.stdout.writable, { preventClose: true })
        .catch(() => {})
    stdoutB.pipeTo(file.writable, { preventClose: true })
        .catch(() => {})

    // Stderr to console only
    process.stderr.pipeTo(Deno.stderr.writable, { preventClose: true })
        .catch(() => {})

    return { process, logFile }
}

/** Spawn and wait for exit, throw on non-zero status */
export async function run(opts: SpawnOptions): Promise<RunResult> {
    const result = await spawn(opts)
    const status = await result.process.status
    if (!status.success) {
        throw new Error(
            `${opts.cmd[0]} exited with code ${status.code}`,
        )
    }
    return result
}

/** Spawn and wait for exit (for long-running servers, Ctrl-C exits) */
export async function serve(opts: SpawnOptions): Promise<void> {
    const result = await spawn(opts)
    await result.process.status
}

/** Run a command and capture stdout as string */
export async function capture(
    cmd: string[],
    opts?: { env?: Record<string, string>; cwd?: string },
): Promise<string> {
    console.log(`> ${cmd.join(' ')}`)
    const output = await new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        env: opts?.env,
        cwd: opts?.cwd,
        stdout: 'piped',
        stderr: 'inherit',
    }).output()
    if (!output.success) {
        throw new Error(`${cmd[0]} exited with code ${output.code}`)
    }
    return new TextDecoder().decode(output.stdout)
}

/** Run a command, inheriting stdio (no tee) */
export async function exec(
    cmd: string[],
    opts?: { env?: Record<string, string>; cwd?: string },
): Promise<void> {
    console.log(`> ${cmd.join(' ')}`)
    const status = await new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        env: opts?.env,
        cwd: opts?.cwd,
        stdout: 'inherit',
        stderr: 'inherit',
    }).output()
    if (!status.success) {
        throw new Error(`${cmd[0]} exited with code ${status.code}`)
    }
}
