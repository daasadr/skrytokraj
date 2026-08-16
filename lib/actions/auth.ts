"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";

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
  await prisma.user.create({
    data: { name, email, passwordHash, role: "user" },
  });

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
