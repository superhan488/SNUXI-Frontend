import { useSearchParams } from 'react-router-dom';
import { submitTermsAgreement } from '../../api/auth';
import { BACKEND_URL } from '../../api/constants';

const Terms = () => {
  const [searchParams] = useSearchParams();

  // URL 쿼리스트링에서 token 파싱
  const token = searchParams.get('token');

  // token이 없으면 read-only 모드 (마이페이지에서 접근)

  const handleAgree = async () => {
    if (!token) return;

    try {
      // 약관 동의 API 호출
      await submitTermsAgreement(token);

      // [핵심] 페이지를 강제로 새로고침하여 메인으로 이동
      // 앱이 재실행되면서 서버에서 '내 정보(로그인 상태)'를 다시 받아옵니다.
      window.location.href = '/';
    } catch (error) {
      console.error('약관 동의 실패:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleDisagree = () => {
    // 동의 거부 시 로그아웃 처리
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);

    // 백엔드 로그아웃 엔드포인트로 리다이렉트
    window.location.href = `${BACKEND_URL}/logout?redirect_uri=${encodedUri}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        backgroundColor: '#ffffff',
      }}
    >
      <h1 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#333' }}>
        서비스 이용 약관 동의
      </h1>

      {/* 약관 내용 스크롤 박스 */}
      <div
        style={{
          margin: '0 0 30px 0',
          border: '1px solid #ddd',
          padding: '25px',
          width: '100%',
          maxWidth: '600px',
          height: '400px', // 높이 확보
          overflowY: 'auto', // 스크롤 활성화
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          textAlign: 'left', // 텍스트 좌측 정렬
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#555',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', color: '#000', marginBottom: '10px' }}>
          SNUXI 서비스 이용약관
        </h2>

        <h3
          style={{
            fontSize: '1rem',
            color: '#333',
            marginTop: '20px',
            marginBottom: '8px',
          }}
        >
          제1장 총칙
        </h3>
        <p>
          <strong>제1조 (목적)</strong>
          <br />본 약관은 서울대학교 택시 동승 매칭 서비스 SNUXI(이하 "SNUXI")가
          제공하는 관련 제반 서비스의 이용과 관련하여 회원과 SNUXI 사이의
          권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
        </p>
        <p>
          <strong>제2조 (정의)</strong>
          <br />이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
            <li>
              "서비스"라 함은 구현되는 단말기(PC, 스마트폰 등)와 상관없이 회원이
              이용할 수 있는 SNUXI 관련 제반 서비스를 의미합니다.
            </li>
            <li>
              "회원"이라 함은 SNUXI의 서비스에 접속하여 본 약관에 따라
              이용계약을 체결하고 서울대학교 구성원 인증을 완료하여 서비스를
              이용하는 자를 의미합니다.
            </li>
            <li>
              "택시팟(또는 팟)"이라 함은 서비스 내에서 특정 출발지, 목적지, 출발
              시간을 공유하여 택시를 함께 탈 사용자를 모집하는 모임 및 해당
              게시물을 의미합니다.
            </li>
            <li>
              "방장"이라 함은 택시팟을 최초로 생성하여 모집 인원 확정 및 카카오
              택시 호출 연동 등의 권한을 가진 회원을 의미합니다.
            </li>
            <li>
              "게시물"이라 함은 회원이 서비스를 이용함에 있어 서비스 내에 게시한
              문자, 문서, 그림, 채팅 메시지, 링크, 파일 등 모든 정보나 자료를
              의미합니다.
            </li>
          </ul>
        </p>

        <h3
          style={{
            fontSize: '1rem',
            color: '#333',
            marginTop: '20px',
            marginBottom: '8px',
          }}
        >
          제2장 회원 가입 및 관리
        </h3>
        <p>
          <strong>제3조 (회원의 종류 및 가입)</strong>
          <br />① SNUXI는 서울대학교 구성원을 위한 폐쇄형 서비스로, 가입을
          원하는 자는 반드시 서울대학교 공식 이메일(@snu.ac.kr)을 통한 구글
          OAuth2 인증을 완료해야 합니다.
          <br />② 회원은 서비스가 정한 이용약관 및 개인정보 처리방침에
          동의함으로써 이용계약을 신청하며, SNUXI가 이를 승낙함으로써 가입이
          완료됩니다.
          <br />③ 가입 시 원활한 서비스 이용을 위해 별도의 인증 토큰(JWT)이
          발급되며, 회원은 이를 안전하게 관리해야 합니다.
          <br />④ SNUXI는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지
          않거나 사후에 이용계약을 해지할 수 있습니다.
          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
            <li>타인의 이메일 계정을 도용하여 인증을 시도한 경우</li>
            <li>
              과거 본 약관 위반으로 인해 회원 자격을 상실한 적이 있는 경우
            </li>
            <li>
              서비스의 운영 정책이나 공서양속에 반하는 목적으로 신청한 경우
            </li>
          </ul>
        </p>
        <p>
          <strong>제4조 (회원의 탈퇴 및 자격 상실)</strong>
          <br />① 회원은 언제든지 서비스 내 설정 메뉴를 통해 회원 탈퇴를 요청할
          수 있으며, SNUXI는 이를 즉시 처리합니다.
          <br />② 회원 탈퇴 시 다음의 조치가 이루어집니다.
          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
            <li>참여 중인 택시팟에서의 자동 퇴장</li>
            <li>
              푸시 알림 수신을 위해 등록된 기기 정보(FCM Token)의 즉시 삭제
            </li>
            <li>개인정보 처리방침에 따른 개인 식별 데이터의 파기</li>
          </ul>
          ③ 단, 서비스의 연속성 및 다른 회원의 이용 편의를 위해 회원이 작성한
          채팅 메시지는 삭제되지 않으며, '탈퇴한 사용자'로 익명화 처리되어
          보관됩니다.
          <br />④ 회원이 제11조(회원의 의무)를 위반한 경우, SNUXI는 회원 자격을
          정지하거나 강제 탈퇴 시킬 수 있습니다.
        </p>

        <h3
          style={{
            fontSize: '1rem',
            color: '#333',
            marginTop: '20px',
            marginBottom: '8px',
          }}
        >
          제3장 서비스 이용
        </h3>
        <p>
          <strong>제5조 (서비스의 내용)</strong>
          <br />
          SNUXI는 회원에게 다음과 같은 서비스를 제공합니다.
          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
            <li>
              택시팟 생성 및 참여: 랜드마크 기반의 출발지/목적지 설정 및
              시간대별 모집 기능
            </li>
            <li>팟 검색 및 필터링: 현재 모집 중인 팟의 실시간 정보 제공</li>
            <li>실시간 채팅: 팟 참여자 간의 소통 및 정보 공유 기능</li>
            <li>
              푸시 알림: 팟 모집 완료, 출발 전 리마인더 등 사용자 맞춤형 알림
              서비스
            </li>
            <li>
              외부 서비스 연동: 방장에 의한 카카오 택시 호출 딥링크 생성 지원
            </li>
          </ul>
        </p>
        <p>
          <strong>제6조 (서비스 이용 규칙 및 제한)</strong>
          <br />① 서비스의 신뢰성을 위해 회원은 동시에 2개 이상의 택시팟에
          참여하거나 관여할 수 없습니다.
          <br />② 택시팟의 인원은 최소 2명에서 최대 4명으로 제한되며, 방장은
          모집 완료 후 팟을 잠금(Lock) 처리할 수 있습니다.
          <br />③ SNUXI는 서비스 운영상 필요한 경우 정기 점검을 실시할 수
          있으며, 이 경우 사전 공지 후 서비스 이용을 일시 제한할 수 있습니다.
        </p>
        <p>
          <strong>제7조 (서비스의 중단)</strong>
          <br />① SNUXI는 천재지변, 서버 점검, 통신 장애 등 부득이한 사유가 있는
          경우 서비스 제공을 일시 중단할 수 있습니다.
          <br />② 서비스의 기술적 결함이나 시스템 오류로 인해 발생한 손해에
          대하여 SNUXI는 제14조(면책)에 따라 책임을 지지 않습니다.
        </p>

        <h3
          style={{
            fontSize: '1rem',
            color: '#333',
            marginTop: '20px',
            marginBottom: '8px',
          }}
        >
          제4장 권리와 의무
        </h3>
        <p>
          <strong>제8조 (개인정보보호)</strong>
          <br />
          SNUXI는 회원의 개인정보를 보호하기 위해 노력하며, 개인정보의 수집,
          이용, 보관에 관한 사항은 별도로 게시하는 "개인정보 처리방침"에
          따릅니다.
        </p>
        <p>
          <strong>제9조 (SNUXI의 의무)</strong>
          <br />① SNUXI는 본 약관이 금지하거나 공서양속에 반하는 행위를 하지
          않으며, 지속적이고 안정적인 서비스 제공을 위해 최선을 다합니다.
          <br />② SNUXI는 이용자가 안전하게 서비스를 이용할 수 있도록 보안
          시스템을 구축하고 운영합니다.
        </p>
        <p>
          <strong>제10조 (광고 및 제휴)</strong>
          <br />
          SNUXI는 서비스 운영 비용 충당을 위해 서비스 내에 광고를 게재하거나
          학내외 기관과 제휴할 수 있습니다.
        </p>
        <p>
          <strong>제11조 (회원의 의무)</strong>
          <br />
          회원은 다음 각 호의 행위를 하여서는 안 됩니다.
          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
            <li>
              비매너 행위: 정당한 사유 없이 약속 시간에 나타나지 않는
              행위(No-Show), 동승 거부, 결제 회피 등
            </li>
            <li>
              게시물/채팅 위반: 타인에 대한 욕설, 비하, 성희롱, 도배, 허위 사실
              유포 등
            </li>
            <li>
              운영 방해: 서비스 서버에 대한 공격, 허가되지 않은 방식의 데이터
              수집, 관리자 사칭 등
            </li>
            <li>
              영리 목적: 택시팟 모집 외에 영리 활동, 홍보, 정치적 선전 목적으로
              서비스를 이용하는 행위
            </li>
            <li>계정 공유: 자신의 계정을 타인에게 대여하거나 공유하는 행위</li>
          </ul>
        </p>

        <h3
          style={{
            fontSize: '1rem',
            color: '#333',
            marginTop: '20px',
            marginBottom: '8px',
          }}
        >
          제5장 커뮤니티 관리 및 책임
        </h3>
        <p>
          <strong>제12조 (게시물의 권리와 책임)</strong>
          <br />① 회원이 게시한 채팅 메시지 및 정보의 저작권은 해당 회원에게
          귀속됩니다.
          <br />② SNUXI는 서비스 운영 및 홍보를 위해 회원의 게시물을 익명화하여
          활용할 수 있습니다.
          <br />③ 타인의 권리를 침해하거나 부적절한 내용을 담은 게시물은 신고
          접수 시 운영자에 의해 삭제되거나 접근이 제한될 수 있습니다.
        </p>
        <p>
          <strong>제13조 (신고 및 이용 제한)</strong>
          <br />① 회원은 부적절한 행위를 하는 다른 회원을 서비스 내 기능을 통해
          신고할 수 있습니다.
          <br />② 신고 접수 시 SNUXI 운영진은 사실 관계 확인을 위해 해당 시점의
          채팅 로그 및 활동 기록을 열람할 수 있습니다.
          <br />③ 위반 사항이 확인될 경우, 내부 운영 정책에 따라 서비스 이용
          정지(일시적/영구적) 등의 제재가 가해집니다.
        </p>

        <h3
          style={{
            fontSize: '1rem',
            color: '#333',
            marginTop: '20px',
            marginBottom: '8px',
          }}
        >
          제6장 손해배상 및 면책
        </h3>
        <p>
          <strong>제14조 (면책조항)</strong>
          <br />① 플랫폼의 한계: SNUXI는 사용자와 사용자 간의 매칭을 돕는 정보
          제공 플랫폼일 뿐입니다. 실제 택시 동승 과정에서 발생하는 다음 각 호의
          문제에 대해 SNUXI는 어떠한 책임도 지지 않습니다.
          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
            <li>사용자 간의 택시 요금 정산 및 비용 분담 관련 분쟁</li>
            <li>동승 중 발생한 교통사고 및 신체적/재산적 피해</li>
            <li>사용자 간의 폭행, 절도 등 형사적 사건</li>
          </ul>
          ② 불가항력: SNUXI는 천재지변, 전쟁, 국가 비상사태, 기간통신사업자의
          서비스 중단 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이
          면제됩니다.
          <br />③ 사용자 귀책: 회원의 기기 관리 소홀(비밀번호 유출 등)이나 본
          약관의 의무 위반으로 인해 발생한 손해에 대해 SNUXI는 책임을 지지
          않습니다.
        </p>

        <h3
          style={{
            fontSize: '1rem',
            color: '#333',
            marginTop: '20px',
            marginBottom: '8px',
          }}
        >
          제7장 기타
        </h3>
        <p>
          <strong>제15조 (약관의 개정)</strong>
          <br />① SNUXI는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수
          있습니다.
          <br />② 약관 개정 시 적용 일자 7일 전부터 서비스 내에 공지하며, 회원이
          적용 일자까지 거부 의사를 표시하지 않으면 개정된 약관에 동의한 것으로
          간주합니다.
        </p>
        <p>
          <strong>제16조 (준거법 및 재판관할)</strong>
          <br />① 본 약관은 대한민국 법령에 의하여 규정되고 이행됩니다.
          <br />② 서비스 이용과 관련하여 SNUXI와 회원 간에 발생한 분쟁에
          대해서는 민사소송법상의 관할 법원을 제1심 합의 법원으로 합니다.
        </p>

        <p
          style={{ marginTop: '30px', textAlign: 'center', fontWeight: 'bold' }}
        >
          부칙
          <br />본 약관은 2026년 2월 6일부터 시행합니다.
        </p>
      </div>

      {token && (
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={handleAgree}
            style={{
              padding: '12px 24px',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = '#0056b3')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = '#007bff')
            }
          >
            동의하고 시작하기
          </button>
          <button
            onClick={handleDisagree}
            style={{
              padding: '12px 24px',
              cursor: 'pointer',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = '#5a6268')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = '#6c757d')
            }
          >
            동의하지 않음 (로그아웃)
          </button>
        </div>
      )}
    </div>
  );
};

export default Terms;
