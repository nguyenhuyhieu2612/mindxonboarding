import { Request } from "express";

/**
 * User information from OpenID Provider
 */
export interface UserInfo {
  sub: string; // Subject - unique user identifier
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  [key: string]: any; // Additional claims from provider
}

/**
 * JWT Payload
 */
export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  name?: string;
  iat: number; // Issued at
  exp: number; // Expiration
}

/**
 * Extended Express Request with user information
 */
export interface AuthRequest extends Request {
  user?: UserInfo;
  token?: string;
}

/**
 * OpenID Token Response
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token: string;
  scope?: string;
}

/**
 * Auth Session Data
 */
export interface AuthSession {
  userId: string;
  email?: string;
  name?: string;
  token: string;
  expiresAt: number;
}
