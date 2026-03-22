import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import NavBar from '../components/NavBar';
import AdminPage from '../pages/AdminPage';
import ReportDetail from '../pages/AdminPage/ReportDetail';
import ChatRoom from '../pages/ChatRoom';
import CreateRoom from '../pages/CreateRoom';
import ErrorPage from '../pages/ErrorPage'; // Added ErrorPage import
import MyChat from '../pages/MyChat';
import MyPage from '../pages/MyPage/MyPage';
import RoomSearch from '../pages/SearchRoom/RoomSearch';
import Terms from '../pages/Terms';

const MainLayout = () => {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
};

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/terms" element={<Terms />} />
        <Route path="/error" element={<ErrorPage />} />{' '}
        {/* Added ErrorPage route */}
        <Route element={<MainLayout />}>
          <Route path="/search-room" element={<RoomSearch />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/my-chat" element={<MyChat />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
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
