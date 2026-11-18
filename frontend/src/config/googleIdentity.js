const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise = null;
let buttonParent = null;
let pending = null;

function cancelled() {
  return Object.assign(new Error("cancelled"), { code: "cancelled" });
}

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

function renderHiddenButton() {
  if (buttonParent || !window.google?.accounts?.id) {
    return;
  }

  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    auto_select: false,
    callback: (response) => {
      const current = pending;
      pending = null;

      if (!current) {
        return;
      }

      if (response?.credential) {
        current.resolve(response.credential);
        return;
      }

      current.reject(cancelled());
    },
  });

  buttonParent = document.createElement("div");
  buttonParent.setAttribute("aria-hidden", "true");
  buttonParent.style.position = "fixed";
  buttonParent.style.top = "0";
  buttonParent.style.left = "-1000px";
  buttonParent.style.width = "240px";
  buttonParent.style.height = "44px";
  document.body.appendChild(buttonParent);

  window.google.accounts.id.renderButton(buttonParent, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    width: 240,
  });
}

function clickChooser() {
  return new Promise((resolve, reject) => {
    const clickable =
      buttonParent?.querySelector('[role="button"]') || buttonParent?.querySelector("iframe");

    if (!clickable) {
      reject(Object.assign(new Error("Google sign-in is not ready."), { code: "unavailable" }));
      return;
    }

    pending = { resolve, reject };

    let leftPage = false;
    const cleanup = () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
    const onBlur = () => {
      leftPage = true;
    };
    const onFocus = () => {
      if (!leftPage) {
        return;
      }

      window.setTimeout(() => {
        if (!pending) {
          cleanup();
          return;
        }

        const current = pending;
        pending = null;
        cleanup();
        current.reject(cancelled());
      }, 500);
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    clickable.click();
  });
}

if (typeof window !== "undefined") {
  loadGoogleScript().then(renderHiddenButton).catch(() => {});
}

export function requestGoogleIdToken() {
  if (window.google?.accounts?.id && buttonParent?.querySelector("iframe, [role='button']")) {
    return clickChooser();
  }

  return loadGoogleScript().then(() => {
    renderHiddenButton();
    return clickChooser();
  });
}
