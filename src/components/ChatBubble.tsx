import type { ChatMessage } from '../types';
import './ChatBubble.css';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function renderInlineMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'coach'}`}>
      <div className="chat-avatar">{isUser ? '我' : '教练'}</div>
      <div
        className="chat-content"
        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(message.content) }}
      />
    </div>
  );
}
