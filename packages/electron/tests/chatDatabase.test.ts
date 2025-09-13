import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { Chat, ChatMessage } from '@app/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatDatabase } from '../src/chatDatabase';

// Mock electron app.getPath since we're not in electron environment
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
  },
}));

describe('ChatDatabase', () => {
  let chatDb: ChatDatabase;
  let testDbPath: string;
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-db-test-'));
    testDbPath = path.join(tempDir, 'test-chats.db');

    chatDb = new ChatDatabase();
    await chatDb.initialize(testDbPath);
  });

  afterEach(async () => {
    // Clean up
    chatDb.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should initialize database with correct tables', async () => {
      const db = chatDb['db']!;

      // Check if tables exist by trying to select from them
      expect(() => db.prepare('SELECT * FROM chats').all()).not.toThrow();
      expect(() => db.prepare('SELECT * FROM chat_messages').all()).not.toThrow();
    });

    it('should handle multiple initializations gracefully', async () => {
      // Initialize again with the same path
      await chatDb.initialize(testDbPath);

      // Should not throw and database should still work
      expect(() => chatDb['db']!.prepare('SELECT * FROM chats').all()).not.toThrow();
    });
  });

  describe('chat creation', () => {
    it('should create a chat without greeting message', async () => {
      const projectPath = '/test/project';
      const chatName = 'Test Chat';

      const chat = await chatDb.createChat(projectPath, chatName, false);

      expect(chat).toBeDefined();
      expect(chat.id).toBe('1');
      expect(chat.name).toBe(chatName);
      expect(chat.projectPath).toBe(projectPath);
      expect(chat.messages).toEqual([]);
      expect(chat.createdAt).toBeGreaterThan(0);
      expect(chat.updatedAt).toBeGreaterThan(0);
    });

    it('should create a chat with default greeting message', async () => {
      const projectPath = '/test/project';
      const chatName = 'Test Chat';

      const chat = await chatDb.createChat(projectPath, chatName, true);

      expect(chat).toBeDefined();
      expect(chat.messages).toHaveLength(1);
      expect(chat.messages[0].content).toBe('Привет! Чем могу помочь?');
      expect(chat.messages[0].sender).toBe('ai');
      expect(chat.messages[0].timestamp).toBeGreaterThan(0);
    });

    it('should create a chat with auto-generated name when not provided', async () => {
      const projectPath = '/test/project';

      const chat = await chatDb.createChat(projectPath);

      expect(chat).toBeDefined();
      expect(chat.name).toMatch(/^Новый чат \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/u);
    });

    it('should handle multiple chats for the same project', async () => {
      const projectPath = '/test/project';

      const chat1 = await chatDb.createChat(projectPath, 'Chat 1');
      const chat2 = await chatDb.createChat(projectPath, 'Chat 2');

      expect(chat1.id).not.toBe(chat2.id);
      expect(chat1.projectPath).toBe(chat2.projectPath);
    });
  });

  describe('chat retrieval', () => {
    let testChat: Chat;

    beforeEach(async () => {
      testChat = await chatDb.createChat('/test/project', 'Test Chat', false);
    });

    it('should get chat by id', async () => {
      const retrieved = await chatDb.getChat(testChat.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(testChat.id);
      expect(retrieved!.name).toBe(testChat.name);
      expect(retrieved!.projectPath).toBe(testChat.projectPath);
    });

    it('should return null for non-existent chat', async () => {
      const retrieved = await chatDb.getChat('999');

      expect(retrieved).toBeNull();
    });

    it('should get chats by project path', async () => {
      const projectPath = '/test/project';
      await chatDb.createChat(projectPath, 'Chat 2', false);
      await chatDb.createChat('/other/project', 'Other Chat', false);

      const chats = await chatDb.getChatsByProject(projectPath);

      expect(chats).toHaveLength(2);
      expect(chats.every((chat) => chat.projectPath === projectPath)).toBe(true);
    });

    it('should return empty array for project with no chats', async () => {
      const chats = await chatDb.getChatsByProject('/nonexistent/project');

      expect(chats).toEqual([]);
    });
  });

  describe('chat updates', () => {
    let testChat: Chat;

    beforeEach(async () => {
      testChat = await chatDb.createChat('/test/project', 'Original Name', false);
    });

    it('should update chat name', async () => {
      const newName = 'Updated Name';
      const originalUpdatedAt = testChat.updatedAt;

      // Add a small delay to ensure updatedAt changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const success = await chatDb.updateChatName(testChat.id, newName);

      expect(success).toBe(true);

      const updated = await chatDb.getChat(testChat.id);
      expect(updated!.name).toBe(newName);
      expect(updated!.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });

    it('should return false when updating non-existent chat', async () => {
      const success = await chatDb.updateChatName('999', 'New Name');

      expect(success).toBe(false);
    });
  });

  describe('chat deletion', () => {
    let testChat: Chat;

    beforeEach(async () => {
      testChat = await chatDb.createChat('/test/project', 'Test Chat', true);
      await chatDb.addMessage(testChat.id, 'Hello', 'user');
    });

    it('should delete chat and its messages', async () => {
      const success = await chatDb.deleteChat(testChat.id);

      expect(success).toBe(true);

      const deleted = await chatDb.getChat(testChat.id);
      expect(deleted).toBeNull();

      const messages = await chatDb.getMessages(testChat.id);
      expect(messages).toEqual([]);
    });

    it('should return false when deleting non-existent chat', async () => {
      const success = await chatDb.deleteChat('999');

      expect(success).toBe(false);
    });
  });

  describe('message operations', () => {
    let testChat: Chat;

    beforeEach(async () => {
      testChat = await chatDb.createChat('/test/project', 'Test Chat', false);
    });

    it('should add a message to chat', async () => {
      const content = 'Hello, world!';
      const sender = 'user';

      const message = await chatDb.addMessage(testChat.id, content, sender);

      expect(message).toBeDefined();
      expect(message.content).toBe(content);
      expect(message.sender).toBe(sender);
      expect(message.timestamp).toBeGreaterThan(0);
      expect(typeof message.id).toBe('number');
    });

    it('should get messages for a chat', async () => {
      await chatDb.addMessage(testChat.id, 'Message 1', 'user');
      await chatDb.addMessage(testChat.id, 'Message 2', 'ai');

      const messages = await chatDb.getMessages(testChat.id);

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Message 1');
      expect(messages[1].content).toBe('Message 2');
    });

    it('should return empty array for chat with no messages', async () => {
      const messages = await chatDb.getMessages(testChat.id);

      expect(messages).toEqual([]);
    });

    it('should return empty array for non-existent chat messages', async () => {
      const messages = await chatDb.getMessages('999');

      expect(messages).toEqual([]);
    });

    it('should handle concurrent message additions', async () => {
      const promises: Promise<ChatMessage>[] = [];
      for (let i = 0; i < 10; i++) {
        promises.push(chatDb.addMessage(testChat.id, `Message ${i}`, 'user'));
      }

      const messages = await Promise.all(promises);

      expect(messages).toHaveLength(10);
      expect(new Set(messages.map((m) => m.id)).size).toBe(10); // All IDs should be unique
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Close the database to simulate an error
      chatDb.close();

      // Try to use database after close - should throw errors
      try {
        await chatDb.createChat('/test', 'Test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }

      try {
        await chatDb.getChat('1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }

      try {
        await chatDb.getChatsByProject('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid input gracefully', async () => {
      // Test with empty/null values
      const chat1 = await chatDb.createChat('', '');
      expect(chat1.projectPath).toBe('');
      expect(chat1.name).toBe('');

      const message = await chatDb.addMessage(chat1.id, '', 'user');
      expect(message.content).toBe('');
    });
  });

  describe('database persistence', () => {
    it('should persist data across database instances', async () => {
      const projectPath = '/test/project';
      const chatName = 'Persistent Chat';

      // Create a chat
      const chat = await chatDb.createChat(projectPath, chatName, true);
      await chatDb.addMessage(chat.id, 'Test message', 'user');

      // Close the database
      chatDb.close();

      // Create a new instance and initialize with the same path
      const newChatDb = new ChatDatabase();
      await newChatDb.initialize(testDbPath);

      try {
        // Retrieve the chat
        const retrieved = await newChatDb.getChat(chat.id);
        expect(retrieved).toBeDefined();
        expect(retrieved!.name).toBe(chatName);

        const messages = await newChatDb.getMessages(chat.id);
        expect(messages).toHaveLength(2); // greeting + test message
      } finally {
        newChatDb.close();
      }
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent chat creation', async () => {
      const projectPath = '/test/project';
      const promises: Promise<Chat>[] = [];

      for (let i = 0; i < 5; i++) {
        promises.push(chatDb.createChat(projectPath, `Chat ${i}`, false));
      }

      const chats = await Promise.all(promises);

      expect(chats).toHaveLength(5);
      expect(new Set(chats.map((c) => c.id)).size).toBe(5); // All IDs should be unique
    });

    it('should handle concurrent operations on the same chat', async () => {
      const chat = await chatDb.createChat('/test', 'Test Chat', false);

      const promises = [
        chatDb.addMessage(chat.id, 'Message 1', 'user'),
        chatDb.addMessage(chat.id, 'Message 2', 'ai'),
        chatDb.updateChatName(chat.id, 'Updated Name'),
        chatDb.getMessages(chat.id),
      ];

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
