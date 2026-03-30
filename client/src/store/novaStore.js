import { create } from 'zustand'

let messageIdCounter = 0

function generateId() {
  messageIdCounter += 1
  return `msg_${Date.now()}_${messageIdCounter}`
}

export const useNovaStore = create((set) => ({
  isOpen: false,
  messages: [],
  context: { type: 'general', id: null },
  isThinking: false,
  quickReplies: [],

  openNova: (context) =>
    set((state) => ({
      isOpen: true,
      context: context
        ? { type: context.type || 'general', id: context.id || null }
        : { type: 'general', id: null },
      quickReplies: context?.quickReplies || state.quickReplies
    })),

  closeNova: () =>
    set({
      isOpen: false
    }),

  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role,
          content,
          timestamp: Date.now()
        }
      ]
    })),

  setThinking: (bool) =>
    set({
      isThinking: bool
    }),

  setContext: (context) =>
    set({
      context: {
        type: context?.type || 'general',
        id: context?.id || null
      }
    }),

  setQuickReplies: (replies) =>
    set({
      quickReplies: Array.isArray(replies) ? replies : []
    }),

  clearMessages: () =>
    set({
      messages: [],
      isThinking: false,
      quickReplies: []
    })
}))
