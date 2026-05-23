/**
 * Imports data from a D1 SQL export or seed file into Convex.
 *
 * Usage:
 *   ADMIN_INTERNAL_SECRET=... NEXT_PUBLIC_CONVEX_URL=... npx tsx scripts/migrate-d1-to-convex.ts [--file=seed.sql] [--clear]
 *
 * For production D1 export:
 *   wrangler d1 export lashmealex-d1 --remote --output=./d1-export.sql
 *   npx tsx scripts/migrate-d1-to-convex.ts --file=./d1-export.sql --clear
 */

import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const BATCH = 50;

function parseArgs() {
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const file = fileArg?.split("=")[1] ?? "seed.sql";
  const clearFirst = process.argv.includes("--clear");
  return { file, clearFirst };
}

function parseSqlInserts(sql: string, table: string) {
  const regex = new RegExp(
    `INSERT INTO ${table}[\\s\\S]*?VALUES\\s*([\\s\\S]*?);`,
    "gi",
  );
  const rows: string[][] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    const valuesBlock = match[1];
    const tupleRegex = /\(\s*([\s\S]*?)\s*\)(?=,|\s*$)/g;
    let tupleMatch: RegExpExecArray | null;
    while ((tupleMatch = tupleRegex.exec(valuesBlock)) !== null) {
      const parts = splitSqlTuple(tupleMatch[1]);
      rows.push(parts);
    }
  }
  return rows;
}

function splitSqlTuple(raw: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "'" && raw[i - 1] !== "\\") {
      inQuote = !inQuote;
      current += ch;
      continue;
    }
    if (ch === "," && !inQuote) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.map(unquoteSql);
}

function unquoteSql(value: string): string {
  const trimmed = value.trim();
  if (trimmed.toUpperCase() === "NULL") return "";
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

function toMs(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return Date.now();
  return n < 1_000_000_000_000 ? n * 1000 : n;
}

function parseProducts(sql: string) {
  const inserts = parseSqlInserts(sql, "products");
  return inserts.map((parts) => ({
    id: parts[0],
    parentProductId: parts[1],
    parentProductName: parts[2],
    slug: parts[3],
    name: parts[4],
    variantName: parts[5] || undefined,
    description: parts[6] || undefined,
    category: parts[7] || "Lashes",
    price: Number(parts[8]),
    compareAtPrice: parts[9] ? Number(parts[9]) : undefined,
    inventory: Number(parts[10]),
    imageUrl: parts[11] || undefined,
    isFeatured: parts[12] === "1",
    isHero: false,
    isActive: parts[14] === "1",
    sortOrder: Number(parts[13] ?? 0),
    createdAt: toMs(parts[15] ?? String(Date.now())),
    updatedAt: toMs(parts[16] ?? String(Date.now())),
  }));
}

function parseCarts(sql: string) {
  const inserts = parseSqlInserts(sql, "carts");
  return inserts.map((parts) => ({
    id: parts[0],
    email: parts[1],
    phone: parts[2],
    name: parts[3],
    status: parts[4] || "active",
    notes: parts[5] || undefined,
    createdAt: toMs(parts[6] ?? String(Date.now())),
    updatedAt: toMs(parts[7] ?? String(Date.now())),
    lastActiveAt: toMs(parts[8] ?? parts[7] ?? String(Date.now())),
  }));
}

function parseCartItems(sql: string) {
  const inserts = parseSqlInserts(sql, "cart_items");
  return inserts.map((parts) => ({
    id: parts[0],
    cartId: parts[1],
    productId: parts[2],
    quantity: Number(parts[3]),
    createdAt: toMs(parts[4] ?? String(Date.now())),
    updatedAt: toMs(parts[5] ?? String(Date.now())),
  }));
}

function parseOrders(sql: string) {
  const inserts = parseSqlInserts(sql, "orders");
  return inserts.map((parts) => ({
    id: parts[0],
    stripeSessionId: parts[1] || undefined,
    status: parts[2] || "pending",
    fulfillmentStatus: parts[3] || "unfulfilled",
    subtotal: Number(parts[4]),
    total: Number(parts[5]),
    customerEmail: parts[6],
    customerName: parts[7] || undefined,
    notes: parts[8] || undefined,
    createdAt: toMs(parts[9] ?? String(Date.now())),
    updatedAt: toMs(parts[10] ?? String(Date.now())),
  }));
}

function parseOrderItems(sql: string) {
  const inserts = parseSqlInserts(sql, "order_items");
  return inserts.map((parts) => ({
    id: parts[0],
    orderId: parts[1],
    productId: parts[2],
    quantity: Number(parts[3]),
    price: Number(parts[4]),
  }));
}

async function importBatches(
  client: ConvexHttpClient,
  adminSecret: string,
  clearFirst: boolean,
  data: {
    products?: ReturnType<typeof parseProducts>;
    carts?: ReturnType<typeof parseCarts>;
    cartItems?: ReturnType<typeof parseCartItems>;
    orders?: ReturnType<typeof parseOrders>;
    orderItems?: ReturnType<typeof parseOrderItems>;
  },
) {
  let first = clearFirst;
  const tables = [
    ["products", data.products],
    ["carts", data.carts],
    ["cartItems", data.cartItems],
    ["orders", data.orders],
    ["orderItems", data.orderItems],
  ] as const;

  for (const [name, rows] of tables) {
    if (!rows?.length) continue;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      await client.mutation(api.migrations.importD1.importD1Batch, {
        adminSecret,
        clearFirst: first,
        [name]: chunk,
      });
      first = false;
      console.log(`Imported ${Math.min(i + BATCH, rows.length)}/${rows.length} ${name}`);
    }
  }
}

async function main() {
  const { file, clearFirst } = parseArgs();
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const adminSecret = process.env.ADMIN_INTERNAL_SECRET;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
  if (!adminSecret) throw new Error("ADMIN_INTERNAL_SECRET is required");

  const sql = readFileSync(file, "utf8");
  const client = new ConvexHttpClient(url);

  const products = parseProducts(sql);
  const carts = parseCarts(sql);
  const cartItems = parseCartItems(sql);
  const orders = parseOrders(sql);
  const orderItems = parseOrderItems(sql);

  console.log(
    `Parsed: ${products.length} products, ${carts.length} carts, ${cartItems.length} cart items, ${orders.length} orders, ${orderItems.length} order items`,
  );

  await importBatches(client, adminSecret, clearFirst, {
    products,
    carts,
    cartItems,
    orders,
    orderItems,
  });

  console.log("Import complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
