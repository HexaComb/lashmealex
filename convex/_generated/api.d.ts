/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as carts from "../carts.js";
import type * as lib_admin from "../lib/admin.js";
import type * as lib_cartUtils from "../lib/cartUtils.js";
import type * as lib_catalogUtils from "../lib/catalogUtils.js";
import type * as migrations_importD1 from "../migrations/importD1.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  carts: typeof carts;
  "lib/admin": typeof lib_admin;
  "lib/cartUtils": typeof lib_cartUtils;
  "lib/catalogUtils": typeof lib_catalogUtils;
  "migrations/importD1": typeof migrations_importD1;
  orders: typeof orders;
  products: typeof products;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
