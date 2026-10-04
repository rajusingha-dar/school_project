import { createContext } from 'react';

/** Holds { user, status, login, register, logout }. Provided by AuthProvider. */
export const AuthContext = createContext(null);
