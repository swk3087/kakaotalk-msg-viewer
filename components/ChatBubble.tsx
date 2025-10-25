import React, { useState, useRef, useEffect } from 'react';
import type { Message, User } from '../types';

interface ChatBubbleProps {
  message: Message;
  user: User;
  imageStore: Record<string, string>;
  onUpdate: (id: number, newContent: string) => void;
  isLastInGroup: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, user, imageStore, onUpdate, isLastInGroup }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isImage = message.content.endsWith('.jpg') || message.content.endsWith('.png') || message.content.endsWith('.jpeg');
  const imageUrl = isImage ? imageStore[message.content] : null;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim() !== message.content) {
      onUpdate(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(message.content);
      setIsEditing(false);
    }
  };
  
  const handleBubbleClick = () => {
      if (!isImage) {
          setIsEditing(true);
      }
  };

  const bubbleContent = () => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt="chat content"
          className="rounded-lg max-w-full h-auto"
          style={{ maxWidth: '300px' }}
        />
      );
    }
    
    if (isEditing) {
      return (
        <textarea
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-black p-0 m-0 border-none focus:ring-0 resize-none"
          rows={editText.split('\n').length}
        />
      );
    }

    return (
        <div onClick={handleBubbleClick} className="whitespace-pre-wrap break-words cursor-pointer">
            {message.content === '이모티콘' ? '😀' : message.content}
        </div>
    );
  };
  
  const bubbleClass = user.isMe
    ? 'bg-[#F7E600] text-black'
    : 'bg-white text-black';

  const containerClass = user.isMe
    ? 'flex justify-end'
    : 'flex justify-start';

  if (user.isMe) {
    return (
      <div className={`${containerClass} mb-1`}>
        <div className="flex items-end gap-2">
          {isLastInGroup && <span className="text-xs text-gray-500 mb-1 flex-shrink-0">{message.timestamp}</span>}
          <div className={`rounded-lg p-2 max-w-xs md:max-w-md ${bubbleClass} ${imageUrl ? 'p-1' : ''}`}>
            {bubbleContent()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClass} mb-1`}>
      {!message.isContinuation && (
        <img 
            src="https://mblogthumb-phinf.pstatic.net/MjAyMDAyMTBfODAg/MDAxNTgxMzA0MTE3ODMy.ACRLtB9v5NH-I2qjWrwiXLb7TeUiG442cJmcdzVum7cg.eTLpNg_n0rAS5sWOsofRrvBy0qZk_QcWSfUiIagTfd8g.JPEG.lattepain/1581304118739.jpg?type=w800" 
            alt={user.name} 
            className="w-10 h-10 rounded-full mr-3 flex-shrink-0"
        />
      )}
      {message.isContinuation && <div className="w-10 mr-3 flex-shrink-0"></div>}
      
      <div className="flex flex-col items-start">
        {!message.isContinuation && <div className="text-sm text-gray-800 mb-1">{user.name}</div>}
        <div className="flex items-end gap-2">
          <div className={`rounded-lg p-2 max-w-xs md:max-w-md ${bubbleClass} ${imageUrl ? 'p-1' : ''}`}>
            {bubbleContent()}
          </div>
          {isLastInGroup && <span className="text-xs text-gray-500 mb-1 flex-shrink-0">{message.timestamp}</span>}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;