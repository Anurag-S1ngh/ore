import { randomInt } from "crypto";

export const generateOTP = () => {
  return randomInt(100_000, 1_000_000).toString();
};
