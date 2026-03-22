import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PageInfo, Report } from '../../api/admin';
import { getReports } from '../../api/admin';
import { userRoleAtom } from '../../common/user';
import './AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [userRole] = useAtom(userRoleAtom);
  const [reports, setReports] = useState<Report[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [page, setPage] = useState(0);
  const [isProcessed, setIsProcessed] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    // Wait until userRole is resolved before checking
    if (userRole && userRole !== 'ADMIN') {
      alert('You do not have permission to access this page.');
      navigate('/');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    // Only fetch reports if the user is an admin
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
          console.error('Error fetching reports:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchReports();
    } else {
      // If userRole is null (still loading) or not ADMIN, don't fetch
      setLoading(false);
    }
  }, [page, isProcessed, userRole]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setPage(0); // Reset to first page on filter change
    setIsProcessed(value === '' ? undefined : value === 'true');
  };

  // Render nothing or a loading indicator until the role is checked
  if (userRole !== 'ADMIN') {
    return <div>Loading or Access Denied...</div>;
  }

  return (
    <div className="admin-container">
      <h1>Admin - User Reports</h1>

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
