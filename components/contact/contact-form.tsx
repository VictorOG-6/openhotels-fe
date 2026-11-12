"use client";

import { useForm, ValidationError } from "@formspree/react";
import { FormEvent, useEffect, useRef } from "react";

import { FORM_API } from "@/lib/constants";

type ContactFields = {
  name: string;
  email: string;
  message: string;
};

const inputClassName =
  "mt-1 w-full rounded-2xl border border-line px-3 py-3 font-normal outline-none";

function MailtoContactForm() {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const note = String(form.get("message") || "").trim();
    const body = `${name}\n${email}\n\n${note}`;
    window.location.href = `mailto:hello@openhotels.com?subject=${encodeURIComponent("Open Hotels inquiry")}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-ink/8">
      <label className="block text-sm font-medium">
        Name
        <input
          name="name"
          required
          minLength={2}
          autoComplete="name"
          className={inputClassName}
        />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClassName}
        />
      </label>
      <label className="block text-sm font-medium">
        Message
        <textarea name="message" required minLength={8} rows={5} className={inputClassName} />
      </label>
      <p className="text-sm text-muted">
        Form delivery is not configured. Submitting opens your email app instead.
      </p>
      <button
        type="submit"
        className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white"
      >
        Send via email
      </button>
    </form>
  );
}

function FormspreeContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, handleSubmit] = useForm<ContactFields>(FORM_API, {
    data: { _subject: "Open Hotels inquiry" },
  });

  useEffect(() => {
    if (state.succeeded) {
      formRef.current?.reset();
    }
  }, [state.succeeded]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-ink/8"
    >
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-px w-px opacity-0"
        aria-hidden
      />
      <label className="block text-sm font-medium">
        Name
        <input
          name="name"
          required
          minLength={2}
          autoComplete="name"
          disabled={state.submitting}
          className={inputClassName}
        />
        <ValidationError errors={state.errors} field="name" className="mt-1 text-sm text-clay" />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={state.submitting}
          className={inputClassName}
        />
        <ValidationError errors={state.errors} field="email" className="mt-1 text-sm text-clay" />
      </label>
      <label className="block text-sm font-medium">
        Message
        <textarea
          name="message"
          required
          minLength={8}
          rows={5}
          disabled={state.submitting}
          className={inputClassName}
        />
        <ValidationError errors={state.errors} field="message" className="mt-1 text-sm text-clay" />
      </label>
      <ValidationError errors={state.errors} className="text-sm text-clay" />
      {state.succeeded ? (
        <p role="status" className="text-sm text-pine">
          Message sent. We will reply to the email you entered.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={state.submitting}
        className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {state.submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

export default function ContactForm() {
  if (!FORM_API) {
    return <MailtoContactForm />;
  }

  return <FormspreeContactForm />;
}
