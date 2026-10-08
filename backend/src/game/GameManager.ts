import { Server } from 'socket.io';
import { GameRoom } from './GameRoom.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class GameManager {
  private io: Server;
  private rooms: Map<string, GameRoom> = new Map();
  private socketToPlayerRoom: Map<string, { code: string; playerId: string }> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  public generateRoomCode(): string {
    let code = '';
    let attempts = 0;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
      }
      attempts++;
    } while (this.rooms.has(code) && attempts < 100);
    return code;
  }

  public createRoom(hostId: string, hostName: string, socketId: string): GameRoom {
    const code = this.generateRoomCode();
    const room = new GameRoom(code, hostId, this.io);
    room.addPlayer(hostId, hostName, socketId);
    this.rooms.set(code, room);
    this.socketToPlayerRoom.set(socketId, { code, playerId: hostId });
    return room;
  }

  public joinRoom(
    code: string,
    playerId: string,
    playerName: string,
    socketId: string
  ): { success: boolean; error?: string; room?: GameRoom } {
    const cleanCode = code.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);
    if (!room) {
      return { success: false, error: 'Room not found! Check code and try again.' };
    }

    if (room.phase !== 'LOBBY') {
      // Check if this is an existing player reconnecting
      if (room.players.has(playerId)) {
        room.reconnectPlayer(playerId, socketId);
        this.socketToPlayerRoom.set(socketId, { code: cleanCode, playerId });
        return { success: true, room };
      }
      return { success: false, error: 'Game is already in progress!' };
    }

    if (room.players.size >= 8) {
      return { success: false, error: 'Room is already full (max 8 players).' };
    }

    // Name collision check
    const existingNames = Array.from(room.players.values()).map((p) => p.name.toLowerCase());
    let finalName = playerName;
    if (existingNames.includes(playerName.toLowerCase())) {
      finalName = `${playerName} (${room.players.size + 1})`;
    }

    room.addPlayer(playerId, finalName, socketId);
    this.socketToPlayerRoom.set(socketId, { code: cleanCode, playerId });
    return { success: true, room };
  }

  public handleDisconnect(socketId: string): void {
    const mapping = this.socketToPlayerRoom.get(socketId);
    if (!mapping) return;

    const { code, playerId } = mapping;
    const room = this.rooms.get(code);
    if (room) {
      room.removePlayer(playerId);
      // If room is completely empty, clean it up after a grace period
      const activeHumanPlayers = Array.from(room.players.values()).filter(
        (p) => !p.isBot && p.isConnected
      );
      if (activeHumanPlayers.length === 0) {
        setTimeout(() => {
          const stillActive = Array.from(room.players.values()).some(
            (p) => !p.isBot && p.isConnected
          );
          if (!stillActive) {
            room.destroy();
            this.rooms.delete(code);
          }
        }, 15000);
      }
    }
    this.socketToPlayerRoom.delete(socketId);
  }

  public getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  public getRoomBySocket(socketId: string): { room: GameRoom; playerId: string } | null {
    const mapping = this.socketToPlayerRoom.get(socketId);
    if (!mapping) return null;
    const room = this.rooms.get(mapping.code);
    if (!room) return null;
    return { room, playerId: mapping.playerId };
  }
}
