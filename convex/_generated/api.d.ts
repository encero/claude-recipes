/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cookingHistory from "../cookingHistory.js";
import type * as http from "../http.js";
import type * as imageGeneration from "../imageGeneration.js";
import type * as imageGenerationHelpers from "../imageGenerationHelpers.js";
import type * as recipes from "../recipes.js";
import type * as scheduledMeals from "../scheduledMeals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cookingHistory: typeof cookingHistory;
  http: typeof http;
  imageGeneration: typeof imageGeneration;
  imageGenerationHelpers: typeof imageGenerationHelpers;
  recipes: typeof recipes;
  scheduledMeals: typeof scheduledMeals;
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
