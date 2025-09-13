import type { Chat, ChatMessage } from '@app/shared';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  error: string | null;
  loaded: boolean;
}

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  isLoading: false,
  error: null,
  loaded: false,
};

// Async thunks
export const loadChats = createAsyncThunk('chat/loadChats', async (projectPath: string) => {
  const result = await window.api?.chat.getList({ projectPath });
  return result?.chats ?? [];
});

export const createChat = createAsyncThunk(
  'chat/createChat',
  async (params: { projectPath: string; name?: string }) => {
    const result = await window.api?.chat.create(params);
    return result?.chat;
  },
);

export const updateChatName = createAsyncThunk(
  'chat/updateChatName',
  async (params: { chatId: string; name: string }) => {
    await window.api?.chat.updateName(params);
    return params;
  },
);

export const deleteChat = createAsyncThunk('chat/deleteChat', async (chatId: string) => {
  await window.api?.chat.delete({ chatId });
  return chatId;
});

export const addMessageToChat = createAsyncThunk(
  'chat/addMessage',
  async (params: { chatId: string; content: string; sender: 'user' | 'ai' }) => {
    const result = await window.api?.chat.addMessage(params);
    return { chatId: params.chatId, message: result?.message };
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
    },
    clearChats: (state) => {
      state.chats = [];
      state.currentChatId = null;
      state.loaded = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Local message addition for optimistic updates
    addMessageLocal: (state, action: PayloadAction<{ chatId: string; message: ChatMessage }>) => {
      const chat = state.chats.find((c) => c.id === action.payload.chatId);
      if (chat) {
        chat.messages.push(action.payload.message);
        chat.updatedAt = Date.now();
      }
    },
  },
  extraReducers: (builder) => {
    // Load chats
    builder
      .addCase(loadChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload;
        state.loaded = true;
        // Set first chat as current if none is selected
        if (!state.currentChatId && action.payload.length > 0) {
          state.currentChatId = action.payload[0].id;
        }
      })
      .addCase(loadChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Ошибка загрузки чатов';
      });

    // Create chat
    builder
      .addCase(createChat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.chats.unshift(action.payload);
          state.currentChatId = action.payload.id;
        }
      })
      .addCase(createChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Ошибка создания чата';
      });

    // Update chat name
    builder
      .addCase(updateChatName.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c.id === action.payload.chatId);
        if (chat) {
          chat.name = action.payload.name;
          chat.updatedAt = Date.now();
        }
      })
      .addCase(updateChatName.rejected, (state, action) => {
        state.error = action.error.message ?? 'Ошибка обновления названия чата';
      });

    // Delete chat
    builder
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter((c) => c.id !== action.payload);
        // If deleted chat was current, select first available
        if (state.currentChatId === action.payload) {
          state.currentChatId = state.chats.length > 0 ? state.chats[0].id : null;
        }
      })
      .addCase(deleteChat.rejected, (state, action) => {
        state.error = action.error.message ?? 'Ошибка удаления чата';
      });

    // Add message
    builder
      .addCase(addMessageToChat.fulfilled, (state, action) => {
        if (action.payload.message) {
          const chat = state.chats.find((c) => c.id === action.payload.chatId);
          if (chat) {
            // Check if message is already added (to avoid duplicates from optimistic updates)
            const messageExists = chat.messages.some((m) => m.id === action.payload.message!.id);
            if (!messageExists) {
              chat.messages.push(action.payload.message);
            }
            chat.updatedAt = Date.now();
          }
        }
      })
      .addCase(addMessageToChat.rejected, (state, action) => {
        state.error = action.error.message ?? 'Ошибка добавления сообщения';
      });
  },
});

export const { setCurrentChat, clearChats, clearError, addMessageLocal } = chatSlice.actions;
export default chatSlice.reducer;

// Selectors
export const selectChats = (state: { chat: ChatState }) => state.chat.chats;
export const selectCurrentChatId = (state: { chat: ChatState }) => state.chat.currentChatId;
export const selectCurrentChat = (state: { chat: ChatState }) =>
  state.chat.chats.find((chat) => chat.id === state.chat.currentChatId) ?? null;
export const selectChatLoading = (state: { chat: ChatState }) => state.chat.isLoading;
export const selectChatError = (state: { chat: ChatState }) => state.chat.error;
export const selectChatLoaded = (state: { chat: ChatState }) => state.chat.loaded;
