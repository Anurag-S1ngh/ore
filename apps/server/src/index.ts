import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { ENV } from "./env.server";
import { router } from "./router";

const app = express();

app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use(express.json());

app.use(cookieParser());

app.use("/api/v1", router);

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
