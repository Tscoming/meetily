import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';

export interface BuildInfo {
  version: string;
  commit: string;
  dirty: boolean;
  build_version: string;
}

let buildInfoPromise: Promise<BuildInfo> | null = null;

export async function getBuildInfo(): Promise<BuildInfo> {
  if (!buildInfoPromise) {
    buildInfoPromise = invoke<BuildInfo>('get_build_info').catch(async () => {
      const version = await getVersion();
      return {
        version,
        commit: 'unknown',
        dirty: false,
        build_version: version,
      };
    });
  }

  return buildInfoPromise;
}

export async function getBuildVersion(): Promise<string> {
  const buildInfo = await getBuildInfo();
  return buildInfo.build_version || buildInfo.version;
}
