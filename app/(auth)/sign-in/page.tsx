"use client";

import { persistAuthSession } from "@/lib/auth-session";
import { API_URL } from "@/lib/constants";
import processError from "@/lib/error";
import { getFirstFieldErrorMessage } from "@/lib/form";
import { $http } from "@/lib/http";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FieldErrors, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import GoogleSignInButton from "@/components/auth/google-sign-in-button";
import {
  authInputClassName,
  authLabelClassName,
} from "@/components/auth/auth-styles";

const signInSchema = z.object({
  username: z
    .email("Enter a valid email")
    .toLowerCase()
    .trim()
    .min(2, "Email must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInFormField = z.infer<typeof signInSchema>;

interface SignInResponse {
  data: {
    access_token: string;
    refresh_token: string;
    user: {
      name: string;
      email: string;
      id: string;
    };
  };
}

function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SignInFormField>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
  });

  const canSubmit = form.formState.isValid && !isLoading;

  const onSubmit: SubmitHandler<SignInFormField> = async (values) => {
    setIsLoading(true);

    try {
      const { data } = await $http.post<SignInResponse>("/auth/login", values);

      await persistAuthSession({
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        user: data.data.user,
      });

      const redirectUri = searchParams.get("redirectUri");
      router.push(redirectUri || "/");
      router.refresh();
    } catch (error) {
      console.error("Sign in error:", error);
      if (error instanceof AxiosError) {
        processError(error);
      } else {
        toast.error("Sign in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = () => {
    setIsGoogleAuthLoading(true);
    const redirectUri = searchParams.get("redirectUri");
    const next =
      redirectUri && redirectUri.startsWith("/")
        ? `?redirect_uri=${encodeURIComponent(redirectUri)}`
        : "";
    window.location.href = `${API_URL}/auth/google${next}`;
  };

  const handleFormError = (errors: FieldErrors<SignInFormField>) => {
    const message = getFirstFieldErrorMessage(errors);
    if (message) toast.error(message);
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 pb-16 pt-28">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
          Account
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          Welcome back
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sign in to see bookings, pre-bookings, and saved stays.
        </p>
      </header>
      <div className="mt-8 space-y-6 rounded-3xl bg-white p-6 ring-1 ring-ink/8">
        <GoogleSignInButton
          onClick={signInWithGoogle}
          loading={isGoogleAuthLoading}
        />
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
          <span className="h-px flex-1 bg-line" />
          <span>or</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit, handleFormError)}
          className="space-y-4"
          noValidate
        >
          <label className={authLabelClassName}>
            Email
            <input
              type="email"
              autoComplete="email"
              className={authInputClassName}
              {...form.register("username")}
            />
          </label>
          <label className={authLabelClassName}>
            Password
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`${authInputClassName} mt-0 pr-11`}
                {...form.register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay-dark disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500">
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-clay hover:text-clay-dark"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-paper">
          <Loader2 className="h-8 w-8 animate-spin text-clay" />
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
