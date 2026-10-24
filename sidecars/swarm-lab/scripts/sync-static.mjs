import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.resolve(root, '../../public/sidecars/swarm-lab')
const dist = path.join(root, 'dist')

await mkdir(path.join(target, 'assets'), { recursive: true })
for (const name of await readdir(path.join(target, 'assets'))) {
  await rm(path.join(target, 'assets', name), { force: true })
}
await rm(path.join(target, 'index.html'), { force: true })
await cp(path.join(dist, 'assets'), path.join(target, 'assets'), { recursive: true })
await cp(path.join(dist, 'index.html'), path.join(target, 'index.html'))

const htmlPath = path.join(target, 'index.html')
const html = await readFile(htmlPath, 'utf8')
await writeFile(
  htmlPath,
  html
    .replaceAll('"./assets/', '"/sidecars/swarm-lab/assets/')
    .replaceAll("'./assets/", "'/sidecars/swarm-lab/assets/"),
)
console.log(`Synced Swarm Lab bundle to ${target}`)
