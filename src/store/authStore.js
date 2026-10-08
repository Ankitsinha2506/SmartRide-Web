import { create } from 'zustand'
const readUser = () => { try { return JSON.parse(localStorage.getItem('smartride-user')) } catch { return null } }
export const useAuthStore = create((set) => ({ token: localStorage.getItem('smartride-token'), user: readUser(), setSession: ({ token, user }) => { localStorage.setItem('smartride-token', token); localStorage.setItem('smartride-user', JSON.stringify(user)); set({ token, user }) }, logout: () => { localStorage.removeItem('smartride-token'); localStorage.removeItem('smartride-user'); set({ token: null, user: null }) } }))
