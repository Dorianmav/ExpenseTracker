import { API_BASE_URL } from './apiConfig';

let accessToken: string | null = null;

type LoginResponse = {
  accessToken: string;
};

export const authService = {
  login: async (username: string, password: string): Promise<void> => {
    let response: Response;

    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error(`API injoignable à l'adresse ${API_BASE_URL}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || 'Identifiants invalides');
    }

    const data = (await response.json()) as LoginResponse;
    accessToken = data.accessToken;
  },

  logout: () => {
    accessToken = null;
  },

  getAccessToken: () => accessToken,

  isAuthenticated: () => Boolean(accessToken),
};
