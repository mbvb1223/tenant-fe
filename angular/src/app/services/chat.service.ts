import { Injectable } from '@angular/core';
import { Database, ref, push, onValue, off, serverTimestamp, query, orderByChild, limitToLast } from '@angular/fire/database';
import { AuthService } from './auth.service';
import { ChatMessage, ChatRoom } from '../models/chat-message.interface';
import { Observable, BehaviorSubject } from 'rxjs';
import { User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private currentUser: User | null = null;
  private currentRoomId = 'general';

  constructor(
    private database: Database,
    private authService: AuthService
  ) {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  // Send a message to the current room
  sendMessage(messageText: string): Promise<void> {
    if (!this.currentUser) {
      return Promise.reject('User not authenticated');
    }

    const message: Omit<ChatMessage, 'id'> = {
      text: messageText,
      userId: this.currentUser.uid,
      userEmail: this.currentUser.email || 'Unknown',
      userName: this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'Anonymous',
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    const messagesRef = ref(this.database, `rooms/${this.currentRoomId}/messages`);
    return push(messagesRef, message).then(() => {
      console.log('Message sent successfully');
    });
  }

  // Listen to messages in the current room
  listenToMessages(): void {
    const messagesRef = ref(this.database, `rooms/${this.currentRoomId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(50));

    onValue(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val() as ChatMessage;
        message.id = childSnapshot.key || undefined;
        messages.push(message);
      });

      // Sort by timestamp to ensure proper order
      messages.sort((a, b) => a.timestamp - b.timestamp);
      this.messagesSubject.next(messages);
    });
  }

  // Stop listening to messages
  stopListening(): void {
    const messagesRef = ref(this.database, `rooms/${this.currentRoomId}/messages`);
    off(messagesRef);
  }

  // Switch to a different room
  switchRoom(roomId: string): void {
    this.stopListening();
    this.currentRoomId = roomId;
    this.messagesSubject.next([]); // Clear current messages
    this.listenToMessages();
  }

  // Get current room ID
  getCurrentRoomId(): string {
    return this.currentRoomId;
  }

  // Create a new chat room
  createRoom(roomName: string, description?: string): Promise<string> {
    if (!this.currentUser) {
      return Promise.reject('User not authenticated');
    }

    const room: Omit<ChatRoom, 'id'> = {
      name: roomName,
      description: description || '',
      createdBy: this.currentUser.uid,
      createdAt: new Date().toISOString(),
      participantCount: 1
    };

    const roomsRef = ref(this.database, 'rooms');
    return push(roomsRef, room).then((result) => {
      return result.key!;
    });
  }

  // Get list of available rooms
  getRooms(): Observable<ChatRoom[]> {
    return new Observable(observer => {
      const roomsRef = ref(this.database, 'rooms');
      onValue(roomsRef, (snapshot) => {
        const rooms: ChatRoom[] = [];
        snapshot.forEach((childSnapshot) => {
          const room = childSnapshot.val() as ChatRoom;
          room.id = childSnapshot.key || undefined;
          rooms.push(room);
        });
        observer.next(rooms);
      });
    });
  }
}
