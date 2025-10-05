// lib/httpClient.js
import axios from "axios";
import http from "node:http";
import https from "node:https";
import CacheableLookup from "cacheable-lookup";
import axiosRetry from "axios-retry";

// Prefer IPv4 on quirky networks; keep connections alive to avoid DNS churn
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100, family: 4 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100, family: 4 });

// Cache DNS lookups to reduce ENOTFOUND spikes
const cacheable = new CacheableLookup();
cacheable.install(http.globalAgent);
cacheable.install(https.globalAgent);

// Gemini base client
export const geminiClient = axios.create({
  baseURL: "https://generativelanguage.googleapis.com",
  timeout: 30000, // 30s is safer for model cold starts
  httpAgent,
  httpsAgent,
  // Explicitly follow redirects if any edge returns 3xx
  maxRedirects: 3
});

// ElevenLabs base client
export const elevenClient = axios.create({
  baseURL: "https://api.elevenlabs.io",
  timeout: 20000,
  httpAgent,
  httpsAgent,
  maxRedirects: 3,
  // Some SDKs set this header; not required, but harmless:
  // headers: { "Accept": "application/json" }
});

// Retries for transient network errors and HTTP 5xx
for (const client of [geminiClient, elevenClient]) {
  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500)
  });
}
