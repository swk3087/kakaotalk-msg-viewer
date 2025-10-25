import { ChatItem, Message } from '../types';

const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const formatDateWithDay = (dateStr: string) => {
  const match = dateStr.match(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(date.getTime())) return dateStr;
  const dayOfWeek = KOREAN_DAYS[date.getDay()];
  return `${dateStr} ${dayOfWeek}요일`;
};

const parseTimestampToDisplayTime = (timestampString: string): string => {
    const match = timestampString.match(/(오전|오후)\s(\d{1,2}:\d{2})/);
    return match ? `${match[1]} ${match[2]}` : '';
};

export const parseChat = (
  txtContent: string
): { messages: ChatItem[]; users: string[]; title: string } => {
  const lines = txtContent.split('\n').map(line => line.trim());
  const title = lines[0] || '카카오톡 대화';
  const messages: ChatItem[] = [];
  const users = new Set<string>();

  const messageRegex = /^(\d{4}년 \d{1,2}월 \d{1,2}일 (?:오전|오후) \d{1,2}:\d{2}), (.+?) : ([\s\S]*)/;
  const dateSeparatorRegex = /^(\d{4}년 \d{1,2}월 \d{1,2}일 (?:오전|오후) \d{1,2}:\d{2})$/;
  
  let lastMessage: ChatItem | null = null;
  let lastDate: string | null = null;

  for (const line of lines.slice(3)) {
    if (!line) continue;

    if (line === '메시지가 삭제되었습니다.') {
      messages.push({
        id: Math.random(),
        type: 'system',
        content: '메시지가 삭제되었습니다.',
      });
      lastMessage = null;
      continue;
    }

    const dateMatch = line.match(dateSeparatorRegex);
    if (dateMatch) {
      const fullDateStr = dateMatch[1];
      const datePartMatch = fullDateStr.match(/(\d{4}년 \d{1,2}월 \d{1,2}일)/);
      if (datePartMatch) {
        const formattedDate = formatDateWithDay(datePartMatch[1]);
        if (formattedDate !== lastDate) {
          messages.push({
              id: Math.random(),
              type: 'date',
              date: fullDateStr,
          });
          lastDate = formattedDate;
          lastMessage = null;
        }
      }
      continue;
    }
    
    const messageMatch = line.match(messageRegex);
    if (messageMatch) {
      const [_, fullTimestamp, userName, content] = messageMatch;
      const messageDateMatch = fullTimestamp.match(/^(\d{4}년 \d{1,2}월 \d{1,2}일)/);

      if (messageDateMatch && messageDateMatch[0]) {
        const messageDate = messageDateMatch[0];
        if (formatDateWithDay(messageDate) !== lastDate) {
          lastDate = formatDateWithDay(messageDate);
          messages.push({
            id: Math.random(),
            type: 'date',
            date: fullTimestamp,
          });
        }
      }
      
      const timestamp = parseTimestampToDisplayTime(fullTimestamp);
      const isContinuation =
        lastMessage?.type === 'message' &&
        lastMessage.user === userName.trim() &&
        lastMessage.timestamp === timestamp;

      const newMessage: Message = {
        id: Math.random(),
        type: 'message',
        user: userName.trim(),
        content: content.trim(),
        timestamp: timestamp,
        fullTimestamp: fullTimestamp,
        isContinuation,
      };
      
      messages.push(newMessage);
      users.add(userName.trim());
      lastMessage = newMessage;
    } else if (lastMessage && lastMessage.type === 'message') {
      lastMessage.content += '\n' + line;
    }
  }

  return { messages, users: Array.from(users), title };
};