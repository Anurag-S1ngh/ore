import type { currencyEnum } from "@ore/db/schema/index";

export type Currency = (typeof currencyEnum.enumValues)[number];
