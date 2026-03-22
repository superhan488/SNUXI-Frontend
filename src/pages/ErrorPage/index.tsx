import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    navigate('/'); // Redirects to the base main page
  };

  return (
    <div className="error-page-container">
      <div className="error-content">
        <h1>ERROR!</h1>
        {/* Dynamic error message if provided */}
        {errorMessage !== '알 수 없는 오류가 발생했습니다.' && (
          <p className="error-message">{errorMessage}</p>
        )}
        {/* Static messages as requested */}
        <p>로그인은 @snu.ac.kr 도메인만 지원됩니다</p>
        <p>정지된 유저는 정지가 풀릴 때까지 서비스 이용이 불가합니다</p>
        <button onClick={handleGoHome} className="home-button">
          홈으로
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
