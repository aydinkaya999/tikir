// Hands a file to the user as a download (the audio lab's WAV takes and device reports).

/** How long the blob URL outlives the click; WebKit starts the download asynchronously. */
const releaseAfterMs = 60_000;

export function saveFile(fileName: string, data: Blob): void {
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, releaseAfterMs);
}
