"use client";

import { persistAuthSession } from "@/lib/auth-session";
import { API_URL } from "@/lib/constants";
import processError from "@/lib/error";
import { getFirstFieldErrorMessage } from "@/lib/form";
import { $http } from "@/lib/http";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FieldErrors, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import GoogleSignInButton from "@/components/auth/google-sign-in-button";
import {
  authInputClassName,
  authLabelClassName,
} from "@/components/auth/auth-styles";

const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z
      .email("Enter a valid email")
      .toLowerCase()
      .trim()
      .min(2, "Email must be at least 2 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (password) => {
          const hasUppercase = /[A-Z]/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?:"|{}<>]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          const hasMinLength = password.length >= 8;
          return hasUppercase && hasMinLength && hasSpecialChar && hasNumber;
        },
        {
          message:
            "Password must contain at least one uppercase letter, one special character, one number, and be at least 8 characters long.",
        },
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormField = z.infer<typeof signUpSchema>;

interface SignUpResponse {
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

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasSpecialChar: false,
    hasNumber: false,
    hasMinLength: false,
  });

  const form = useForm<SignUpFormField>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const watchPassword = form.watch("password");
  const watchConfirmPassword = form.watch("confirmPassword");

  useEffect(() => {
    setPasswordValidation({
      hasUpperCase: /[A-Z]/.test(watchPassword),
      hasSpecialChar: /[!@#$%^&*(),.?:"|{}<>]/.test(watchPassword),
      hasNumber: /[0-9]/.test(watchPassword),
      hasMinLength: watchPassword.length >= 8,
    });
    setShowPasswordValidation(watchPassword.length > 0);
  }, [watchPassword]);

  useEffect(() => {
    if (watchConfirmPassword) {
      form.trigger("confirmPassword");
    }
  }, [watchPassword, watchConfirmPassword, form]);

  const passwordRequirements = [
    { key: "hasMinLength", label: "At least 8 characters" },
    { key: "hasUpperCase", label: "One uppercase letter" },
    { key: "hasNumber", label: "One number" },
    { key: "hasSpecialChar", label: "One special character" },
  ] as const;

  const canSubmit = form.formState.isValid && acceptTerms && !isLoading;

  const onSubmit: SubmitHandler<SignUpFormField> = async (values) => {
    setIsLoading(true);

    try {
      const { confirmPassword: _, ...payload } = values;
      const { data } = await $http.post<SignUpResponse>("/user", payload);

      await persistAuthSession({
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        user: data.data.user,
      });

      const redirectUri = searchParams.get("redirectUri");
      router.push(redirectUri || "/");
      router.refresh();
    } catch (error) {
      console.error("Sign up error:", error);
      if (error instanceof AxiosError) {
        processError(error);
      } else {
        toast.error("Sign up failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = () => {
    setIsGoogleAuthLoading(true);
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleFormError = (errors: FieldErrors<SignUpFormField>) => {
    const message = getFirstFieldErrorMessage(errors);
    if (message) toast.error(message);
  };

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-28">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
          Account
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          Create your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Book stays, manage pre-bookings, and pick up where you left off.
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
            Full name
            <input
              autoComplete="name"
              className={authInputClassName}
              {...form.register("name")}
            />
          </label>
          <label className={authLabelClassName}>
            Email
            <input
              type="email"
              autoComplete="email"
              className={authInputClassName}
              {...form.register("email")}
            />
          </label>
          <label className={authLabelClassName}>
            Password
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          {showPasswordValidation ? (
            <ul className="space-y-1.5 rounded-2xl bg-sand/80 px-3 py-3 text-xs">
              {passwordRequirements.map((rule) => {
                const met =
                  passwordValidation[
                    rule.key as keyof typeof passwordValidation
                  ];
                return (
                  <li
                    key={rule.key}
                    className={cn(
                      "flex items-center gap-2",
                      met ? "text-pine" : "text-muted",
                    )}
                  >
                    {met ? <Check size={14} /> : <X size={14} />}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          ) : null}

          <label className={authLabelClassName}>
            Confirm password
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                className={`${authInputClassName} mt-0 pr-11`}
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-line"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
            />
            <span>
              I agree to the{" "}
              <Link
                href="/terms-of-service"
                className="font-medium text-clay hover:text-clay-dark"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                className="font-medium text-clay hover:text-clay-dark"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay-dark disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-clay hover:text-clay-dark"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-paper">
          <Loader2 className="h-8 w-8 animate-spin text-clay" />
        </main>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
