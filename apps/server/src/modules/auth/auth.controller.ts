import type { Request, Response } from "express";
import { ENV } from "@/env.server";
import { AppError } from "@/types/error";
import { generateJWT } from "@/util/token";
import { authService } from "./auth.service";
import { sendOTPValidation, verifyOTPValidation } from "./auth.validation";

const isProd = ENV.NODE_ENV === "production";

const authCookieOptions: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "none";
  path: string;
} = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const authController = {
  async sendOTP(req: Request, res: Response) {
    const validatedData = sendOTPValidation.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json(validatedData.error.issues[0]?.message);
    }
    const { email, username } = validatedData.data;
    try {
      await authService.sendOTP(email, username);
      return res.status(200).json({ status: "ok" });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "something went wrong" });
    }
  },

  async verifyOTP(req: Request, res: Response) {
    const validatedData = verifyOTPValidation.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json(validatedData.error.issues[0]?.message);
    }
    const { email, otp } = validatedData.data;
    try {
      const user = await authService.verifyOTP(email, otp);
      const jwtToken = await generateJWT(user.id);
      res.cookie("auth_cookie", jwtToken, {
        ...authCookieOptions,
        maxAge: SESSION_MAX_AGE,
      });
      return res.status(200).json({ status: "ok" });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "something went wrong" });
    }
  },
  async logout(_req: Request, res: Response) {
    res.clearCookie("auth_cookie", authCookieOptions);
    return res.status(200).json({ status: "ok" });
  },
};
