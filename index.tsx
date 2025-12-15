import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n/config"; // Initialize i18n
import { initSentry } from "./services/sentry"; // Initialize error tracking

// Initialize Sentry for production error tracking
initSentry();

// Register Service Worker for PWA features (Push Notifications, Offline Mode)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("✅ Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.warn("⚠️ Service Worker registration failed:", error);
      });
  });
}

// 🧹 AUTO-CLEAR CACHE ON F5 (hard reload)
window.addEventListener("beforeunload", () => {
  // Clear localStorage (except auth tokens and stripe payment session)
  const authToken = localStorage.getItem("supabase.auth.token");
  const sessionData = localStorage.getItem("supabase.auth.session");
  const stripePaymentSession = localStorage.getItem("stripe_payment_session");
  const pendingPaymentEmail = localStorage.getItem("pending_payment_email");
  const pendingPaymentUserType = localStorage.getItem(
    "pending_payment_user_type"
  );

  // Clear all localStorage
  localStorage.clear();

  // Restore auth tokens
  if (authToken) localStorage.setItem("supabase.auth.token", authToken);
  if (sessionData) localStorage.setItem("supabase.auth.session", sessionData);

  // ✅ CRITICAL: Restore Stripe payment session for redirect recovery
  if (stripePaymentSession)
    localStorage.setItem("stripe_payment_session", stripePaymentSession);
  if (pendingPaymentEmail)
    localStorage.setItem("pending_payment_email", pendingPaymentEmail);
  if (pendingPaymentUserType)
    localStorage.setItem("pending_payment_user_type", pendingPaymentUserType);

  // Clear sessionStorage
  sessionStorage.clear();

  console.log("🧹 Cache cleared on reload!");
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
