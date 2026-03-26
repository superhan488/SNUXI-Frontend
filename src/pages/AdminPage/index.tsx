import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminPot, AdminUser } from '../../api/admin';
import {
  getAdminPots,
  getAdminUsers,
  suspendUser,
  unsuspendUser,
} from '../../api/admin';
import { userRoleAtom } from '../../common/user';
import './AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [userRole] = useAtom(userRoleAtom);

  const [activeTab, setActiveTab] = useState<'users' | 'pots'>('users');
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersPage, setUsersPage] = useState(0);

  const [pots, setPots] = useState<AdminPot[]>([]);
  const [potsTotalPages, setPotsTotalPages] = useState(1);
  const [potsPage, setPotsPage] = useState(0);
  const [totalPots, setTotalPots] = useState<number | null>(null);

  useEffect(() => {
    if (userRole && userRole !== 'ADMIN') {
      alert('You do not have permission to access this page.');
      navigate('/');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole !== 'ADMIN') return;
    const fetchUsers = async () => {
      try {
        const res = await getAdminUsers(usersPage, 20);
        setUsers(res.content);
        setUsersTotalPages(res.totalPages);
        setTotalUsers(res.totalElements);
      } catch {
        // ignore
      }
    };
    fetchUsers();
  }, [userRole, usersPage]);

  useEffect(() => {
    if (userRole !== 'ADMIN') return;
    const fetchPots = async () => {
      try {
        const res = await getAdminPots(potsPage, 20);
        setPots(res.content);
        setPotsTotalPages(res.totalPages);
        setTotalPots(res.totalElements);
      } catch {
        // ignore
      }
    };
    fetchPots();
  }, [userRole, potsPage]);

  const handleSuspend = async (user: AdminUser) => {
    if (user.suspended) return;
    const days = window.prompt(`${user.username} 정지 기간 (일 수):`, '7');
    if (days === null) return;
    const daysNum = Number(days);
    if (!daysNum || daysNum <= 0) return;
    try {
      await suspendUser(user.id, daysNum);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, suspended: true } : u))
      );
    } catch {
      alert('정지 처리에 실패했습니다.');
    }
  };

  const handleUnsuspend = async (user: AdminUser) => {
    try {
      await unsuspendUser(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, suspended: false } : u))
      );
    } catch {
      alert('정지 해제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (userRole !== 'ADMIN') {
    return <div>Loading or Access Denied...</div>;
  }

  return (
    <div className="admin-container">
      <h1>관리자 페이지</h1>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-label">총 사용자 수</div>
          <div className="admin-stat-value">
            {totalUsers !== null ? totalUsers.toLocaleString() : '—'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          사용자 목록
          {totalUsers !== null ? ` (${totalUsers.toLocaleString()})` : ''}
        </button>
        <button
          className={`admin-tab ${activeTab === 'pots' ? 'active' : ''}`}
          onClick={() => setActiveTab('pots')}
        >
          전체 팟 목록
          {totalPots !== null ? ` (${totalPots.toLocaleString()})` : ''}
        </button>
      </div>

      {activeTab === 'users' && users.length > 0 ? (
        <>
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>이메일</th>
                <th>닉네임</th>
                <th>권한</th>
                <th>가입 일시</th>
                <th>정지 여부</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>
                    <span
                      className={`status ${user.role === 'ADMIN' ? 'processed' : 'unprocessed'}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    {user.suspended ? (
                      <span className="status unprocessed">정지됨</span>
                    ) : (
                      <span className="status processed">정상</span>
                    )}
                  </td>
                  <td>
                    {user.suspended ? (
                      <button
                        className="unsuspend-btn"
                        onClick={() => handleUnsuspend(user)}
                      >
                        정지 해제
                      </button>
                    ) : (
                      <button
                        className="suspend-btn"
                        onClick={() => handleSuspend(user)}
                      >
                        정지
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              className="pagination-arrow"
              onClick={() => setUsersPage((p) => p - 1)}
              disabled={usersPage === 0}
            >
              ‹
            </button>
            {Array.from({ length: usersTotalPages }, (_, i) => (
              <button
                key={i}
                className={`pagination-page ${usersPage === i ? 'active' : ''}`}
                onClick={() => setUsersPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="pagination-arrow"
              onClick={() => setUsersPage((p) => p + 1)}
              disabled={usersPage + 1 >= usersTotalPages}
            >
              ›
            </button>
          </div>
        </>
      ) : activeTab === 'users' ? (
        <p style={{ color: '#868e96' }}>사용자 데이터를 불러올 수 없습니다.</p>
      ) : null}

      {activeTab === 'pots' && pots.length > 0 ? (
        <>
          <table className="reports-table">
            <thead>
              <tr>
                <th>팟 ID</th>
                <th>출발지</th>
                <th>도착지</th>
                <th>출발 시간</th>
                <th>참여 인원</th>
                <th>카카오 호출 상태</th>
                <th>카카오 호출 시간</th>
                <th>오류</th>
                <th>생성 일시</th>
              </tr>
            </thead>
            <tbody>
              {pots.map((pot) => (
                <tr key={pot.potId}>
                  <td>{pot.potId}</td>
                  <td>{pot.departureName}</td>
                  <td>{pot.destinationName}</td>
                  <td>{formatDate(pot.departureTime)}</td>
                  <td>{pot.participantCount}</td>
                  <td>{pot.kakaoDeepLinkStatus || '—'}</td>
                  <td>
                    {pot.kakaoDeepLinkAt
                      ? formatDate(pot.kakaoDeepLinkAt)
                      : '—'}
                  </td>
                  <td>{pot.kakaoDeepLinkError || '—'}</td>
                  <td>{formatDate(pot.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              className="pagination-arrow"
              onClick={() => setPotsPage((p) => p - 1)}
              disabled={potsPage === 0}
            >
              ‹
            </button>
            {Array.from({ length: potsTotalPages }, (_, i) => (
              <button
                key={i}
                className={`pagination-page ${potsPage === i ? 'active' : ''}`}
                onClick={() => setPotsPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="pagination-arrow"
              onClick={() => setPotsPage((p) => p + 1)}
              disabled={potsPage + 1 >= potsTotalPages}
            >
              ›
            </button>
          </div>
        </>
      ) : activeTab === 'pots' ? (
        <p style={{ color: '#868e96' }}>팟 데이터를 불러올 수 없습니다.</p>
      ) : null}
    </div>
  );
};

export default AdminPage;
