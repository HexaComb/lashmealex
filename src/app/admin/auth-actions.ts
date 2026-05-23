"use server";

import { redirect } from "next/navigation";

import { loginAdmin, logoutAdmin } from "@/lib/admin-auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const authenticated = await loginAdmin(password);
  if (!authenticated) redirect("/admin/login?error=invalid");
  redirect("/admin");
}

export async function logoutAction() {
  await logoutAdmin();
  redirect("/admin/login");
}
