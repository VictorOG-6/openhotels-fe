import { readAssistantContext, type AssistantContext } from "@/lib/assistant/context";

export const ASSISTANT_SCRIPT = "https://agentplace.io/admin/embed/v1.js";
export const ASSISTANT_URL = "https://szfgvjidxrop.run.agentplace.io/";

type Assistant = {
  ready: Promise<void>;
  setContext: (context: Record<string, string | number | boolean | null>) => void;
};

declare global {
  interface Window {
    AgentplaceAssistant?: {
      init: (options: {
        agentUrl: string;
        controls?: "input" | "voice" | "compact";
        persistence?: "session" | "none";
      }) => Assistant;
    };
  }
}

let chain: Promise<void> = Promise.resolve();
let assistant: Promise<Assistant> | null = null;

export function publishAssistantContext(context: AssistantContext = readAssistantContext()) {
  const snapshot = context;
  chain = chain
    .catch(() => undefined)
    .then(async () => {
      const instance = await loadAssistant();
      applyContext(instance, snapshot);
    });
  return chain;
}

function loadAssistant() {
  assistant ??= waitForScript().then(() => {
    const api = window.AgentplaceAssistant;
    if (!api) throw new Error("Assistant script did not load");
    const created = api.init({
      agentUrl: ASSISTANT_URL,
      controls: "compact",
      persistence: "session",
    });
    return created.ready.then(() => created);
  });
  return assistant.then(
    (instance) => instance,
    (error: unknown) => {
      assistant = null;
      throw error;
    },
  );
}

function waitForScript() {
  return new Promise<void>((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.AgentplaceAssistant) {
        resolve();
        return;
      }
      if (Date.now() - started > 15000) {
        reject(new Error("Assistant script did not load"));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

function applyContext(instance: Assistant, context: AssistantContext) {
  try {
    instance.setContext(context);
  } catch {
    try {
      instance.setContext({
        ...context,
        isSignedIn: false,
        accessToken: "",
        userEmail: "",
      });
    } catch {
      // The embed rejects context that is too large or the wrong shape.
    }
  }
}
