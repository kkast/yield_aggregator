import jwt from 'jsonwebtoken';

interface DynamicJwtPayload {
  aud: string;
  iss: string;
  sub: string; // This is the user ID
  iat: number;
  exp: number;
}

export function extractUserIdFromToken(authHeader: string | undefined): string | null {
  console.log('authHeader', authHeader)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('token', token)
  try {
    // Decode the JWT token without verification (since we don't have the secret)
    const decoded = jwt.decode(token) as DynamicJwtPayload;
    console.log('decoded', decoded)
    
    if (decoded && decoded.sub) {
      return decoded.sub;
    }
    
    return null;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}
