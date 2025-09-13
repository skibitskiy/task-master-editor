import { promises as fs } from 'node:fs';

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

export interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface Chat {
  id: string;
  name: string;
  projectPath: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface StoredChat {
  id: string;
  name: string;
  project_path: string;
  created_at: number;
  updated_at: number;
}

export class ChatDatabase {
  private db: Database.Database | null = null;
  private dbPath: string | null = null;
  private idCounter = 1;

  private async getDatabasePath(): Promise<string> {
    if (this.dbPath) {
      return this.dbPath;
    }
    const userDataPath = app.getPath('userData');
    await fs.mkdir(userDataPath, { recursive: true });
    return path.join(userDataPath, 'chats.db');
  }

  public async initialize(customPath?: string): Promise<void> {
    if (this.db) {
      return;
    }

    if (customPath) {
      this.dbPath = customPath;
    }

    const dbPath = await this.getDatabasePath();
    this.db = new Database(dbPath);

    this.createTables();
  }

  private async initializeDatabase(): Promise<void> {
    await this.initialize();
  }

  private createTables(): void {
    // Create tables if they don't exist
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        project_path TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chats_project_path ON chats(project_path);

      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        content TEXT NOT NULL,
        sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
    `);
  }

  public async getChatsForProject(projectPath: string): Promise<Chat[]> {
    await this.initializeDatabase();

    const selectChats = this.db!.prepare(`
      SELECT * FROM chats
      WHERE project_path = ?
      ORDER BY updated_at DESC
    `);

    const selectMessages = this.db!.prepare(`
      SELECT * FROM chat_messages
      WHERE chat_id = ?
      ORDER BY timestamp ASC
    `);

    const chatRows = selectChats.all(projectPath) as StoredChat[];

    return chatRows.map((row) => ({
      id: row.id,
      name: row.name,
      projectPath: row.project_path,
      messages: (selectMessages.all(row.id) as unknown[]).map((msg: unknown) => ({
        id: (msg as Record<string, unknown>).id as number,
        content: (msg as Record<string, unknown>).content as string,
        sender: (msg as Record<string, unknown>).sender as 'user' | 'ai',
        timestamp: (msg as Record<string, unknown>).timestamp as number,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  public async createChat(projectPath: string, name?: string, withGreeting: boolean = true): Promise<Chat> {
    await this.initializeDatabase();

    const chatId = `${this.idCounter++}`;
    const chatName =
      name !== undefined && name !== null
        ? name
        : `Новый чат ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0].slice(0, 5)}`;
    const now = Date.now();

    const insertChat = this.db!.prepare(`
      INSERT INTO chats (id, name, project_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertChat.run(chatId, chatName, projectPath, now, now);

    const messages: ChatMessage[] = [];

    if (withGreeting) {
      const defaultGreeting = 'Привет! Чем могу помочь?';
      const insertMessage = this.db!.prepare(`
        INSERT INTO chat_messages (chat_id, content, sender, timestamp)
        VALUES (?, ?, ?, ?)
      `);

      const result = insertMessage.run(chatId, defaultGreeting, 'ai', now);

      messages.push({
        id: result.lastInsertRowid as number,
        content: defaultGreeting,
        sender: 'ai',
        timestamp: now,
      });
    }

    return {
      id: chatId,
      name: chatName,
      projectPath,
      messages,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    await this.initializeDatabase();

    const selectMessages = this.db!.prepare(`
      SELECT * FROM chat_messages
      WHERE chat_id = ?
      ORDER BY timestamp ASC
    `);

    return (selectMessages.all(chatId) as unknown[]).map((row) => ({
      id: (row as Record<string, unknown>).id as number,
      content: (row as Record<string, unknown>).content as string,
      sender: (row as Record<string, unknown>).sender as 'user' | 'ai',
      timestamp: (row as Record<string, unknown>).timestamp as number,
    }));
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  public async getChat(chatId: string): Promise<Chat | null> {
    await this.initializeDatabase();

    const selectChat = this.db!.prepare('SELECT * FROM chats WHERE id = ?');
    const chatRow = selectChat.get(chatId) as StoredChat | undefined;

    if (!chatRow) {
      return null;
    }

    const messages = await this.getMessages(chatId);

    return {
      id: chatRow.id,
      name: chatRow.name,
      projectPath: chatRow.project_path,
      messages,
      createdAt: chatRow.created_at,
      updatedAt: chatRow.updated_at,
    };
  }

  public async getChatsByProject(projectPath: string): Promise<Chat[]> {
    return this.getChatsForProject(projectPath);
  }

  public async updateChatName(chatId: string, name: string): Promise<boolean> {
    await this.initializeDatabase();

    const update = this.db!.prepare(`
      UPDATE chats
      SET name = ?, updated_at = ?
      WHERE id = ?
    `);

    const result = update.run(name, Date.now(), chatId);
    return result.changes > 0;
  }

  public async deleteChat(chatId: string): Promise<boolean> {
    await this.initializeDatabase();

    // Messages will be deleted automatically due to CASCADE
    const deleteChat = this.db!.prepare('DELETE FROM chats WHERE id = ?');
    const result = deleteChat.run(chatId);
    return result.changes > 0;
  }

  public async addMessage(chatId: string, content: string, sender: 'user' | 'ai'): Promise<ChatMessage> {
    await this.initializeDatabase();

    const timestamp = Date.now();

    // Insert message
    const insertMessage = this.db!.prepare(`
      INSERT INTO chat_messages (chat_id, content, sender, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertMessage.run(chatId, content, sender, timestamp);

    // Update chat's updated_at
    const updateChat = this.db!.prepare(`
      UPDATE chats
      SET updated_at = ?
      WHERE id = ?
    `);

    updateChat.run(timestamp, chatId);

    return {
      id: result.lastInsertRowid as number,
      content,
      sender,
      timestamp,
    };
  }

  public async getMessages(chatId: string): Promise<ChatMessage[]> {
    return this.getChatMessages(chatId);
  }
}

export const chatDatabase = new ChatDatabase();
