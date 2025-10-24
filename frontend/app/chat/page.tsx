'use client';

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { ScrollButton } from "@/components/ui/scroll-button"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
  ArrowUp,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash,
  LogOut,
  Square,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User, Chat as ChatType, ChatListItem, Message as MessageType } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function ChatSidebar({ 
  user, 
  chats, 
  currentChatId, 
  onChatSelect, 
  onNewChat, 
  onRename, 
  onDelete, 
  onLogout 
}: {
  user: User;
  chats: ChatListItem[];
  currentChatId: number | null;
  onChatSelect: (id: number) => void;
  onNewChat: () => void;
  onRename: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  onLogout: () => void;
}) {
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; chatId: number | null; currentTitle: string }>({
    open: false,
    chatId: null,
    currentTitle: '',
  });
  const [newTitle, setNewTitle] = useState('');

  // Group chats by time period
  const groupedChats = () => {
    const now = new Date();
    const today: ChatListItem[] = [];
    const yesterday: ChatListItem[] = [];
    const last7Days: ChatListItem[] = [];
    const lastMonth: ChatListItem[] = [];

    chats.forEach((chat) => {
      const chatDate = new Date(chat.updated_at);
      const diffTime = now.getTime() - chatDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (diffDays < 1) {
        today.push(chat);
      } else if (diffDays < 2) {
        yesterday.push(chat);
      } else if (diffDays < 7) {
        last7Days.push(chat);
      } else if (diffDays < 30) {
        lastMonth.push(chat);
      }
    });

    return [
      { period: "Today", conversations: today },
      { period: "Yesterday", conversations: yesterday },
      { period: "Last 7 days", conversations: last7Days },
      { period: "Last month", conversations: lastMonth },
    ].filter(group => group.conversations.length > 0);
  };

  const handleRenameSubmit = () => {
    if (renameDialog.chatId && newTitle.trim()) {
      onRename(renameDialog.chatId, newTitle);
      setRenameDialog({ open: false, chatId: null, currentTitle: '' });
      setNewTitle('');
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <Button onClick={onNewChat} className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {groupedChats().map((group) => (
            <SidebarGroup key={group.period}>
              <SidebarGroupLabel>{group.period}</SidebarGroupLabel>
              <SidebarMenu>
                {group.conversations.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer",
                      currentChatId === chat.id && "bg-accent"
                    )}
                  >
                    <SidebarMenuButton
                      onClick={() => onChatSelect(chat.id)}
                      className="flex-1"
                    >
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameDialog({ open: true, chatId: chat.id, currentTitle: chat.title });
                            setNewTitle(chat.title);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(chat.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <div className="mt-auto border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.username}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Sidebar>

      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ ...renameDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>Enter a new name for this chat</DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <Label htmlFor="title" className="mb-3">Chat Title</Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, chatId: null, currentTitle: '' })}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  // no refs needed for text-only input

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
      loadChats();
    } catch (err) {
      window.location.href = '/login';
    }
  };

  const loadChats = async () => {
    try {
      const chatsData = await api.getChats();
      setChats(chatsData);
      if (chatsData.length > 0 && !currentChat) {
        loadChat(chatsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const loadChat = async (chatId: number) => {
    try {
      const chatData = await api.getChat(chatId);
      setCurrentChat(chatData);
      setMessages(chatData.messages || []);
    } catch (err) {
      console.error('Failed to load chat:', err);
    }
  };

  const createNewChat = async () => {
    try {
      const newChat = await api.createChat();
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  const handleRename = async (chatId: number, title: string) => {
    try {
      await api.updateChat(chatId, title);
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      ));
      if (currentChat?.id === chatId) {
        setCurrentChat({ ...currentChat, title });
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  };

  const handleDelete = async (chatId: number) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      await api.deleteChat(chatId);
      setChats(chats.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          loadChat(remainingChats[0].id);
        } else {
          setCurrentChat(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };


  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const content = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Ensure there's a chat to send to (handles brand new accounts)
  let targetChat = currentChat;
    if (!targetChat) {
      try {
        const created = await api.createChat();
        setChats([created, ...chats]);
        setCurrentChat(created);
        targetChat = created;
      } catch (e) {
        console.error('Failed to auto-create chat:', e);
        setLoading(false);
        return;
      }
    }

    // Add user message to UI
    const chatId = (targetChat as ChatType).id;
    const tempUserMsg: MessageType = {
      id: Date.now(),
      chat: chatId,
      user: user!.id,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages([...messages, tempUserMsg]);

    try {
      const controller = new AbortController();
      setAbortController(controller);
      const stream = await api.sendMessage(chatId, content, undefined, controller.signal);
      
      if (stream) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        // Add AI message placeholder
        const tempAiMsg: MessageType = {
          id: Date.now() + 1,
          chat: chatId,
          user: user!.id,
          content: '',
          response: '',
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempAiMsg]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          aiResponse += chunk;

          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempAiMsg.id 
                ? { ...msg, response: aiResponse }
                : msg
            )
          );
        }
      }

      await loadChat(chatId);
      await loadChats();
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // user stopped the stream – leave partial content as-is
        console.warn('Response streaming aborted by user');
      } else {
        console.error('Failed to send message:', err);
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    window.location.href = '/login';
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <ChatSidebar
        user={user}
        chats={chats}
        currentChatId={currentChat?.id || null}
        onChatSelect={loadChat}
        onNewChat={createNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">{currentChat?.title || 'Chat'}</h1>
        </header>
        <div className="relative flex-1 overflow-hidden">
          <ChatContainerRoot className="h-full">
            <ChatContainerContent className="px-5 py-8 pb-24 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.content && (
                  <Message className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-6 items-end">
                    <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%]">
                      {msg.content}
                    </MessageContent>
                  </Message>
                )}
                {msg.response && (
                  <Message className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-6 items-start">
                    <div className="group flex w-full flex-col gap-0">
                      <MessageContent markdown className="text-foreground prose flex-1 rounded-lg bg-transparent p-0">
                        {msg.response}
                      </MessageContent>
                      <MessageActions className="-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        <MessageAction tooltip="Copy" delayDuration={100}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() => navigator.clipboard.writeText(msg.response || '')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </MessageAction>
                      </MessageActions>
                    </div>
                  </Message>
                )}
              </div>
            ))}
            {loading && (
              <Message className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-6 items-start">
                <div className="flex items-center gap-1 pl-1 py-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce" style={{animationDelay: '0ms'}}></span>
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
              </Message>
            )}
            </ChatContainerContent>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex w-full max-w-3xl justify-end px-5">
              <ScrollButton className="shadow-sm" />
            </div>
          </ChatContainerRoot>
        </div>
        <div className="bg-background sticky bottom-0 z-30 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
          <div className="mx-auto max-w-3xl">
            <PromptInput onSubmit={handleSendMessage} className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs">
              <PromptInputTextarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="min-h-11 pt-3 pl-4 text-base leading-[1.3]"
              />
              <PromptInputActions className="mt-3 flex w-full items-center justify-end gap-2 px-3 pb-3">
                {!loading ? (
                  <PromptInputAction tooltip="Send message">
                    <Button
                      type="submit"
                      size="icon"
                      disabled={loading || !inputMessage.trim()}
                      className="size-9 rounded-full"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                  </PromptInputAction>
                ) : (
                  <PromptInputAction tooltip="Stop response">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-full"
                      onClick={() => abortController?.abort()}
                    >
                      <Square className="h-5 w-5" />
                    </Button>
                  </PromptInputAction>
                )}
              </PromptInputActions>
            </PromptInput>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
