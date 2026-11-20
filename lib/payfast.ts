import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { getPayFastConfig } from "@/lib/order-config";

type PayFastFields = Record<string, string>;

const payFastHosts = [
  "www.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
  "sandbox.payfast.co.za",
];

function encodeFormValue(value: string) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

function encodeValue(value: string) {
  return encodeFormValue(value.trim());
}

export function encodePayFastFields(fields: PayFastFields) {
  return Object.entries(fields)
    .map(([key, value]) => `${encodeValue(key)}=${encodeValue(value)}`)
    .join("&");
}

export function buildPayFastValidationBody(entries: [string, string][]) {
  return entries
    .filter(([key]) => key !== "signature")
    .map(([key, value]) => `${encodeFormValue(key)}=${encodeFormValue(value)}`)
    .join("&");
}

export function generatePayFastSignature(fields: PayFastFields, passphrase: string) {
  const parameters = Object.entries(fields)
    .filter(([, value]) => value.trim() !== "")
    .map(([key, value]) => `${encodeValue(key)}=${encodeValue(value)}`)
    .join("&");
  const signedParameters = `${parameters}&passphrase=${encodeValue(passphrase)}`;
  return createHash("md5").update(signedParameters, "utf8").digest("hex");
}

export function parsePayFastNotification(rawBody: string) {
  const params = new URLSearchParams(rawBody);
  const fields: PayFastFields = {};

  for (const [key, value] of params) {
    if (Object.hasOwn(fields, key)) throw new Error("Duplicate PayFast notification field.");
    fields[key] = value;
  }

  const entries = [...params.entries()];
  if (entries.length === 0 || entries.at(-1)?.[0] !== "signature") {
    throw new Error("PayFast signature must be the final notification field.");
  }
  return { fields, entries };
}

export function verifyPayFastNotificationSignature(
  entries: [string, string][],
  signature: string,
  passphrase: string,
) {
  const fields: PayFastFields = {};
  for (const [key, value] of entries) {
    if (key === "signature") break;
    fields[key] = value;
  }
  const expected = generatePayFastSignature(fields, passphrase);
  const expectedBuffer = Buffer.from(expected, "ascii");
  const receivedBuffer = Buffer.from(signature, "ascii");
  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function isMatchingAmount(expectedCents: number, receivedCents: number | null) {
  return receivedCents !== null && expectedCents === receivedCents;
}

export function isAllowedPayFastSourceIp(sourceIp: string, allowedIps: string[]) {
  const normalizedSource = sourceIp.startsWith("::ffff:") ? sourceIp.slice(7) : sourceIp;
  return isIP(normalizedSource) !== 0 && allowedIps.includes(normalizedSource);
}

export function amountToCents(value: string) {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  const fractional = (match[2] ?? "").padEnd(2, "0");
  const cents = Number(match[1]) * 100 + Number(fractional || 0);
  return Number.isSafeInteger(cents) ? cents : null;
}

export async function isPayFastSource(headers: Headers) {
  const config = getPayFastConfig();
  if (!config) return false;

  const forwardedAddresses = headers.get(config.sourceIpHeader);
  const sourceIp = forwardedAddresses?.split(",")[0]?.trim();
  if (!sourceIp) return false;

  const lookups = await Promise.allSettled(
    payFastHosts.map((host) => lookup(host, { all: true, verbatim: true })),
  );
  const allowedIps = lookups.flatMap((result) =>
    result.status === "fulfilled" ? result.value.map(({ address }) => address) : [],
  );
  return isAllowedPayFastSourceIp(sourceIp, allowedIps);
}

export async function verifyPayFastServerConfirmation(rawBody: string, host: string) {
  const endpoint = `https://${host}/eng/query/validate`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: rawBody,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  return response.ok && (await response.text()).trim() === "VALID";
}

export async function createPayFastOnsitePayment(fields: PayFastFields) {
  const config = getPayFastConfig();
  if (!config) throw new Error("PayFast is not configured.");

  const signedFields = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    ...fields,
  };
  const body = encodePayFastFields({
    ...signedFields,
    signature: generatePayFastSignature(signedFields, config.passphrase),
  });
  const response = await fetch(`https://${config.host}/onsite/process`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error(`PayFast returned HTTP ${response.status}.`);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("uuid" in result) || typeof result.uuid !== "string" || result.uuid.length < 8) {
    throw new Error("PayFast did not return a valid payment identifier.");
  }
  return result.uuid;
}
