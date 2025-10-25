import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatItem, User } from './types';
import { parseChat } from './services/chatParser';
import ChatBubble from './components/ChatBubble';

const AVATAR_COLORS = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

type ParsedData = {
  messages: ChatItem[];
  users: string[];
  title: string;
  imageStore: Record<string, string>;
};

const formatDateWithDay = (dateStr: string) => {
  const match = dateStr.match(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(date.getTime())) return dateStr;
  const dayOfWeek = KOREAN_DAYS[date.getDay()];
  return `${dateStr} ${dayOfWeek}요일`;
};

const formatDateForDisplay = (dateString: string, mode: 'kakaotalk' | 'instagram'): string => {
    const dateMatch = dateString.match(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/);
    if (!dateMatch) return dateString;
    
    if (mode === 'kakaotalk') {
        return formatDateWithDay(dateMatch[0]);
    } else { // instagram
        const timeMatch = dateString.match(/(오전|오후) \d{1,2}:\d{2}/);
        const [, year, month, day] = dateMatch;
        const time = timeMatch ? ` ${timeMatch[0]}` : '';
        const formattedMonth = parseInt(month, 10);
        const formattedDay = parseInt(day, 10);
        return `${year}. ${formattedMonth}. ${formattedDay}.${time}`;
    }
}


const FileUpload: React.FC<{ 
  onFileUpload: (file: File) => void; 
  onFolderUpload: (files: FileList) => void;
  onDemoClick: () => void;
  isLoading: boolean; 
  error: string | null 
}> = ({ onFileUpload, onFolderUpload, onDemoClick, isLoading, error }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
        <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg max-w-lg">
            <h1 className="text-3xl font-bold mb-2">카카오톡 대화 뷰어</h1>
            <p className="text-gray-400 mb-6">카카오톡에서 '대화 내용 내보내기' 기능을 사용하여 만든 .zip 파일 또는 폴더를 업로드하세요.</p>
            <div className="flex flex-col gap-4 justify-center">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".zip"
                        onChange={(e) => e.target.files && onFileUpload(e.target.files[0])}
                        disabled={isLoading}
                    />
                    <label htmlFor="file-upload" className={`w-full text-center px-6 py-3 rounded-lg font-semibold cursor-pointer transition-colors ${isLoading ? 'bg-gray-500' : 'bg-[#F7E600] hover:bg-yellow-400 text-black'}`}>
                        {isLoading ? '처리 중...' : 'ZIP 파일 선택'}
                    </label>

                    <input
                        type="file"
                        id="folder-upload"
                        className="hidden"
                        onChange={(e) => e.target.files && onFolderUpload(e.target.files)}
                        disabled={isLoading}
                        {...{ webkitdirectory: "", directory: "" }}
                    />
                    <label htmlFor="folder-upload" className={`w-full text-center px-6 py-3 rounded-lg font-semibold cursor-pointer transition-colors ${isLoading ? 'bg-gray-500' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}>
                        {isLoading ? '처리 중...' : '폴더 선택'}
                    </label>
                </div>
                <button
                    onClick={onDemoClick}
                    disabled={isLoading}
                    className={`w-full text-center px-6 py-3 rounded-lg font-semibold cursor-pointer transition-colors ${isLoading ? 'bg-gray-500' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                >
                    {isLoading ? '처리 중...' : '데모 사용해보기'}
                </button>
            </div>
             <p className="text-xs text-gray-400 mt-6">
                <strong>폴더 선택 도움말:</strong> 모바일 기기에서는 보통
                <br />
                <code className="bg-gray-700 text-yellow-400 px-1.5 py-0.5 rounded-md text-sm font-mono">
                    내장 메모리/KakaoTalk/Chats/
                </code>
                <br />
                경로 안에 대화 폴더가 저장됩니다.
            </p>
            {error && <p className="text-red-400 mt-4">{error}</p>}
            <p className="text-xs text-gray-500 mt-6">
                이 애플리케이션은 모든 데이터를 브라우저 내에서만 처리합니다.
                <br />
                어떠한 대화 내용도 서버로 전송되지 않습니다.
            </p>
        </div>
    </div>
);


const UserSelection: React.FC<{ users: string[], onSelect: (name: string) => void }> = ({ users, onSelect }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900/80 backdrop-blur-sm text-white p-4">
        <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">대화에서 사용할 이름을 선택하세요.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(user => (
                    <button 
                        key={user}
                        onClick={() => onSelect(user)}
                        className="bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-transform transform hover:scale-105"
                    >
                        {user}
                    </button>
                ))}
            </div>
        </div>
    </div>
);


