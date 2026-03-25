/**
 * Ssemble API Client
 * Wraps all 9 Ssemble AI Clipping API endpoints with native fetch.
 */

const DEFAULT_BASE_URL = 'https://aiclipping.ssemble.com/api/v1';

export class SsembleApiError extends Error {
  constructor(status, error, rateLimits) {
    super(error?.message || `API error (${status})`);
    this.name = 'SsembleApiError';
    this.status = status;
    this.code = error?.code || 'unknown_error';
    this.details = error?.details || null;
    this.rateLimits = rateLimits;
  }
}

export class SsembleClient {
  constructor(apiKey, baseUrl, options = {}) {
    if (!options.lazy) {
      if (!apiKey) {
        throw new Error('SSEMBLE_API_KEY is required');
      }
      if (!apiKey.startsWith('sk_ssemble_')) {
        throw new Error('Invalid API key format. Must start with sk_ssemble_');
      }
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
  }

  async _request(method, path, { body, query } = {}) {
    if (!this.apiKey) {
      throw new SsembleApiError(401, {
        code: 'missing_api_key',
        message: 'Ssemble API key required. Pass via X-Ssemble-API-Key header when using the remote endpoint, or set SSEMBLE_API_KEY env var for local usage. Get your key at https://app.ssemble.com → Settings → API Keys.',
      });
    }
    if (!this.apiKey.startsWith('sk_ssemble_')) {
      throw new SsembleApiError(401, {
        code: 'invalid_api_key',
        message: 'Invalid API key format. Must start with sk_ssemble_',
      });
    }

    let url = `${this.baseUrl}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    const rateLimits = {
      hourlyLimit: response.headers.get('x-ratelimit-limit-hour'),
      hourlyRemaining: response.headers.get('x-ratelimit-remaining-hour'),
      dailyLimit: response.headers.get('x-ratelimit-limit-day'),
      dailyRemaining: response.headers.get('x-ratelimit-remaining-day'),
      reset: response.headers.get('x-ratelimit-reset'),
    };

    if (method === 'DELETE' && response.status === 204) {
      return { data: { message: 'Request successfully deleted' }, rateLimits };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new SsembleApiError(response.status, data.error, rateLimits);
    }

    return { ...data, rateLimits };
  }

  // Endpoint 1: GET /templates
  async listTemplates() {
    return this._request('GET', '/templates');
  }

  // Endpoint 2: POST /shorts/create
  async createShort(params) {
    return this._request('POST', '/shorts/create', { body: params });
  }

  // Endpoint 3: GET /shorts/:id/status
  async getStatus(requestId) {
    return this._request('GET', `/shorts/${requestId}/status`);
  }

  // Endpoint 4: GET /shorts/:id
  async getShorts(requestId) {
    return this._request('GET', `/shorts/${requestId}`);
  }

  // Endpoint 5: GET /shorts
  async listRequests(query) {
    return this._request('GET', '/shorts', { query });
  }

  // Endpoint 6: DELETE /shorts/:id
  async deleteRequest(requestId) {
    return this._request('DELETE', `/shorts/${requestId}`);
  }

  // Endpoint 7: GET /music
  async listMusic(query) {
    return this._request('GET', '/music', { query });
  }

  // Endpoint 8: GET /game-videos
  async listGameVideos(query) {
    return this._request('GET', '/game-videos', { query });
  }

  // Endpoint 9: GET /meme-hooks
  async listMemeHooks(query) {
    return this._request('GET', '/meme-hooks', { query });
  }
}
