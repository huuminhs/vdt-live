import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

// JWT payload interface based on your specification
interface JWTPayload {
  sub: string; // username
  exp: number; // expiration timestamp (Unix timestamp)
  iat: number; // issued at timestamp (Unix timestamp)
  roles: string[]; // roles array (empty for this app)
}

// Auth store state interface
interface AuthState {
  // JWT and auth data
  token: string | null;
  tokenType: string;
  username: string | null;
  tokenExp: number | null;
  tokenIat: number | null;
  
  // Auth status
  isAuthenticated: boolean;
  isLoading: boolean;
  isTokenExpired: boolean;

  // Actions
  setAuth: (token: string, tokenType?: string) => void;
  logout: () => void;
  checkTokenExpiry: () => boolean;
  refreshAuthState: () => void;
  setLoading: (loading: boolean) => void;
  getAuthHeader: () => string | null;
}

// Helper function to decode JWT and extract user info
const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded: JWTPayload = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

// Helper function to check if token is expired
const isTokenExpired = (exp: number): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= exp;
};

// Helper function to get time until expiry in minutes
const getTimeUntilExpiry = (exp: number): number => {
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, Math.floor((exp - currentTime) / 60));
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      tokenType: 'Bearer',
      username: null,
      tokenExp: null,
      tokenIat: null,
      isAuthenticated: false,
      isLoading: false,
      isTokenExpired: false,

      // Set authentication data after successful login
      setAuth: (token: string, tokenType: string = 'Bearer') => {
        const decoded = decodeToken(token);
        
        if (decoded) {
          const expired = isTokenExpired(decoded.exp);
          
          set({
            token,
            tokenType,
            username: decoded.sub,
            tokenExp: decoded.exp,
            tokenIat: decoded.iat,
            isAuthenticated: !expired,
            isTokenExpired: expired,
            isLoading: false,
          });

          if (expired) {
            console.warn('Token is already expired');
            get().logout();
          }
        } else {
          console.error('Invalid token provided');
          get().logout();
        }
      },

      // Clear all auth data
      logout: () => {
        set({
          token: null,
          tokenType: 'Bearer',
          username: null,
          tokenExp: null,
          tokenIat: null,
          isAuthenticated: false,
          isTokenExpired: false,
          isLoading: false,
        });
      },

      // Check if current token is expired and update state
      checkTokenExpiry: (): boolean => {
        const { tokenExp } = get();
        
        if (!tokenExp) {
          get().logout();
          return true;
        }
        
        const expired = isTokenExpired(tokenExp);
        
        if (expired) {
          set({ isTokenExpired: true, isAuthenticated: false });
          get().logout();
        } else {
          set({ isTokenExpired: false });
        }
        
        return expired;
      },

      // Refresh auth state (useful for app initialization)
      refreshAuthState: () => {
        const { token, tokenExp } = get();
        
        if (token && tokenExp) {
          const expired = isTokenExpired(tokenExp);
          
          set({
            isAuthenticated: !expired,
            isTokenExpired: expired,
          });
          
          if (expired) {
            get().logout();
          }
        } else {
          get().logout();
        }
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Get authorization header for API requests
      getAuthHeader: (): string | null => {
        const { token, tokenType, isAuthenticated } = get();
        
        if (!isAuthenticated || !token) {
          return null;
        }
        
        // Check expiry before returning header
        if (get().checkTokenExpiry()) {
          return null;
        }
        
        return `${tokenType} ${token}`;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        token: state.token,
        tokenType: state.tokenType,
        username: state.username,
        tokenExp: state.tokenExp,
        tokenIat: state.tokenIat,
      }), // Only persist these fields
      onRehydrateStorage: () => (state) => {
        // Auto-check token expiry when rehydrating from storage
        if (state) {
          state.refreshAuthState();
        }
      },
    }
  )
);

// Selectors for easy access to specific parts of the state
export const useAuth = () => {
  const { 
    token, 
    tokenType, 
    username, 
    tokenExp, 
    tokenIat, 
    isAuthenticated, 
    isLoading, 
    isTokenExpired 
  } = useAuthStore();
  
  return { 
    token, 
    tokenType, 
    username, 
    tokenExp, 
    tokenIat, 
    isAuthenticated, 
    isLoading, 
    isTokenExpired 
  };
};

export const useAuthActions = () => {
  const { 
    setAuth, 
    logout, 
    checkTokenExpiry, 
    refreshAuthState, 
    setLoading, 
    getAuthHeader 
  } = useAuthStore();
  
  return { 
    setAuth, 
    logout, 
    checkTokenExpiry, 
    refreshAuthState, 
    setLoading, 
    getAuthHeader 
  };
};

// Helper hooks for specific data
export const useUsername = () => {
  const { username } = useAuth();
  return username;
};

export const useAuthHeader = () => {
  const { getAuthHeader } = useAuthActions();
  return getAuthHeader();
};

export const useTokenInfo = () => {
  const { tokenExp, tokenIat } = useAuth();
  
  const expiryDate = tokenExp ? new Date(tokenExp * 1000) : null;
  const issuedDate = tokenIat ? new Date(tokenIat * 1000) : null;
  const minutesUntilExpiry = tokenExp ? getTimeUntilExpiry(tokenExp) : 0;
  
  return {
    expiryDate,
    issuedDate,
    minutesUntilExpiry,
    isExpiringSoon: minutesUntilExpiry <= 5 && minutesUntilExpiry > 0,
  };
};

// Auto-refresh auth state on app load
if (typeof window !== 'undefined') {
  useAuthStore.getState().refreshAuthState();
}

export default useAuthStore;
