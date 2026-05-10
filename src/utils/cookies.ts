import Cookies from 'js-cookie';

type CookieOptions = {
  expires?: number | Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
};

const DEFAULT_OPTIONS: CookieOptions = {
  path: '/',
  secure: false, // Changed to false to work in development HTTP
  sameSite: 'lax',
};

const TOKEN_KEY = 'adminToken';
const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUser';

export const getToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

export const setToken = (token: string, expiresIn?: number): void => {
  const options: CookieOptions = {
    ...DEFAULT_OPTIONS,
  };

  if (expiresIn) {
    options.expires = expiresIn / (24 * 60 * 60);
  } else {
    options.expires = 7;
  }

  Cookies.set(TOKEN_KEY, token, options);
};


export const removeToken = (): void => {
  Cookies.remove(TOKEN_KEY, {
    path: DEFAULT_OPTIONS.path,
    domain: DEFAULT_OPTIONS.domain,
  });
};

export const hasToken = (): boolean => {
  return !!getToken();
};

// Admin-specific cookie functions
export const getAdminToken = (): string | undefined => {
  return Cookies.get(ADMIN_TOKEN_KEY);
};

export const setAdminToken = (token: string, expiresIn?: number): void => {
  const options: CookieOptions = {
    ...DEFAULT_OPTIONS,
  };

  if (expiresIn) {
    options.expires = expiresIn / (24 * 60 * 60);
  } else {
    options.expires = 7;
  }

  Cookies.set(ADMIN_TOKEN_KEY, token, options);
 };

export const removeAdminToken = (): void => {
  Cookies.remove(ADMIN_TOKEN_KEY, {
    path: DEFAULT_OPTIONS.path,
    domain: DEFAULT_OPTIONS.domain,
  });
};

export const hasAdminToken = (): boolean => {
  return !!getAdminToken();
};

export const getAdminUser = (): string | undefined => {
  return Cookies.get(ADMIN_USER_KEY);
};

export const setAdminUser = (userData: string, expiresIn?: number): void => {
  const options: CookieOptions = {
    ...DEFAULT_OPTIONS,
  };

  if (expiresIn) {
    options.expires = expiresIn / (24 * 60 * 60);
  } else {
    options.expires = 7;
  }

  
  Cookies.set(ADMIN_USER_KEY, userData, options);
 };

export const removeAdminUser = (): void => {
  Cookies.remove(ADMIN_USER_KEY, {
    path: DEFAULT_OPTIONS.path,
    domain: DEFAULT_OPTIONS.domain,
  });
};