import {AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import * as SimpleBar from 'simplebar';
import {ChatService} from '../../_services/chat.service';
import {Subject} from 'rxjs/Subject';
import {Chat} from '../../_models/Chat';
import {Subscription} from 'rxjs/Subscription';
import {UserService} from '../../_services/user.service';
import {User} from '../../_models/User';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {

  private ngUnsubscribe: Subject<any> = new Subject();
  //chats: {username: string, messages: {id: number, date: Date, message: string}[]}[];
  //chats: {chat: Chat, messages: Message[], messageSubscription: Subscription}[];
  user: User;
  chats: Chat[];
  messageSubscriptions: Map<number, Subscription>;


  @ViewChildren('messages') messageFor: QueryList<any>;
  activatedTabIndex: number;
  messageInput: string;
  chatOpen: boolean;

  constructor(private chatService: ChatService, private userService: UserService) { }

  ngOnInit() {
    this.messageInput = '';
    this.activatedTabIndex = 0;
    this.chatOpen = false;
    this.chats = [];
    this.messageSubscriptions = new Map<number, Subscription>();

    /*
    this.chats = [
      {username: 'Lethanity', messages: [{id: 1, date: new Date(), message: 'Hola'},
                                          {id: 0, date: new Date(),  message: 'Hola'},
                                        {id: 1, date: new Date(),  message: 'Chau'}]
      },
      {username: 'Juenga13', messages: [{id: 0, date: new Date(),  message: 'Hole'},
                                        {id: 1, date: new Date(),  message: 'Hole'},
                                        {id: 0, date: new Date(),  message: 'Cheu'}]
      }
    ];
    */

    this.userService.userSubject.takeUntil(this.ngUnsubscribe).subscribe(user => this.user = user);

    /*
    this.chatService.chatsSubject.takeUntil(this.ngUnsubscribe).subscribe(
      chats => {
        for (const chat of chats) {
          let messages: Message[];
          const messageSub = chat.messagesSubject.takeUntil(this.ngUnsubscribe)
            .subscribe(msgs => messages = msgs);
          this.chats.push({chat: chat, messages: messages, messageSubscription: messageSub});
        }

      }
    );
    */

    this.chatService.chatsSubject.takeUntil(this.ngUnsubscribe).subscribe(chats => {
      for (const chat of chats) {
        if (!this.messageSubscriptions.has(chat.id)) {
          const messageSub = chat.messagesSubject.takeUntil(this.ngUnsubscribe).subscribe();
          this.messageSubscriptions.set(chat.id, messageSub);
        }
      }
      this.chats = chats;
    });
  }

  ngAfterViewInit() {
    //this.scrollToBottom();
    this.messageFor.changes.subscribe(t => {
      this.scrollToBottom();
    });
  }

  scrollToBottom() {
    const el = new SimpleBar(document.getElementById('scrollbar'));
    el.getScrollElement().scrollTop = el.getContentElement().clientHeight;
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen;
  }

  openChat() {
    this.chatOpen = true;
  }

  sendMessage() {
    /*
    if (this.chats.length && this.messageInput.trim() === '') {
      return;
    }
    this.chats[this.activatedTabIndex].messages.push({id: this.user.id, date: new Date(), message: this.messageInput});
    this.messageInput = '';
    */
    // TODO send message
    const b = this.chatService.sendMessage(this.chats[this.activatedTabIndex].id, this.messageInput);
  }

  activateTab(index: number) {
    this.activatedTabIndex = index;
  }

  closeTab(id: number) {
    if (this.activatedTabIndex === this.chats.length - 1 && this.activatedTabIndex > 0) {
      this.activatedTabIndex--;
    }
    this.messageSubscriptions.get(id).unsubscribe();
    this.chatService.deleteChat(id);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
