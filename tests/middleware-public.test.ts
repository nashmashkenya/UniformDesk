import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/middleware";

describe("middleware public paths", () => {
  it("allows login, proof, offline, and key APIs", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/sso")).toBe(true);
    expect(isPublicPath("/offline")).toBe(true);
    expect(isPublicPath("/issue-offline")).toBe(true);
    expect(isPublicPath("/v/abc123")).toBe(true);
    expect(isPublicPath("/api/v1/roster/sync")).toBe(true);
    expect(isPublicPath("/api/v1/sso/exchange")).toBe(true);
    expect(isPublicPath("/api/v1/payments/mpesa/callback")).toBe(true);
  });

  it("protects desk and supplier pages", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/issue")).toBe(false);
    expect(isPublicPath("/supplier")).toBe(false);
    expect(isPublicPath("/api/v1/issue")).toBe(false);
    expect(isPublicPath("/api/v1/issue-desk")).toBe(false);
  });
});
