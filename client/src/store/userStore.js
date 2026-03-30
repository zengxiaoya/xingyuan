import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,

      setUser: (userData) =>
        set({
          user: {
            name: userData.name || '',
            grade: userData.grade || '',
            school: userData.school || '',
            avatar: userData.avatar || '🚀'
          }
        }),

      clearUser: () => set({ user: null })
    }),
    {
      name: 'xingYuan_user',
      partialize: (state) => ({ user: state.user })
    }
  )
)
