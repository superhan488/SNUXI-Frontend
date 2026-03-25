import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AdminRoom, AdminUser, PageInfo, Report } from '../../api/admin';
import { getAdminRooms, getAdminUsers, getReports } from '../../api/admin';
import { getLandmarks } from '../../api/map';
import { userRoleAtom } from '../../common/user';
import './AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [userRole] = useAtom(userRoleAtom);
  const [reports, setReports] = useState<Report[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalPots, setTotalPots] = useState<number | null>(null);

  // Users table
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPageInfo, setUsersPageInfo] = useState<PageInfo | null>(null);
  const [usersPage, setUsersPage] = useState(0);

  // Pots table
  const [pots, setPots] = useState<AdminRoom[]>([]);
  const [potsPageInfo, setPotsPageInfo] = useState<PageInfo | null>(null);
  const [potsPage, setPotsPage] = useState(0);
  const [landmarkMap, setLandmarkMap] = useState<Record<number, string>>({});

  // Reports filter and pagination
  const [page, setPage] = useState(0);
  const [isProcessed, setIsProcessed] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    if (userRole && userRole !== 'ADMIN') {
      alert('You do not have permission to access this page.');
      navigate('/');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole !== 'ADMIN') return;
    const fetchLandmarks = async () => {
      try {
        const data = await getLandmarks();
        if (data?.landmarks) {
          const map: Record<number, string> = {};
          // biome-ignore lint/suspicious/noExplicitAny:
          for (const l of data.landmarks as any[]) {
            map[l.id] = l.name;
          }
          setLandmarkMap(map);
        }
      } catch {
        // ignore
      }
    };
    fetchLandmarks();
  }, [userRole]);

  // Fetch stats
  useEffect(() => {
    if (userRole !== 'ADMIN') return;
    const fetchStats = async () => {
      try {
        const [usersRes, roomsRes] = await Promise.allSettled([
          getAdminUsers(0, 1),
          getAdminRooms(0, 1),
        ]);
        if (usersRes.status === 'fulfilled') {
          setTotalUsers(usersRes.value.page.totalElements);
        }
        if (roomsRes.status === 'fulfilled') {
          setTotalPots(roomsRes.value.page.totalElements);
        }
      } catch {
        // ignore
      }
    };
    fetchStats();
  }, [userRole]);

  // Fetch users
  useEffect(() => {
    if (userRole !== 'ADMIN') return;
    const fetchUsers = async () => {
      try {
        const res = await getAdminUsers(usersPage, 20);
        setUsers(res.content);
        setUsersPageInfo(res.page);
      } catch {
        // ignore
      }
    };
    fetchUsers();
  }, [userRole, usersPage]);

  // Fetch pots
  useEffect(() => {
    if (userRole !== 'ADMIN') return;
    const fetchPots = async () => {
      try {
        const res = await getAdminRooms(potsPage, 10);
        setPots(res.content);
        setPotsPageInfo(res.page);
      } catch {
        // ignore
      }
    };
    fetchPots();
  }, [userRole, potsPage]);

  // Fetch reports
  useEffect(() => {
    if (userRole === 'ADMIN') {
      const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await getReports({
            isProcessed,
            pageable: { page, size: 10, sort: ['reportedAt,desc'] },
          });
          setReports(response.content);
          setPageInfo(response.page);
        } catch (err: unknown) {
          if (isAxiosError(err) && err.response?.status === 403) {
            setError('You do not have permission to view this page.');
          } else {
            setError('Error fetching reports.');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [page, isProcessed, userRole]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setPage(0);
    setIsProcessed(value === '' ? undefined : value === 'true');
  };

  const formatStatus = (status: string) => {
    const map: Record<string, string> = {
      RECRUITING: '모집중',
      SUCCESS: '성사됨',
      FAILED: '실패',
      EXPIRED: '만료됨',
    };
    return map[status] ?? status;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ko-KR', {
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

      {/* Stats Cards */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-label">총 사용자 수</div>
          <div className="admin-stat-value">
            {totalUsers !== null ? totalUsers.toLocaleString() : '—'}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">총 팟 개수</div>
          <div className="admin-stat-value">
            {totalPots !== null ? totalPots.toLocaleString() : '—'}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <h2 style={{ marginTop: '2rem' }}>사용자 목록</h2>
      {users.length > 0 ? (
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
                    {user.isSuspended ? (
                      <span className="status unprocessed">정지됨</span>
                    ) : (
                      <span className="status processed">정상</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              onClick={() => setUsersPage((p) => p - 1)}
              disabled={usersPage === 0}
            >
              이전
            </button>
            <span>
              {usersPageInfo ? usersPageInfo.number + 1 : 1} /{' '}
              {usersPageInfo ? Math.max(1, usersPageInfo.totalPages) : 1}
            </span>
            <button
              onClick={() => setUsersPage((p) => p + 1)}
              disabled={
                usersPageInfo
                  ? usersPageInfo.number + 1 >= usersPageInfo.totalPages
                  : true
              }
            >
              다음
            </button>
          </div>
        </>
      ) : (
        <p style={{ color: '#868e96' }}>사용자 데이터를 불러올 수 없습니다.</p>
      )}

      {/* Pots Table */}
      <h2 style={{ marginTop: '2rem' }}>전체 팟 목록</h2>
      {pots.length > 0 ? (
        <>
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>출발지</th>
                <th>도착지</th>
                <th>출발 시간</th>
                <th>인원</th>
                <th>상태</th>
                <th>채팅 열람</th>
              </tr>
            </thead>
            <tbody>
              {pots.map((pot) => (
                <tr key={pot.id}>
                  <td>{pot.id}</td>
                  <td>{landmarkMap[pot.departureId] ?? pot.departureId}</td>
                  <td>{landmarkMap[pot.destinationId] ?? pot.destinationId}</td>
                  <td>{new Date(pot.departureTime).toLocaleString('ko-KR')}</td>
                  <td>
                    {pot.currentCount}/{pot.maxCapacity}
                  </td>
                  <td>
                    <span className={`status ${pot.status.toLowerCase()}`}>
                      {formatStatus(pot.status)}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/chat/${pot.id}`}
                      className="admin-chat-link"
                    >
                      채팅 보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              onClick={() => setPotsPage((p) => p - 1)}
              disabled={potsPage === 0}
            >
              이전
            </button>
            <span>
              {potsPageInfo ? potsPageInfo.number + 1 : 1} /{' '}
              {potsPageInfo ? Math.max(1, potsPageInfo.totalPages) : 1}
            </span>
            <button
              onClick={() => setPotsPage((p) => p + 1)}
              disabled={
                potsPageInfo
                  ? potsPageInfo.number + 1 >= potsPageInfo.totalPages
                  : true
              }
            >
              다음
            </button>
          </div>
        </>
      ) : (
        <p style={{ color: '#868e96' }}>팟 데이터를 불러올 수 없습니다.</p>
      )}

      {/* Reports Section */}
      <h2 style={{ marginTop: '2rem' }}>신고 목록</h2>
      <div className="filters">
        <label htmlFor="status-filter">Filter by status:</label>
        <select
          id="status-filter"
          onChange={handleFilterChange}
          value={isProcessed === undefined ? '' : String(isProcessed)}
        >
          <option value="">All</option>
          <option value="false">Unprocessed</option>
          <option value="true">Processed</option>
        </select>
      </div>

      {loading && <p>Loading reports...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <>
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reported User</th>
                <th>Reporter</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <Link to={`/admin/reports/${report.id}`}>{report.id}</Link>
                  </td>
                  <td>{report.reportedEmail}</td>
                  <td>{report.reporterEmail}</td>
                  <td>{report.reason}</td>
                  <td>{new Date(report.reportedAt).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`status ${report.isProcessed ? 'processed' : 'unprocessed'}`}
                    >
                      {report.isProcessed ? 'Processed' : 'Unprocessed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              Previous
            </button>
            <span>
              Page {pageInfo ? pageInfo.number + 1 : 1} of{' '}
              {pageInfo ? Math.max(1, pageInfo.totalPages) : 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={
                pageInfo ? pageInfo.number + 1 >= pageInfo.totalPages : true
              }
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPage;
