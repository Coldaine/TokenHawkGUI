import { access, copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.resolve(root, '../../public/sidecars/swarm-lab')
const dist = path.join(root, 'dist')
const builtAssets = path.join(dist, 'assets')
const servedAssets = path.join(target, 'assets')
const entry = path.join(target, 'index.html')
const MOUNT = '/sidecars/swarm-lab/assets/'
let installed = false

async function exists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

/** Asset paths the mounted HTML will request, rejected if they are not flat names. */
function mountedAssets(html) {
  const names = new Set()
  for (const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    const reference = match[1]
    const at = reference.indexOf(MOUNT)
    if (at === -1) continue
    const name = reference.slice(at + MOUNT.length).split(/[?#]/)[0]
    if (!name || name.includes('/') || name.includes('\\') || name === '..' || name === '.') {
      throw new Error(`refusing to mount unexpected asset reference "${reference}"`)
    }
    names.add(name)
  }
  return [...names]
}

async function main() {
  const builtHtmlPath = path.join(dist, 'index.html')
  if (!(await exists(builtHtmlPath))) throw new Error(`missing build output at ${builtHtmlPath}`)

  const builtHtml = await readFile(builtHtmlPath, 'utf8')
  const html = builtHtml
    .replaceAll('"./assets/', `"${MOUNT}`)
    .replaceAll("'./assets/", `'${MOUNT}`)

  const refs = mountedAssets(html)
  if (refs.length === 0) throw new Error('built index.html references no assets')

  if (!(await exists(builtAssets))) throw new Error(`missing build output at ${builtAssets}`)
  const built = await readdir(builtAssets)

  // Nothing in the served folder is touched until the build is known complete.
  for (const name of refs) {
    if (!built.includes(name)) throw new Error(`built entry references missing asset ${name}`)
  }

  // 1. Publish the new files first: the current entry keeps working throughout.
  await mkdir(servedAssets, { recursive: true })
  for (const name of built) {
    await copyFile(path.join(builtAssets, name), path.join(servedAssets, name))
  }

  // 2. Every mounted reference must resolve on disk before the entry is swapped.
  for (const name of refs) {
    if (!(await exists(path.join(servedAssets, name)))) {
      throw new Error(`mounted asset did not land: ${name}`)
    }
  }

  // 3. Stage the rewritten entry beside the live one, then replace it atomically.
  const staged = path.join(target, `.index.html.${process.pid}.tmp`)
  try {
    await writeFile(staged, html, 'utf8')
    await rename(staged, entry)
    installed = true
  } finally {
    await rm(staged, { force: true })
  }

  // 4. Only the entry now installed can declare assets obsolete.
  const keep = new Set(built)
  let removed = 0
  for (const name of await readdir(servedAssets)) {
    if (keep.has(name)) continue
    await rm(path.join(servedAssets, name), { force: true })
    removed += 1
  }

  console.log(`Synced Swarm Lab bundle to ${target} (${refs.length} refs, ${removed} obsolete removed)`)
}

main().catch((error) => {
  console.error(`Swarm Lab sync failed: ${error.message}`)
  console.error(
    installed
      ? 'The new entry is installed; asset cleanup may be incomplete.'
      : 'The previously served bundle was left intact.',
  )
  process.exitCode = 1
})
