export interface OfoodApiError {
  code?: string;
  message?: string;
  traceId?: string;
}

export interface OfoodAuthTokenResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: string;
}

export interface OfoodUserDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  mobile?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  /** Singular role from /me and signup session users (CUSTOMER | ADMIN). */
  role?: string | null;
  /** Spring-style authorities (ROLE_CUSTOMER | ROLE_ADMIN). */
  roles?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OfoodRegistrationResponse {
  userId?: string;
  message?: string;
}
