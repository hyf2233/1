import { useAppStore } from '../../store/appStore';
import Sidebar from './Sidebar';
import ChatPage from './ChatPage';
import ContactsPage from './ContactsPage';
import MomentsPage from './MomentsPage';
import DiscoverPage from './DiscoverPage';
import ProfilePage from './ProfilePage';
import Toast from '../shared/Toast';

export default function AppLayout() {
  const activeTab = useAppStore(s => s.activeTab);

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
