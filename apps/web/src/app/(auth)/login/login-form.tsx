"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ore/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ore/ui/components/card";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getErrorMessage } from "@/lib/api";
import { rememberIdentity, useSendOtp, useVerifyOtp } from "@/lib/queries";

const detailsSchema = z.object({
  username: z.string().min(1, "Username is required").max(20, "Username is too long"),
  email: z.email("Enter a valid email"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

type DetailsValues = z.infer<typeof detailsSchema>;
type OtpValues = z.infer<typeof otpSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [step, setStep] = React.useState<"details" | "otp">("details");
  const [account, setAccount] = React.useState<DetailsValues | null>(null);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const detailsForm = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { username: "", email: "" },
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  function onSendDetails(values: DetailsValues) {
    sendOtp.mutate(values, {
      onSuccess: () => {
        setAccount(values);
        setStep("otp");
        otpForm.reset({ otp: "" });
        toast.success("Verification code sent", {
          description: `Check ${values.email} for your 6-digit code.`,
        });
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function onVerify(values: OtpValues) {
    if (!account) return;
    verifyOtp.mutate(
      { email: account.email, otp: values.otp },
      {
        onSuccess: () => {
          rememberIdentity(account.email, account.username);
          const destination: Route =
            next && next.startsWith("/") ? (next as Route) : "/dashboard";
          router.push(destination);
          router.refresh();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <Card className="bg-card shadow-xl ring-foreground/10">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center bg-primary font-mono text-sm font-bold text-primary-foreground">
            o
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight">ore</span>
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg">
            {step === "details" ? "Sign in" : "Enter your code"}
          </CardTitle>
          <CardDescription>
            {step === "details"
              ? "We'll email you a one-time code. No password required."
              : `We sent a 6-digit code to ${account?.email}.`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {step === "details" ? (
          <form
            onSubmit={detailsForm.handleSubmit(onSendDetails)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="ada"
                {...detailsForm.register("username")}
              />
              {detailsForm.formState.errors.username ? (
                <p className="text-[11px] text-destructive">
                  {detailsForm.formState.errors.username.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...detailsForm.register("email")}
              />
              {detailsForm.formState.errors.email ? (
                <p className="text-[11px] text-destructive">
                  {detailsForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" disabled={sendOtp.isPending}>
              {sendOtp.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Send code
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              New here? Signing in creates your account automatically.
            </p>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(onVerify)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="otp">One-time code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="data-mono text-center text-base tracking-[0.5em]"
                {...otpForm.register("otp")}
              />
              {otpForm.formState.errors.otp ? (
                <p className="text-[11px] text-destructive">
                  {otpForm.formState.errors.otp.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" disabled={verifyOtp.isPending}>
              {verifyOtp.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Verify & continue
            </Button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => {
                setStep("details");
                setAccount(null);
              }}
            >
              <ArrowLeft className="size-3" />
              Use a different email
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
