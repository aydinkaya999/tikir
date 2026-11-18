// pnpm audio-trial: serves the audio lab over HTTPS on this Mac's local network, for trials on
// real phones and tablets (docs/ses-denemesi-sonuclari.md; docs/kararlar.md T20). An iPhone opens
// the microphone only in a secure context, and a home-screen web app cannot click through a
// certificate warning, so the certificate comes from mkcert, whose root the devices trust.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { type NetworkInterfaceInfo, networkInterfaces } from 'node:os';
import path from 'node:path';
import { build, preview } from 'vite';
import { devPaths } from '../src/app/routes.ts';
import { type EchoServer, echoServerPort, startEchoServer } from './echo-server.ts';

const port = 4443;
const outDir = 'dist-trial';
const certDir = path.resolve('.cert');
const certFile = path.join(certDir, 'cert.pem');
const keyFile = path.join(certDir, 'key.pem');

function mkcert(args: string[]): string {
  return execFileSync('mkcert', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/** IPv4 addresses other devices on the network can reach this Mac at. */
function localAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter(
      (entry): entry is NetworkInterfaceInfo =>
        entry !== undefined && entry.family === 'IPv4' && !entry.internal,
    )
    .map((entry) => entry.address);
}

let caRoot: string;
try {
  caRoot = mkcert(['-CAROOT']);
} catch {
  console.error('mkcert is needed: brew install mkcert && mkcert -install');
  process.exit(1);
}

// A fresh certificate on every run: the Mac's address changes from network to network.
const addresses = localAddresses();
mkdirSync(certDir, { recursive: true });
mkcert(['-cert-file', certFile, '-key-file', keyFile, 'localhost', '127.0.0.1', ...addresses]);

let echo: EchoServer | null = null;
try {
  echo = await startEchoServer(echoServerPort);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE') {
    throw error;
  }
  console.log(`An echo server already listens on ${String(echoServerPort)}; using it.`);
}

// The e2e mode keeps the developer pages and the content security policy of a real build.
await build({ mode: 'e2e', logLevel: 'warn', build: { outDir, emptyOutDir: true } });
const server = await preview({
  mode: 'e2e',
  logLevel: 'warn',
  build: { outDir },
  preview: {
    host: true,
    port,
    strictPort: true,
    https: { cert: readFileSync(certFile), key: readFileSync(keyFile) },
  },
});

console.log('Audio lab:');
for (const address of ['localhost', ...addresses]) {
  console.log(`  https://${address}:${String(port)}${devPaths.audio}`);
}
console.log(
  `Root certificate to install on phones and tablets: ${path.join(caRoot, 'rootCA.pem')}`,
);
console.log('Ctrl+C stops both servers.');

process.on('SIGINT', () => {
  void Promise.all([server.close(), echo?.close()]).then(() => process.exit(0));
});
