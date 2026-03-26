/**
 * 인앱 브라우저 감지 + 외부 브라우저 리다이렉트 유틸리티
 *
 * Google OAuth는 WebView에서 차단됨 (403: disallowed_useragent).
 * 카카오톡, 에브리타임 등 인앱 브라우저에서 접속 시
 * OAuth 시작 전에 외부 브라우저로 리다이렉트해야 함.
 */

type InAppType =
  | 'kakaotalk'
  | 'line'
  | 'android-other'
  | 'ios-other'
  | 'none';

interface InAppDetection {
  isInApp: boolean;
  type: InAppType;
  isIOS: boolean;
}

/**
 * User-Agent 기반으로 인앱 브라우저 감지
 */
export function detectInAppBrowser(): InAppDetection {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // 카카오톡 (Android/iOS 공통)
  if (/KAKAOTALK/i.test(ua)) {
    return { isInApp: true, type: 'kakaotalk', isIOS };
  }

  // 라인 (Android/iOS 공통)
  if (/Line\//i.test(ua)) {
    return { isInApp: true, type: 'line', isIOS };
  }

  // 기타 인앱 브라우저 감지
  const isOtherInApp =
    /FBAN|FBAV|FB_IAB|FB4A|FBIOS|FBSS|Instagram|NAVER\(inapp|everytimeapp|band\/|twitter|trill|DaumApps|DaumDevice\/mobile|BytedanceWebview|TikTok|snapchat|whale/i.test(
      ua,
    );

  // Android WebView 일반 감지 ("; wv)" 패턴)
  const isAndroidWebView = /; wv\)/i.test(ua);

  if (isOtherInApp || isAndroidWebView) {
    return {
      isInApp: true,
      type: isIOS ? 'ios-other' : 'android-other',
      isIOS,
    };
  }

  // iOS WKWebView 추가 감지: Safari UA 없이 iOS인 경우
  if (isIOS && !/Safari/i.test(ua)) {
    return { isInApp: true, type: 'ios-other', isIOS: true };
  }

  return { isInApp: false, type: 'none', isIOS };
}

/**
 * 인앱 브라우저에서 외부 브라우저로 리다이렉트 시도.
 *
 * @returns
 * - 'not-inapp': 인앱이 아님 → 정상 로그인 진행
 * - 'redirected': 외부 브라우저로 리다이렉트 시작됨
 * - 'ios-fallback': iOS 인앱 (카카오톡 제외) → 수동 안내 필요
 */
export function openInExternalBrowser(
  url: string,
): 'not-inapp' | 'redirected' | 'ios-fallback' {
  const { isInApp, type } = detectInAppBrowser();

  if (!isInApp) return 'not-inapp';

  switch (type) {
    case 'kakaotalk':
      // 카카오톡 자체 딥링크 (Android/iOS 공통, 비공식이지만 안정적)
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
      return 'redirected';

    case 'line':
      // 라인 공식 지원 쿼리파라미터
      window.location.href = `${url}${url.includes('?') ? '&' : '?'}openExternalBrowser=1`;
      return 'redirected';

    case 'android-other':
      // Android Intent URI → Chrome 우선, fallback으로 기본 브라우저
      window.location.href = `intent://${url.replace(/^https?:\/\//i, '')}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
      return 'redirected';

    case 'ios-other':
      // iOS는 프로그래밍적으로 Safari 강제 실행 불가 → 안내 필요
      return 'ios-fallback';

    default:
      return 'not-inapp';
  }
}

/**
 * iOS 폴백: URL 클립보드 복사 후 Safari 유도
 */
export async function copyUrlAndOpenSafari(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Clipboard API 실패 시 execCommand fallback
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  // x-web-search:// 로 Safari/검색 인터페이스 유도
  window.location.href = 'x-web-search://?';
  return true;
}
