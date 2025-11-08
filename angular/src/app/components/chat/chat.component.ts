import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, ChatRoom } from '../../models/chat-message.interface';
import { Subscription } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  currentMessage = '';
  currentUser: User | null = null;
  rooms: ChatRoom[] = [];
  currentRoomId = 'general';
  isLoading = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Subscribe to messages
    this.subscriptions.push(
      this.chatService.messages$.subscribe(messages => {
        this.messages = messages;
        this.scrollToBottom();
      })
    );

    // Subscribe to rooms
    this.subscriptions.push(
      this.chatService.getRooms().subscribe(rooms => {
        this.rooms = rooms;
      })
    );

    // Start listening to messages
    this.chatService.listenToMessages();
    this.currentRoomId = this.chatService.getCurrentRoomId();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.stopListening();
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || !this.currentUser) {
      return;
    }

    this.isLoading = true;
    this.chatService.sendMessage(this.currentMessage)
      .then(() => {
        this.currentMessage = '';
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error sending message:', error);
        this.isLoading = false;
      });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  switchRoom(roomId: string): void {
    this.currentRoomId = roomId;
    this.chatService.switchRoom(roomId);
  }

  isCurrentUser(message: ChatMessage): boolean {
    return this.currentUser?.uid === message.userId;
  }

  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  createNewRoom(): void {
    const roomName = prompt('Enter room name:');
    if (roomName?.trim()) {
      this.chatService.createRoom(roomName.trim())
        .then(roomId => {
          console.log('Room created:', roomId);
          this.switchRoom(roomId);
        })
        .catch(error => {
          console.error('Error creating room:', error);
        });
    }
  }
}