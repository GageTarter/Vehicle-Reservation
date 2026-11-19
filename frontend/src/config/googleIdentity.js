const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise = null;
let initialized = false;
let handlers = {};

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-identity]");

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => {
          scriptPromise = null;
          reject(new Error("Google script failed"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Google script failed"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function mountButton(parent, nextHandlers) {
  if (!window.google?.accounts?.id || parent.childElementCount > 0) {
    return;
  }

  handlers = nextHandlers;

  if (!initialized) {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      auto_select: false,
      use_fedcm_for_button: true,
      callback: (response) => {
        if (response?.credential) {
          handlers.onCredential(response.credential);
          return;
        }

        handlers.onCancel?.();
      },
    });
    initialized = true;
  }

  window.google.accounts.id.renderButton(parent, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    width: 240,
  });
}

export function renderSignInButton(parent, nextHandlers) {
  if (!parent) {
    return Promise.resolve();
  }

  return loadGoogleScript()
    .then(() => {
      mountButton(parent, nextHandlers);
    })
    .catch((error) => {
      nextHandlers.onError?.(error);
    });
}
