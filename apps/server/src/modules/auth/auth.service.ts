import { users } from "@ore/db/schema/index";
import { sendEmail } from "@ore/email";
import { del, get, set } from "@ore/redis-client";
import { eq } from "drizzle-orm";
import { ENV } from "@/env.server";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { isUniqueViolation } from "@/util/db-error";
import { generateOTP } from "@/util/generateOTP";

type OTPPayload = {
  otp: string;
  username: string;
};

export const authService = {
  async sendOTP(email: string, username: string) {
    const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (byEmail) {
      if (byEmail.username !== username) {
        throw new AppError("username does not match this email", 400);
      }
    } else {
      const [byUsername] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      if (byUsername) {
        throw new AppError("user with this username already exists", 400);
      }
    }

    const otp = generateOTP();
    const key = `otp:${email}`;
    await set(key, JSON.stringify({ otp, username }), 300);
    const err = await sendEmail(email, "Verify your email", `<strong>OTP is ${otp}</strong>`);
    if (err) {
      if (ENV.NODE_ENV !== "production") {
        console.log(`[auth] email send failed; dev OTP for ${email}: ${otp}`);
        return;
      }
      await del(key);
      throw new AppError("Error while sending email", 500);
    }
  },
  async verifyOTP(email: string, userInputOTP: string) {
    const key = `otp:${email}`;
    const raw = await get(key);
    if (!raw) {
      throw new AppError("otp not found", 400);
    }

    let payload: OTPPayload;
    try {
      payload = JSON.parse(raw) as OTPPayload;
    } catch {
      throw new AppError("otp not found", 400);
    }

    if (payload.otp !== userInputOTP) {
      throw new AppError("otp is incorrect", 400);
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      await del(key);
      return existing;
    }

    let user: typeof users.$inferSelect | undefined;
    try {
      [user] = await db
        .insert(users)
        .values({
          email,
          username: payload.username,
        })
        .returning();
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("user with this username already exists", 400);
      }
      throw err;
    }
    if (!user) {
      throw new AppError("Error while creating user", 500);
    }
    await del(key);
    return user;
  },
};
