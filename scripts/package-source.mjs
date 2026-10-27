// Keep the downloadable application source current, without including credentials or dependencies.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { crc32 } from 'node:zlib';
const root = new URL('../', import.meta.url);
const files = [
  'package.json', 'package-lock.json', 'server.mjs', 'Dockerfile', 'render.yaml',
  '.gitignore', '.dockerignore', '.node-version', '.env.example',
  'README.md', 'SETUP.md', 'PROJECT-NOTES.md', 'VERIFICATION.md', 'THIRD-PARTY-NOTICES.md', 'LICENSE',
];
async function collect(directory) {
  for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.endsWith('.log') || entry.name === 'source.zip') continue;
    const path = directory + entry.name;
    if (entry.isDirectory()) await collect(path + '/');
    else if (entry.isFile()) files.push(path);
  }
}
for (const directory of ['public/', 'scripts/', 'test/']) await collect(directory);
const bodies = [], index = [];
let offset = 0;
const date = new Date();
const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
for (const path of files.sort()) {
  const data = await readFile(new URL(path, root));
  const name = Buffer.from('proxy-lab/' + path);
  const checksum = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(dosTime, 10); local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(checksum, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(dosTime, 12); central.writeUInt16LE(dosDate, 14);
  central.writeUInt32LE(checksum, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
  bodies.push(local, name, data); index.push(central, name);
  offset += local.length + name.length + data.length;
}
const directory = Buffer.concat(index);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
await writeFile(new URL('public/source.zip', root), Buffer.concat([...bodies, directory, end]));
console.log(`Source download refreshed (${files.length} project files; no .env or node_modules).`);
