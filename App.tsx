import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatItem, User } from './types';
import { parseChat } from './services/chatParser';
import ChatBubble from './components/ChatBubble';

const AVATAR_COLORS = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];

type ParsedData = {
  messages: ChatItem[];
  users: string[];
  title: string;
  imageStore: Record<string, string>;
};

const FileUpload: React.FC<{ 
  onFileUpload: (file: File) => void; 
  onFolderUpload: (files: FileList) => void;
  isLoading: boolean; 
  error: string | null 
}> = ({ onFileUpload, onFolderUpload, isLoading, error }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
        <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg max-w-lg">
            <h1 className="text-3xl font-bold mb-2">카카오톡 대화 뷰어</h1>
            <p className="text-gray-400 mb-6">카카오톡에서 '대화 내용 내보내기' 기능을 사용하여 만든 .zip 파일 또는 폴더를 업로드하세요.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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


const ChatHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="sticky top-0 z-10 bg-[#A9B9C8] p-3 flex items-center">
    <button className="text-black mr-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
    </button>
    <h2 className="text-black text-lg font-semibold flex-grow">{title.replace(" 님과 카카오톡 대화", "")}</h2>
    <div className="flex items-center gap-4 text-black">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
    </div>
  </div>
);


const App: React.FC = () => {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [imageStore, setImageStore] = useState<Record<string, string>>({});
  const [chatTitle, setChatTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isSelectingUser, setIsSelectingUser] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (chatItems.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [chatItems]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || !file.name.endsWith('.zip')) {
      setError('올바른 .zip 파일을 선택해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const zip = await JSZip.loadAsync(file);
      // FIX: The result of Object.values on an untyped object can be `unknown[]` in strict TypeScript.
      // The `find` method on `unknown[]` returns `unknown`, causing a type error.
      // Explicitly type `txtFile` as `any` to allow property access.
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
    return <FileUpload onFileUpload={handleFileUpload} onFolderUpload={handleFolderUpload} isLoading={isLoading} error={error} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-200 text-black font-sans">
        <ChatHeader title={chatTitle} />
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{
            backgroundImage: "url('https://mblogthumb-phinf.pstatic.net/MjAxODAzMTFfMTUw/MDAxNTIwNzM1NzcxMjIx.VV7V_1Y-12Jz27VPfBx6o0Z6ghtfwswPa0hv2Pz0fcQg.l-n7q1BsV8uszXspCHo6DXoqDt5oKzdzMUgc11OBy2Ig.PNG.osy2201/1.png?type=w800')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
            {chatItems.map((item, index) => {
                switch (item.type) {
                case 'date':
                    return <div key={item.id} className="text-center my-4"><span className="bg-gray-700 text-xs text-white rounded-full px-3 py-1">{item.date}</span></div>;
                case 'system':
                    return <div key={item.id} className="text-center my-4"><span className="bg-gray-700 text-xs text-white rounded-full px-3 py-1">{item.content}</span></div>;
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
                    return <ChatBubble key={item.id} message={item} user={user} imageStore={imageStore} onUpdate={handleUpdateMessage} isLastInGroup={isLastInGroup} />;
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