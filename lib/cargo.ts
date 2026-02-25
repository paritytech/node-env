import { exec } from './process.ts'

export interface CargoBuildOptions {
    manifestPath: string
    package: string
    bin?: string
    release?: boolean
    quiet?: boolean
    env?: Record<string, string>
}

export async function cargoBuild(opts: CargoBuildOptions): Promise<void> {
    const cmd = [
        'cargo',
        'build',
        '--manifest-path',
        opts.manifestPath,
        '-p',
        opts.package,
    ]
    if (opts.bin) cmd.push('--bin', opts.bin)
    if (opts.release) cmd.push('--release')
    if (opts.quiet) cmd.push('--quiet')
    await exec(cmd, { env: opts.env })
}