const ChatHeader: React.FC<{ 
    title: string;
    uiMode: 'kakaotalk' | 'instagram';
    onGoBack: () => void;
    onToggleUIMode: () => void;
}> = ({ title, uiMode, onGoBack, onToggleUIMode }) => {
    const headerStyle = uiMode === 'kakaotalk'
        ? "bg-[#8698A8] text-white"
        : "bg-white text-black border-b border-gray-300";
    const titleStyle = uiMode === 'kakaotalk'
        ? "text-lg font-semibold flex-grow"
        : "text-base font-bold flex-grow text-center";
    const iconStyle = "h-6 w-6";

    return (
      <div className={`sticky top-0 z-10 p-3 flex items-center transition-colors duration-300 ${headerStyle}`}>
        <button onClick={onGoBack} className="mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={uiMode === 'kakaotalk' ? 2 : 2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className={titleStyle}>{title.replace(" 님과 카카오톡 대화", "").replace("카카오톡 대화", "")}</h2>
        <div className="flex items-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={uiMode === 'kakaotalk' ? 2 : 2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <button onClick={onToggleUIMode}>
            <svg xmlns="http://www.w3.org/2000/svg" className={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={uiMode === 'kakaotalk' ? 2 : 2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </div>
      </div>
    );
};


const App: React.FC = () => {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [imageStore, setImageStore] = useState<Record<string, string>>({});
  const [chatTitle, setChatTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isSelectingUser, setIsSelectingUser] = useState<boolean>(false);
  const [uiMode, setUiMode] = useState<'kakaotalk' | 'instagram'>('kakaotalk');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const toggleUIMode = () => {
      setUiMode(prev => prev === 'kakaotalk' ? 'instagram' : 'kakaotalk');
  };

  const handleGoBack = () => {
    setChatItems([]);
    setUsers({});
    setImageStore({});
    setChatTitle('');
    setParsedData(null);
    setIsSelectingUser(false);
  };

  useEffect(() => {
    if (chatItems.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [chatItems, uiMode]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || !file.name.endsWith('.zip')) {
      setError('올바른 .zip 파일을 선택해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const txtFile: any = Object.values(zip.files).find((f: any) => f.name.endsWith('.txt'));

      if (!txtFile) {
        throw new Error('.txt 파일을 zip 아카이브에서 찾을 수 없습니다.');
      }

      const txtContent = await txtFile.async('string');
      const { messages, users: parsedUsers, title } = parseChat(txtContent);

      const newImageStore: Record<string, string> = {};
      for (const filename in zip.files) {
        if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
          const imageFile = zip.files[filename];
          const blob = await imageFile.async('blob');
          newImageStore[filename.split('/').pop() || filename] = URL.createObjectURL(blob);
        }
      }
      
      setParsedData({ messages, users: parsedUsers, title, imageStore: newImageStore });
      setIsSelectingUser(true);

    } catch (e) {
      console.error(e);
      setError('파일을 처리하는 중 오류가 발생했습니다.');
      setIsSelectingUser(false);
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFolderUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) {
        setError('폴더를 선택해주세요.');
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
        const fileArray = Array.from(files);
        const txtFile = fileArray.find(f => f.name === 'KakaoTalkChats.txt') || fileArray.find(f => f.name.endsWith('.txt'));

        if (!txtFile) {
            throw new Error('.txt 파일을 폴더에서 찾을 수 없습니다.');
        }

        const txtContent = await txtFile.text();
        const { messages, users: parsedUsers, title } = parseChat(txtContent);

        const newImageStore: Record<string, string> = {};
        const imageFiles = fileArray.filter(f => f.name.match(/\.(jpg|jpeg|png|gif)$/i));

        for (const imageFile of imageFiles) {
            newImageStore[imageFile.name] = URL.createObjectURL(imageFile);
        }
        
        setParsedData({ messages, users: parsedUsers, title, imageStore: newImageStore });
        setIsSelectingUser(true);

    } catch (e) {
        console.error(e);
        setError('폴더를 처리하는 중 오류가 발생했습니다.');
        setIsSelectingUser(false);
        setParsedData(null);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleDemo = useCallback(() => {
    setIsLoading(true);
    setError(null);

    const demoTxtContent = `개발자 님과 카카오톡 대화
저장한 날짜 : 2025년 10월 25일 오후 6:24



4444년 10월 24일 오전 7:00
4444년 10월 24일 오전 7:00, 개발자 : 상단 삼선 바를 누르고 기다리면 DM테마로 바뀝니다.
4444년 10월 24일 오전 7:00, 테스터 : ㄷㄷ

4444년 10월 24일 오전 7:10
4444년 10월 24일 오전 7:10, 개발자 : 상단 삼선 바를 다시 누르면 기본 테마로 돌아갑니다.
4444년 10월 24일 오전 7:10, 테스터 : ㅇㅋ`;

    try {
        const { messages, users: parsedUsers, title } = parseChat(demoTxtContent);
        setParsedData({ messages, users: parsedUsers, title, imageStore: {} });
        setIsSelectingUser(true);
    } catch (e) {
        console.error(e);
        setError('데모를 로드하는 중 오류가 발생했습니다.');
        setIsSelectingUser(false);
        setParsedData(null);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleSelectUser = useCallback((selectedName: string) => {
    if (!parsedData) return;

    const { messages, users: parsedUsers, title, imageStore: newImageStore } = parsedData;
    
    const userProfiles: Record<string, User> = {};
    parsedUsers.forEach((name, index) => {
      userProfiles[name] = {
        name,
        isMe: name === selectedName,
        avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length]
      };
    });

    setChatTitle(title);
    setUsers(userProfiles);
    setImageStore(newImageStore);
    setChatItems(messages);
    setIsSelectingUser(false);
    setParsedData(null);

  }, [parsedData]);


  const handleUpdateMessage = useCallback((id: number, newContent: string) => {
    setChatItems(prevItems =>
      prevItems.map(item =>
        item.id === id && item.type === 'message' ? { ...item, content: newContent } : item
      )
    );
  }, []);

  if (isSelectingUser && parsedData) {
    return <UserSelection users={parsedData.users} onSelect={handleSelectUser} />;
  }

  if (chatItems.length === 0) {
    return <FileUpload onFileUpload={handleFileUpload} onFolderUpload={handleFolderUpload} onDemoClick={handleDemo} isLoading={isLoading} error={error} />;
  }
  
  const chatContainerStyle = uiMode === 'kakaotalk' ? 'bg-[#A9BDCE]' : 'bg-gradient-to-b from-[#F6E2FF] to-[#E1F5FE]';
  const dateSeparatorStyle = uiMode === 'kakaotalk' 
      ? "bg-black/20 text-xs text-white rounded-full px-3 py-1"
      : "text-center my-4 text-xs text-gray-500";
  const systemMessageStyle = "bg-black/20 text-xs text-white rounded-full px-3 py-1";

  return (
    <div className={`flex flex-col h-screen text-black font-sans transition-colors duration-300 ${chatContainerStyle}`}>
        <ChatHeader title={chatTitle} uiMode={uiMode} onGoBack={handleGoBack} onToggleUIMode={toggleUIMode} />
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatItems.map((item, index) => {
                switch (item.type) {
                case 'date':
                    const dateContent = formatDateForDisplay(item.date, uiMode);
                    const datePrefix = uiMode === 'kakaotalk' ? '🗓️ ' : '';
                    const dateSuffix = uiMode === 'kakaotalk' ? ' >' : '';
                    return <div key={item.id} className="text-center my-4"><span className={dateSeparatorStyle}>{datePrefix}{dateContent}{dateSuffix}</span></div>;
                case 'system':
                    return <div key={item.id} className="text-center my-4"><span className={systemMessageStyle}>{item.content}</span></div>;
                case 'message':
                    const user = users[item.user];
                    if (!user) return null;
                    const nextItem = chatItems[index + 1];
                    const isLastInGroup = !(
                        nextItem?.type === 'message' &&
                        item.type === 'message' &&
                        nextItem.user === item.user &&
                        nextItem.timestamp === item.timestamp
                    );
                    return <ChatBubble key={item.id} message={item} user={user} imageStore={imageStore} onUpdate={handleUpdateMessage} isLastInGroup={isLastInGroup} uiMode={uiMode} />;
                default:
                    return null;
                }
            })}
             <div ref={chatEndRef} />
        </div>
    </div>
  );
};

export default App;