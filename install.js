// 1) Register the service worker (makes the app work offline).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) =>
      console.warn("Service worker registration failed:", err)
    );
  });
}

// 2) "Install app" button (Android / Chrome / Edge) and iPhone instructions.
const installBtn = document.getElementById("installBtn");
const iosNote = document.getElementById("iosNote");

const isInstalled =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true; // iPhone home-screen app

const isIOS =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS

if (!isInstalled && isIOS) {
  iosNote.classList.remove("hidden");
}

let deferredPrompt = null;

// Chrome on Android fires this when the app can be installed.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  installBtn.classList.add("hidden");
});
