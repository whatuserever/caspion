import { z } from 'zod';
import {
  outputVendorNameSchema,
  outputVendorsSchema as v1OutputVendorsSchema,
  ynabConfigSchema as v1YnabConfigSchema,
} from './original';

import { v1ConfigSchema } from './v1';

export const ynabConfigSchema = v1YnabConfigSchema.extend({
  ...v1YnabConfigSchema.shape,
  options: v1YnabConfigSchema.shape.options.extend({
    accountNumbersToYnabAccountIds: z.record(
      z.string(),
      z.object({
        ynabBudgetId: z.string(),
        ynabAccountId: z.string(),
      }),
    ),
  }),
});

export const outputVendorsSchema = v1OutputVendorsSchema.extend({
  ...v1OutputVendorsSchema.shape,
  ynab: ynabConfigSchema.optional(),
});

export const v2ConfigSchema = v1ConfigSchema.extend({
  ...v1ConfigSchema.shape,
  version: z.literal(2),
  outputVendors: outputVendorsSchema,
});

// Only difference is that YnabConfig.accountNumbersToYnabAccountIds was a Record<string, string>
// but is now a Record<string, { ynabBudgetId: string, ynabAccountId: string }>
export function migrateV1ToV2(v1Config: z.infer<typeof v1ConfigSchema>): z.infer<typeof v2ConfigSchema> {
  const v1ConfigParsed = v1ConfigSchema.parse(v1Config);
  const v1YnabConfig = v1ConfigParsed.outputVendors[outputVendorNameSchema.Values.ynab];
  const v1OutputVendors = v1ConfigParsed.outputVendors;

  let v2YnabConfig = undefined;

  if (v1YnabConfig) {
    const ynabBudgetId = v1YnabConfig.options.budgetId;
    const v1AccountMapping = v1YnabConfig.options.accountNumbersToYnabAccountIds;
    const v2AccountMapping = Object.fromEntries(
      Object.entries(v1AccountMapping).map(([accountNumber, ynabAccountId]) => {
        return [accountNumber, { ynabBudgetId, ynabAccountId }];
      }),
    );

    v2YnabConfig = {
      ...v1YnabConfig,
      options: {
        ...v1YnabConfig.options,
        accountNumbersToYnabAccountIds: v2AccountMapping,
      },
    };
  }

  return {
    ...v1ConfigParsed,
    version: 2,
    outputVendors: {
      ...v1OutputVendors,
      ynab: v2YnabConfig,
    },
  };
}
