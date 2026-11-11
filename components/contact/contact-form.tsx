"use client";

import { FormEvent, useState } from "react";

import { FORM_API } from "@/lib/constants";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const note = String(form.get("message") || "").trim();

    if (name.length < 2 || !email.includes("@") || note.length < 8) {
      setStatus("error");
      setMessage("Add your name, a real email, and a short message.");
      return;
    }

    if (!FORM_API) {
      const body = `${name}\n${email}\n\n${note}`;
      window.location.href = `mailto:hello@openhotels.com?subject=${encodeURIComponent("Open Hotels inquiry")}&body=${encodeURIComponent(body)}`;
      setStatus("sent");
      setMessage("Your email app should open with this message.");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(FORM_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, message: note }),
      });
      if (!response.ok) throw new Error("The form did not send.");
      setStatus("sent");
      setMessage("Message sent. We will reply to the email you entered.");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setMessage("The message did not send. Email hello@openhotels.com instead.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-ink/8">
      <label className="block text-sm font-medium">
        Name
        <input name="name" required autoComplete="name" className="mt-1 w-full rounded-2xl border border-line px-3 py-3 font-normal outline-none" />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-2xl border border-line px-3 py-3 font-normal outline-none" />
      </label>
      <label className="block text-sm font-medium">
        Message
        <textarea name="message" required rows={5} className="mt-1 w-full rounded-2xl border border-line px-3 py-3 font-normal outline-none" />
      </label>
      {message ? (
        <p role="status" className={status === "error" ? "text-sm text-clay" : "text-sm text-pine"}>
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === "sending" ? "Sending" : "Send message"}
      </button>
    </form>
  );
}
