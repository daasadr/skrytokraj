"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { createAuthToken, consumeAuthToken } from "@/lib/tokens";
import {
  sendVerifyEmail,
  sendPasswordResetEmail,
} from "@/lib/email";

const APP_URL = process.env.AUTH_URL ?? "";
const HOUR = 60 * 60 * 1000;

export interface AuthFormState {
  error: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Přihlášení -------------------------------------------------------------
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vyplň e-mail i heslo." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/mapa",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Nesprávný e-mail nebo heslo." };
    }
    // redirect (NEXT_REDIRECT) i jiné chyby musí probublat dál
    throw error;
  }
  return { error: null };
}

// --- Registrace -------------------------------------------------------------
export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordAgain = String(formData.get("passwordAgain") ?? "");
  const terms = formData.get("terms");

  if (!terms) return { error: "Pro registraci je potřeba souhlas s podmínkami." };
  if (!name) return { error: "Zadej jméno nebo přezdívku." };
  if (!EMAIL_RE.test(email)) return { error: "Zadej platný e-mail." };
  if (password.length < 8)
    return { error: "Heslo musí mít alespoň 8 znaků." };
  if (password !== passwordAgain)
    return { error: "Hesla se neshodují." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Uživatel s tímto e-mailem už existuje." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "user" },
  });

  // Nepovinné potvrzení e-mailu (hodí se pro pozdější obnovu hesla).
  void (async () => {
    const raw = await createAuthToken(user.id, "email_verify", 24 * HOUR);
    void sendVerifyEmail(user.email, user.name, `${APP_URL}/overit-email/${raw}`);
  })();

  // rovnou přihlásíme a přesměrujeme na mapu
  try {
    await signIn("credentials", { email, password, redirectTo: "/mapa" });
  } catch (error) {
    if (error instanceof AuthError) {
      // účet vznikl, jen se nepovedlo automatické přihlášení
      return { error: "Účet byl vytvořen, ale přihlášení selhalo. Zkus se přihlásit ručně." };
    }
    throw error;
  }
  return { error: null };
}

// --- Odhlášení --------------------------------------------------------------
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

// --- Zapomenuté heslo: žádost o odkaz ---------------------------------------
export interface ForgotState {
  error: string | null;
  sent: boolean;
}

export async function forgotPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Zadej platný e-mail.", sent: false };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isBlocked) {
    const raw = await createAuthToken(user.id, "password_reset", HOUR);
    void sendPasswordResetEmail(
      user.email,
      user.name,
      `${APP_URL}/obnova-hesla/${raw}`,
    );
  }
  // Vždy stejná odpověď — neprozrazujeme, jestli e-mail existuje.
  return { error: null, sent: true };
}

// --- Obnova hesla: nastavení nového ----------------------------------------
export interface ResetState {
  error: string | null;
  done: boolean;
}

export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordAgain = String(formData.get("passwordAgain") ?? "");

  if (password.length < 8)
    return { error: "Heslo musí mít alespoň 8 znaků.", done: false };
  if (password !== passwordAgain)
    return { error: "Hesla se neshodují.", done: false };

  const userId = await consumeAuthToken(token, "password_reset");
  if (!userId) {
    return {
      error: "Odkaz je neplatný nebo vypršel. Požádej prosím o nový.",
      done: false,
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { error: null, done: true };
}

// --- Ověření e-mailu --------------------------------------------------------
export interface VerifyState {
  error: string | null;
  ok: boolean;
}

export async function verifyEmailAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "");
  const userId = await consumeAuthToken(token, "email_verify");
  if (!userId) {
    return { error: "Odkaz je neplatný nebo už byl použit.", ok: false };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });
  return { error: null, ok: true };
}
