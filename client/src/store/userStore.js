import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,

      setUser: (userData) => {
        const user = {
          name: userData.name || '',
          grade: userData.grade || '',
          school: userData.school || '',
          avatar: userData.avatar || '🚀',
        }
        set({ user })
        fetch('/api/sync/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        }).catch(() => {})
      },

      clearUser: () => set({ user: null })
    }),
    {
      name: 'xingYuan_user',
      partialize: (state) => ({ user: state.user })
    }
  )
)
