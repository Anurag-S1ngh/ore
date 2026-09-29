import { Router } from "express";
import { authController } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/send-otp", authController.sendOTP);
authRouter.post("/verify-otp", authController.verifyOTP);
authRouter.post("/logout", authController.logout);
