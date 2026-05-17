import type { ChatMessage } from '../types';
import './ChatBubble.css';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'coach'}`}>
      <div className="chat-avatar">{isUser ? '我' : '教练'}</div>
      <div className="chat-content">
        <p>{message.content}</p>
      </div>
    </div>
  );
}
