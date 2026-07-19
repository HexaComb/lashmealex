import { describe, expect, test } from "vitest";

import {
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
} from "./cart-constants";

describe("cart identity validation", () => {
  test("normalizes email and phone values before storage", () => {
    expect(normalizeEmail("  CUSTOMER@Example.COM ")).toBe("customer@example.com");
    expect(normalizePhone("(559) 555-1234")).toBe("5595551234");
  });

  test("accepts only usable email and phone values", () => {
    expect(isValidEmail("customer@example.com")).toBe(true);
    expect(isValidEmail("customer@example")).toBe(false);
    expect(isValidPhone("(559) 555-1234")).toBe(true);
    expect(isValidPhone("555-123")).toBe(false);
  });
});
