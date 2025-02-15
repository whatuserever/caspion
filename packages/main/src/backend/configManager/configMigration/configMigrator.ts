import { z } from 'zod';
import { type Config } from '../../commonTypes';
import { isOriginalConfig } from './versions/original';
import { migrateOriginalToV1 } from './versions/v1';
import { migrateV1ToV2, v2ConfigSchema } from './versions/v2';

const latestConfigSchema = v2ConfigSchema;

// migrations[n] should be a function that converts version n to version n+1
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrations: Record<number, (config: any) => any> = {
  1: migrateV1ToV2,
};

export function migrateConfig(config: unknown): Config {
  let currentConfig = config;
  // original config does not have version key and must be handled separately
  if (isOriginalConfig(config)) {
    currentConfig = migrateOriginalToV1(config);
  }
  let currentVersion = getConfigVersion(currentConfig);

  while (migrations[currentVersion]) {
    currentConfig = migrations[currentVersion](currentConfig);
    currentVersion = getConfigVersion(currentConfig);
  }

  return latestConfigSchema.parse(currentConfig) as Config;
}

function getConfigVersion(config: unknown): keyof typeof migrations {
  const versionSchema = z.object({ version: z.number().int().positive() });
  return versionSchema.parse(config).version;
}
