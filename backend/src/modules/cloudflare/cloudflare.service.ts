import axios, { AxiosError, type AxiosInstance } from "axios";
import { env } from "../../config/env";

type CloudflareErrorItem = {
  code?: number;
  message?: string;
};

type CloudflareErrorResponse = {
  errors?: CloudflareErrorItem[];
};

type CloudflareApiResponse<T> = {
  result: T;
  errors?: CloudflareErrorItem[];
};

type CloudflareZone = {
  id: string;
  name: string;
  name_servers: string[];
};

type CloudflareDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
};

export interface CreateZoneResult {
  id: string;
  nameServers: string[];
}

export interface DnsRecordPayload {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
}

const cfClient: AxiosInstance = axios.create({
  baseURL: env.cloudflareBase,
  headers: {
    Authorization: `Bearer ${env.cloudflareToken}`,
    "Content-Type": "application/json"
  },
  timeout: 10_000
});

function getCloudflareErrorMessage(error: AxiosError<CloudflareErrorResponse>): string {
  const errors = error.response?.data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return errors
        .map((e) => (e.message ? e.message : `code ${e.code ?? "unknown"}`))
        .join("; ");
  }
  return error.message;
}

function wrapCloudflareError(error: unknown): Error {
  if (axios.isAxiosError<CloudflareErrorResponse>(error)) {
    const status = error.response?.status;
    const msg = getCloudflareErrorMessage(error);
    const prefix = status ? `Cloudflare error ${status}:` : "Cloudflare error";
    return new Error(`${prefix} ${msg}`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown Cloudflare error");
}

export async function createZone(name: string): Promise<CreateZoneResult> {
  try {
    const res = await cfClient.post<CloudflareApiResponse<CloudflareZone>>("/zones", {
      name,
      account: { id: env.cloudflareAccountId },
      jump_start: false
    });

    const zone = res.data.result;

    return {
      id: zone.id,
      nameServers: zone.name_servers
    };
  } catch (e) {
    throw wrapCloudflareError(e);
  }
}

export async function getZoneByName(name: string): Promise<string | null> {
  try {
    const res = await cfClient.get<CloudflareApiResponse<CloudflareZone[]>>("/zones", {
      params: { name }
    });

    const zone = res.data.result?.[0];
    if (!zone) {
      return null;
    }

    return zone.id;
  } catch (e) {
    throw wrapCloudflareError(e);
  }
}

export async function createDnsRecord(
    zoneId: string,
    payload: DnsRecordPayload
): Promise<CloudflareDnsRecord> {
  try {
    const res = await cfClient.post<CloudflareApiResponse<CloudflareDnsRecord>>(
        `/zones/${zoneId}/dns_records`,
        payload
    );
    return res.data.result;
  } catch (e) {
    throw wrapCloudflareError(e);
  }
}

export async function updateDnsRecord(
    zoneId: string,
    recordId: string,
    payload: Partial<DnsRecordPayload>
): Promise<CloudflareDnsRecord> {
  try {
    const res = await cfClient.put<CloudflareApiResponse<CloudflareDnsRecord>>(
        `/zones/${zoneId}/dns_records/${recordId}`,
        payload
    );
    return res.data.result;
  } catch (e) {
    throw wrapCloudflareError(e);
  }
}

export async function deleteDnsRecord(zoneId: string, recordId: string): Promise<void> {
  try {
    await cfClient.delete<CloudflareApiResponse<unknown>>(
        `/zones/${zoneId}/dns_records/${recordId}`
    );
  } catch (e) {
    throw wrapCloudflareError(e);
  }
}
