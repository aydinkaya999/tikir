import { writeToneFile } from './tone';

export default async function globalSetup(): Promise<void> {
  await writeToneFile();
}
