const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

/**
 * Ensures that there is an active authenticated session.
 * If no token is found, it attempts to log in or register a default developer user.
 */
export async function ensureAuthToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

/**
 * Authenticated API request helper.
 */
async function authenticatedRequest(path: string, options: RequestInit = {}) {
  const token = await ensureAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  workspaceName: string;
  defaultDomain: string;
  timezone: string;
  mfaPolicy: string;
  sessionLifetime: string;
  ipAllowList: string;
  emailAlerts: boolean;
  slackIntegration: boolean;
  weeklyDigest: boolean;
  theme: string;
  density: string;
  reducedMotion: boolean;
  plan: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  isVerified?: boolean;
  preferences: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface UrlItem {
  _id: string;
  originalUrl: string;
  shortCode: string;
  expiresAt: string | null;
  clickCount: number;
  clickLimit: number | null;
  isFavorite: boolean;
  isPublicStats: boolean;
  isArchived?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignItem {
  _id: string;
  name: string;
  channel: string;
  clicks: number;
  conv: number;
  status: 'running' | 'scheduled' | 'ended';
  createdAt: string;
}

export interface ApiKeyItem {
  _id: string;
  name: string;
  environment: string;
  createdAt: string;
  status: 'active' | 'revoked';
  value: string;
  lastUsedAt?: string | null;
}

export interface WebhookItem {
  _id: string;
  url: string;
  events: string[];
  status: 'healthy' | 'failing';
  createdAt: string;
}

export interface WebhookLogItem {
  _id: string;
  webhookId: string;
  url: string;
  event: string;
  payload: any;
  statusCode: number | null;
  success: boolean;
  timestamp: string;
}

export interface TeamMemberItem {
  userId: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  last: string;
}

export interface TeamInvitationItem {
  _id: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: string;
}

export interface AuditLogItem {
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ipAddress: string;
}

export interface WorkspaceAnalytics {
  metrics: {
    totalLinks: number;
    totalClicks: number;
    uniqueVisitors: number;
    activeLinks: number;
    qrDownloads: number;
    countriesReached: number;
    weeklyGrowth: number;
  };
  charts: {
    trafficData: { d: string; clicks: number; uniq: number }[];
    sourcesData: { name: string; value: number }[];
    devicesData: { name: string; value: number }[];
    browsersData: { name: string; value: number }[];
    countriesData: { name: string; code: string; visits: number }[];
    heatmapData: { day: string; hours: number[] }[];
    activity: { who: string; what: string; target: string; when: string }[];
    linksList: { id: string; slug: string; url: string; clicks: number; ctr: number; status: string; tag: string; created: string }[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// --- AUTH / PROFILE / SETTINGS ---
export async function loginUser(payload: any): Promise<{ success: boolean; token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Login failed');
  }
  return res.json();
}

export async function signupUser(payload: any): Promise<{ success: boolean; token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Signup failed');
  }
  return res.json();
}

export async function getMe(): Promise<UserProfile> {
  const data = await authenticatedRequest('/auth/me');
  return data.user;
}

export interface UpdateSettingsPayload {
  name?: string;
  email?: string;
  password?: string;
  preferences?: Partial<UserPreferences>;
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<{ success: boolean; message: string; user: UserProfile }> {
  return authenticatedRequest('/auth/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// --- LINKS ---
export async function getUrls(params: { q?: string; sort?: string; filter?: string } = {}): Promise<UrlItem[]> {
  const query = new URLSearchParams(params as any).toString();
  const data = await authenticatedRequest(`/urls?${query}`);
  return data.urls;
}

export async function createUrl(payload: {
  originalUrl: string;
  expiresAt?: string | null;
  customAlias?: string;
  password?: string | null;
  clickLimit?: number | null;
  tags?: string[];
  isPublicStats?: boolean;
}): Promise<{ success: boolean; url: UrlItem }> {
  return authenticatedRequest('/urls', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUrl(id: string, payload: Partial<UrlItem>): Promise<{ success: boolean; url: UrlItem }> {
  return authenticatedRequest(`/urls/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteUrl(id: string): Promise<{ success: boolean; message: string }> {
  return authenticatedRequest(`/urls/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleFavorite(id: string): Promise<{ success: boolean; url: UrlItem; isFavorite: boolean }> {
  return authenticatedRequest(`/urls/${id}/favorite`, {
    method: 'POST',
  });
}

export async function setPassword(id: string, password: string | null): Promise<{ success: boolean; message: string }> {
  return authenticatedRequest(`/urls/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export async function setClickLimit(id: string, clickLimit: number | null): Promise<{ success: boolean; url: UrlItem }> {
  return authenticatedRequest(`/urls/${id}/click-limit`, {
    method: 'PATCH',
    body: JSON.stringify({ clickLimit }),
  });
}

export async function bulkCreateUrls(urls: { originalUrl: string; expiresAt?: string | null; tags?: string[] }[]): Promise<{ success: boolean; results: any[] }> {
  return authenticatedRequest('/urls/bulk', {
    method: 'POST',
    body: JSON.stringify({ urls }),
  });
}

// --- CAMPAIGNS ---
export async function getCampaigns(): Promise<CampaignItem[]> {
  const data = await authenticatedRequest('/campaigns');
  return data.campaigns;
}

export async function createCampaign(payload: { name: string; channel: string; status?: string }): Promise<{ success: boolean; campaign: CampaignItem }> {
  return authenticatedRequest('/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCampaign(id: string, payload: Partial<CampaignItem>): Promise<{ success: boolean; campaign: CampaignItem }> {
  return authenticatedRequest(`/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCampaign(id: string): Promise<{ success: boolean; message: string }> {
  return authenticatedRequest(`/campaigns/${id}`, {
    method: 'DELETE',
  });
}



// --- GLOBAL WORKSPACE ANALYTICS ---
export async function getWorkspaceAnalytics(): Promise<WorkspaceAnalytics> {
  return authenticatedRequest('/analytics/workspace');
}

// --- API KEYS ---
export async function getApiKeys(): Promise<{ success: boolean; apiKeys: ApiKeyItem[] }> {
  return authenticatedRequest('/api-keys');
}

export async function createApiKey(payload: { name: string; environment: string }): Promise<{ success: boolean; apiKey: ApiKeyItem & { value: string } }> {
  return authenticatedRequest('/api-keys', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function revokeApiKey(id: string): Promise<{ success: boolean; message: string }> {
  return authenticatedRequest(`/api-keys/${id}`, {
    method: 'DELETE',
  });
}

// --- MEMBERS / TEAM ---
export async function getMembers(): Promise<{ success: boolean; members: TeamMemberItem[]; invitations: TeamInvitationItem[] }> {
  return authenticatedRequest('/members');
}

export async function inviteMember(payload: { email: string; role: string }): Promise<{ success: boolean; invitation: TeamInvitationItem }> {
  return authenticatedRequest('/members/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMemberRole(id: string, role: string): Promise<{ success: boolean; message: string }> {
  return authenticatedRequest(`/members/role/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function removeMemberOrInvitation(id: string): Promise<{ success: boolean; message: string }> {
  return authenticatedRequest(`/members/${id}`, {
    method: 'DELETE',
  });
}

// --- PASSWORDS ---
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string; resetCode?: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Forgot password request failed');
  }
  return res.json();
}

export async function resetPassword(payload: any): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Password reset failed');
  }
  return res.json();
}
