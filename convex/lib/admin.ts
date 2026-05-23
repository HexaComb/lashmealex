export function assertAdminSecret(adminSecret: string | undefined) {
  const expected = process.env.ADMIN_INTERNAL_SECRET;
  if (!expected || !adminSecret || adminSecret !== expected) {
    throw new Error("Unauthorized");
  }
}
