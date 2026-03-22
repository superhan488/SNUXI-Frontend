import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
// 타입 충돌 방지를 위해 이름 변경
import type { ReportDetail as ReportDetailType } from '../../api/admin';
import {
  getReportById,
  markReportAsProcessed,
  suspendUser,
} from '../../api/admin';
import { userRoleAtom } from '../../common/user';
import './ReportDetail.css';

const ReportDetail = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [userRole] = useAtom(userRoleAtom);

  // report는 초기에 null 상태입니다.
  const [report, setReport] = useState<ReportDetailType | null>(null);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userRole && userRole !== 'ADMIN') {
      alert('You do not have permission to access this page.');
      navigate('/');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'ADMIN' && reportId) {
      const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await getReportById(parseInt(reportId, 10));
          setReport(response);
        } catch (err: unknown) {
          if (isAxiosError(err) && err.response?.status === 403) {
            setError('You do not have permission to view this page.');
          } else {
            setError('Error fetching report details.');
          }
          console.error('Error fetching report:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    } else {
      setLoading(false);
    }
  }, [reportId, userRole]);

  const handleMarkAsProcessed = async () => {
    if (!report || actionLoading) return;
    setActionLoading(true);
    try {
      await markReportAsProcessed(report.id);
      setReport({ ...report, isProcessed: true });
      alert('Report marked as processed.');
    } catch (err) {
      alert('Failed to mark report as processed.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!report || actionLoading) return;
    const daysStr = prompt('정지 기간을 입력하세요 (일 단위):', '7'); // Prompt for days
    if (daysStr === null || daysStr.trim() === '') {
      return; // User cancelled or entered empty string
    }
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days <= 0) {
      alert('유효한 정지 기간을 입력해야 합니다.');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to suspend user ${report.reportedEmail} for ${days} days?`
      )
    ) {
      setActionLoading(true);
      try {
        const responseMessage = await suspendUser(report.reportedUserId, days); // Pass days
        alert(
          `User ${report.reportedEmail} suspension initiated. Server message: ${responseMessage}` // Use string response
        );
      } catch (err) {
        alert('Failed to suspend user.');
        console.error(err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (userRole !== 'ADMIN') {
    return (
      <div className="report-detail-container">Loading or Access Denied...</div>
    );
  }

  // ▼▼▼ [핵심 수정] 이 부분이 없으면 아래쪽 return에서 에러가 납니다! ▼▼▼
  // report가 null이면 로딩 화면을 보여주고 함수를 종료합니다.
  // 이 코드를 지나가면 TypeScript는 report가 null이 아님을 확신하게 됩니다.
  if (!report) {
    return (
      <div className="report-detail-container">Loading report data...</div>
    );
  }
  // ▲▲▲ 수정 끝 ▲▲▲

  return (
    <div className="report-detail-container">
      <Link to="/admin" className="back-link">
        &larr; Back to Reports
      </Link>
      <h1>Report #{report.id}</h1>

      <div className="report-actions">
        <button
          className="action-button"
          onClick={handleMarkAsProcessed}
          disabled={report.isProcessed || actionLoading}
        >
          {actionLoading ? 'Processing...' : 'Mark as Processed'}
        </button>
        <button
          className="action-button suspend"
          onClick={handleSuspendUser}
          disabled={actionLoading}
        >
          {actionLoading ? 'Suspending...' : 'Suspend User'}
        </button>
      </div>

      <div className="report-info-grid">
        <div className="info-item">
          <strong>ID:</strong> {report.id}
        </div>
        <div className="info-item">
          <strong>Status:</strong>
          <span
            className={`status ${report.isProcessed ? 'processed' : 'unprocessed'}`}
          >
            {report.isProcessed ? 'Processed' : 'Unprocessed'}
          </span>
        </div>
        <div className="info-item">
          <strong>Reason:</strong> {report.reason}
        </div>
        <div className="info-item">
          <strong>Reported At:</strong>{' '}
          {new Date(report.reportedAt).toLocaleString()}
        </div>
        <div className="info-item">
          <strong>Reporter:</strong> {report.reporterEmail} (
          {report.reporterUserId})
        </div>
        <div className="info-item">
          <strong>Reported User:</strong> {report.reportedEmail} (
          {report.reportedUserId})
        </div>
      </div>

      <h2>Chat Logs</h2>
      <div className="chat-logs">
        {report.chatLogs.map((log) => (
          <div key={log.id} className="chat-log-item">
            <span className="log-username">
              {log.username} ({log.senderId}):
            </span>
            <p className="log-text">{log.text}</p>
            <span className="log-time">
              {new Date(log.datetimeSendAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportDetail;
