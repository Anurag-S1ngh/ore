import { ENV } from "@/env.server";
import { jwtVerify, SignJWT } from "jose";

const secret = new TextEncoder().encode(ENV.JWT_SECRET);

export const generateJWT = async (userId: string) => {
  const token = await new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("ore")
    .setSubject(userId)
    .setExpirationTime("7d")
    .sign(secret);

  return token;
};

export const verifyJWT = async (token: string) => {
  const { payload } = await jwtVerify(token, secret);
  return payload;
};
