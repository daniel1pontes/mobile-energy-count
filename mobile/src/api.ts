const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; token?: string };

export type User = {
  id: string;
  name: string;
  email: string;
};

export type SessionResponse = {
  user: User;
  token: string;
};

export type Dashboard = {
  residence: {
    id: string;
    name: string;
    energy_rate: string;
    goal_kwh: string | null;
    goal_amount: string | null;
  } | null;
  currentBill: {
    reference_month: number;
    reference_year: number;
    consumption_kwh: string;
    total_amount: string;
  } | null;
  previousBill: {
    consumption_kwh: string;
  } | null;
  history: Array<{
    reference_month: number;
    reference_year: number;
    consumption_kwh: string;
    total_amount: string;
  }>;
  applianceEstimateKwh: number;
  topAppliance: { name: string; estimated_kwh: string; estimated_amount: string; one_hour_savings: string } | null;
  tips: string[];
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message ?? 'Não foi possível concluir esta ação.');
  }

  return body as T;
}

export function getApiUrl() {
  return apiUrl;
}
