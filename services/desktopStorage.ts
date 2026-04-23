export function isDesktopApp(): boolean {
  return Boolean(window.desktopStorage?.isDesktop);
}

export async function readDesktopDataset<T>(userId: string, key: string): Promise<T | null> {
  if (!window.desktopStorage) {
    return null;
  }
  return (await window.desktopStorage.readDataset(userId, key)) as T | null;
}

export async function writeDesktopDataset(userId: string, key: string, value: unknown): Promise<string | null> {
  if (!window.desktopStorage) {
    return null;
  }
  return window.desktopStorage.writeDataset(userId, key, value);
}

export async function getDesktopDataRoot(): Promise<string | null> {
  if (!window.desktopStorage) {
    return null;
  }
  return window.desktopStorage.getRootPath();
}
