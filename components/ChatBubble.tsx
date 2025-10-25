import React, { useState, useRef, useEffect } from 'react';
import type { Message, User } from '../types';

interface ChatBubbleProps {
  message: Message;
  user: User;
  imageStore: Record<string, string>;
  onUpdate: (id: number, newContent: string) => void;
  isLastInGroup: boolean;
  uiMode: 'kakaotalk' | 'instagram';
}

const InstagramAvatar = () => (
    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3 flex-shrink-0">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
);


const ChatBubble: React.FC<ChatBubbleProps> = ({ message, user, imageStore, onUpdate, isLastInGroup, uiMode }) => {
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
          className="block max-w-full h-auto"
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
          className={`w-full bg-transparent p-0 m-0 border-none focus:ring-0 resize-none ${user.isMe && uiMode === 'instagram' ? 'text-white' : 'text-black'}`}
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
  
  let bubbleClass = '';
  let bubbleRadius = '';

  if (uiMode === 'kakaotalk') {
    bubbleClass = user.isMe ? 'bg-[#F7E600] text-black' : 'bg-white text-black';
    bubbleRadius = 'rounded-lg';
  } else { // instagram mode based on codepen
    bubbleClass = user.isMe
      ? 'bg-gradient-to-r from-[#8E2DE2] to-[#4A00E0] text-white'
      : 'bg-[#E0E0E0] text-black';
    bubbleRadius = user.isMe
      ? 'rounded-t-[20px] rounded-bl-[20px] rounded-br-[5px]'
      : 'rounded-t-[20px] rounded-br-[20px] rounded-bl-[5px]';
  }

  const containerClass = user.isMe
    ? 'flex justify-end'
    : 'flex justify-start';
    
  const bubbleWrapperClass = [
    bubbleRadius,
    'max-w-xs md:max-w-md',
    imageUrl ? 'p-0 bg-transparent overflow-hidden' : `${bubbleClass} p-2 px-3`
  ].join(' ');

  if (user.isMe) {
    return (
      <div className={`${containerClass} mb-1`}>
        <div className="flex items-end gap-2">
          {uiMode === 'kakaotalk' && isLastInGroup && <span className="text-xs text-gray-500 mb-1 flex-shrink-0">{message.timestamp}</span>}
          <div className={bubbleWrapperClass}>
            {bubbleContent()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClass} mb-1`}>
      {!message.isContinuation && (
          uiMode === 'kakaotalk' ?
          <img 
              src="https://mblogthumb-phinf.pstatic.net/MjAyMDAyMTBfODAg/MDAxNTgxMzA0MTE3ODMy.ACRLtB9v5NH-I2qjWrwiXLb7TeUiG442cJmcdzVum7cg.eTLpNg_n0rAS5sWOsofRrvBy0qZk_QcWSfUiIagTfd8g.JPEG.lattepain/1581304118739.jpg?type=w800" 
              alt={user.name} 
              className="w-10 h-10 rounded-full mr-3 flex-shrink-0 object-cover"
          /> : <InstagramAvatar />
      )}
      {message.isContinuation && <div className="w-10 mr-3 flex-shrink-0"></div>}
      
      <div className="flex flex-col items-start">
        {!message.isContinuation && uiMode === 'kakaotalk' && <div className="text-sm text-gray-800 mb-1">{user.name}</div>}
        <div className="flex items-end gap-2">
          <div className={bubbleWrapperClass}>
            {bubbleContent()}
          </div>
          {uiMode === 'kakaotalk' && isLastInGroup && <span className="text-xs text-gray-500 mb-1 flex-shrink-0">{message.timestamp}</span>}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;