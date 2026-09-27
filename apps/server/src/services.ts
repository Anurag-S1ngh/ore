import { createDb } from "@ore/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
