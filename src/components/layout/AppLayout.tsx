import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { initializeDatabase } from '../../sillytavern/database';
import Sidebar from './Sidebar';
import ChatPage from './ChatPage';
import ContactsPage from './ContactsPage';
import MomentsPage from './MomentsPage';
import DiscoverPage from './DiscoverPage';
import ProfilePage from './ProfilePage';
import Toast from '../shared/Toast';

export default function AppLayout() {
  const activeTab = useAppStore(s => s.activeTab);
  const loadFromDB = useAppStore(s => s.loadFromDB);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initializeDatabase();
        await loadFromDB();
      } catch (err) {
        console.error('Failed to initialize app:', err);
      } finally {
        setReady(true);
      }
    })();
  }, [loadFromDB]);

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-wechat-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-wechat-green flex items-center justify-center">
            <span className="text-white text-lg font-bold">微</span>
          </div>
          <p className="text-wechat-text-gray text-[14px]">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-wechat-bg overflow-hidden">
        {activeTab === 'chat' && <ChatPage />}
        {activeTab === 'contacts' && <ContactsPage />}
        {activeTab === 'moments' && <MomentsPage />}
        {activeTab === 'discover' && <DiscoverPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>
      <Toast />
    </div>
  );
}
