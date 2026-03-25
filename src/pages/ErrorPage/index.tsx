import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../api/constants';
import './ErrorPage.css';

const ErrorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(
    '알 수 없는 오류가 발생했습니다.'
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const messageParam = params.get('message');

    if (messageParam) {
      setErrorMessage(decodeURIComponent(messageParam));
      // Clear the message query parameter from the URL
      params.delete('message');
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [location.search, navigate]); // Add navigate to dependencies

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLoginWithDifferentEmail = () => {
    const uri = encodeURIComponent(window.location.origin);
    window.location.href = `${BACKEND_URL}/login?redirect_uri=${uri}`;
  };

  return (
    <div className="error-page-container">
      <div className="error-content">
        <h1>ERROR!</h1>
        {errorMessage !== '알 수 없는 오류가 발생했습니다.' && (
          <p className="error-message">{errorMessage}</p>
        )}
        <p>로그인은 @snu.ac.kr 도메인만 지원됩니다</p>
        <p>정지된 유저는 정지가 풀릴 때까지 서비스 이용이 불가합니다</p>
        <button onClick={handleLoginWithDifferentEmail} className="home-button">
          다른 계정으로 로그인
        </button>
        <button onClick={handleGoHome} className="home-button secondary">
          홈으로
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
