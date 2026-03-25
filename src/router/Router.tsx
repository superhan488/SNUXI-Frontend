import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import NavBar from '../components/NavBar';
import AdminPage from '../pages/AdminPage';
import ReportDetail from '../pages/AdminPage/ReportDetail';
import ChatRoom from '../pages/ChatRoom';
import CreateRoom from '../pages/CreateRoom';
import ErrorPage from '../pages/ErrorPage';
import MyChat from '../pages/MyChat';
import MyPage from '../pages/MyPage/MyPage';
import RoomSearch from '../pages/SearchRoom/RoomSearch';
import Terms from '../pages/Terms';

// 일반 페이지 레이아웃 (상단 NavBar + 하단 BottomNav)
const MainLayout = () => (
  <>
    <NavBar />
    <Outlet />
    <BottomNav />
  </>
);

// 채팅방 전용 레이아웃 (NavBar/BottomNav 없음, 풀스크린)
const ChatLayout = () => <Outlet />;

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/terms" element={<Terms />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route element={<ChatLayout />}>
          <Route path="/chat/:roomId" element={<ChatRoom />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path="/search-room" element={<RoomSearch />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/my-chat" element={<MyChat />} />
          <Route path="/my-page" element={<MyPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/reports/:reportId" element={<ReportDetail />} />
          <Route path="/" element={<RoomSearch />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
