import { db } from "@/services";
import { AppError } from "@/types/error";
import { generateOTP } from "@/util/generateOTP";
import { users } from "@ore/db/schema/index";
import { sendEmail } from "@ore/email";
import { del, get, set } from "@ore/redis-client";
import { eq } from "drizzle-orm";

export const authService = {
  async sendOTP(email: string, username: string) {
    let userExists;
    [userExists] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (userExists && userExists.email !== email) {
      throw new AppError("user with this username already exists", 400);
    }
    [userExists] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (userExists && userExists.username !== username) {
      throw new AppError("user with this email already exists", 400);
    }

    const otp = generateOTP();
    const key = `otp:${email}`;
    await set(key, otp, 300);
    const err = await sendEmail(
      email,
      "Verify your email",
      `<strong>OTP is ${otp}</strong>`,
    );
    if (!err) {
      await del(key);
      throw new AppError("Error while sending email", 500);
    }
  },
  async verifyOTP(email: string, username: string, userInputOTP: string) {
    const key = `otp:${email}`;
    const otp = await get(key);
    if (!otp) {
      throw new AppError("otp not found", 400);
    }
    if (otp !== userInputOTP) {
      throw new AppError("otp is incorrect", 400);
    }
    let userExists;
    [userExists] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (userExists) {
      throw new AppError("user with this username already exists", 400);
    }
    [userExists] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (userExists) {
      throw new AppError("user with this email already exists", 400);
    }
    const [user] = await db
      .insert(users)
      .values({
        email,
        username,
      })
      .returning();
    if (!user) {
      throw new AppError("Error while creating user", 500);
    }
    await del(key);
    return user;
  },
};
