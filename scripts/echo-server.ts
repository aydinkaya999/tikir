// pnpm echo-server: a local WebSocket server that sends every message straight back
// (docs/dinleme-hatti.md, section 5). It listens on 127.0.0.1 only; the Vite dev and preview
// servers forward /gelistirme/yanki to it, so the audio lab connects to its own origin.
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

export const echoServerPort = 4318;

export interface EchoServer {
  port: number;
  close(): Promise<void>;
}

export async function startEchoServer(port: number = echoServerPort): Promise<EchoServer> {
  // A plain HTTP answer lets test runners see that the server is up.
  const http = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('tikir echo server\n');
  });
  const sockets = new WebSocketServer({ server: http });
  sockets.on('connection', (socket) => {
    socket.on('message', (data, isBinary) => {
      socket.send(data, { binary: isBinary });
    });
  });

  await new Promise<void>((resolve, reject) => {
    http.once('error', reject);
    http.listen(port, '127.0.0.1', () => {
      http.off('error', reject);
      resolve();
    });
  });
  const address = http.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : port;

  return {
    port: actualPort,
    close: () =>
      new Promise<void>((resolve, reject) => {
        for (const client of sockets.clients) {
          client.terminate();
        }
        sockets.close();
        http.close((error) => {
          if (error === undefined) {
            resolve();
          } else {
            reject(error);
          }
        });
      }),
  };
}

if (import.meta.main) {
  const portArgument = process.argv.slice(2).find((argument) => /^\d+$/.test(argument));
  const server = await startEchoServer(
    portArgument === undefined ? echoServerPort : Number(portArgument),
  );
  console.log(`Echo server on ws://127.0.0.1:${String(server.port)} (Ctrl+C to stop)`);
  process.on('SIGINT', () => {
    void server.close().then(() => process.exit(0));
  });
}
