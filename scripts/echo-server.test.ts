import { afterEach, describe, expect, it } from 'vitest';
import { startEchoServer } from './echo-server';

let close: (() => Promise<void>) | null = null;

afterEach(async () => {
  await close?.();
  close = null;
});

function nextMessage(socket: WebSocket): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    socket.addEventListener('message', (event: MessageEvent<ArrayBuffer>) => {
      resolve(event.data);
    });
    socket.addEventListener('error', () => {
      reject(new Error('socket error'));
    });
  });
}

describe('echo server', () => {
  it('sends every binary message back as it came', async () => {
    const server = await startEchoServer(0);
    close = () => server.close();
    const socket = new WebSocket(`ws://127.0.0.1:${String(server.port)}/gelistirme/yanki`);
    socket.binaryType = 'arraybuffer';
    await new Promise((resolve) => socket.addEventListener('open', resolve));

    const reply = nextMessage(socket);
    socket.send(Uint8Array.of(1, 2, 3, 250));

    expect(Array.from(new Uint8Array(await reply))).toEqual([1, 2, 3, 250]);
    socket.close();
  });

  it('answers a plain HTTP request, so test runners can see it is up', async () => {
    const server = await startEchoServer(0);
    close = () => server.close();

    const response = await fetch(`http://127.0.0.1:${String(server.port)}/`);

    expect(response.status).toBe(200);
  });

  it('frees its port when closed', async () => {
    const server = await startEchoServer(0);
    await server.close();

    await expect(fetch(`http://127.0.0.1:${String(server.port)}/`)).rejects.toThrow();
  });
});

describe('echo server under a bad client', () => {
  it('closes a connection that sends too much, and keeps echoing for the others', async () => {
    const server = await startEchoServer(0);
    close = () => server.close();
    const url = `ws://127.0.0.1:${String(server.port)}/gelistirme/yanki`;
    const greedy = new WebSocket(url);
    await new Promise((resolve) => greedy.addEventListener('open', resolve));
    const closedWith = new Promise<number>((resolve) => {
      greedy.addEventListener('close', (event) => {
        resolve(event.code);
      });
    });

    greedy.send(new Uint8Array(1024 * 1024)); // far above a 648-byte audio frame

    expect(await closedWith).toBe(1009); // message too big
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    await new Promise((resolve) => socket.addEventListener('open', resolve));
    const reply = nextMessage(socket);
    socket.send(Uint8Array.of(9));
    expect(Array.from(new Uint8Array(await reply))).toEqual([9]);
    socket.close();
  });
});
