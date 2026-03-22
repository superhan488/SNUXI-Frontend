# SNUXI - 서울대 학내 택시팟 모집 서비스  
서울대 인근 지역에서 택시를 함께 탑승할 학우들을 모집해보세요!  
  
**[🔗 배포 링크](https://snuxi.com)**  
  
**[GitHub Link]**  
  
Server : https://github.com/wafflestudio/23-5-team3-server  
Client : https://github.com/wafflestudio/23-5-team3-web  
  
## 목차  
- **프로젝트 개요**  
- **아키텍처 구조**  
- **주요 기능**  
- **기술적 의사결정**  

## 프로젝트 개요  
### 🚘 SNUXI 서비스  
택시를 함께 탈 서울대학교 학우들을 모집하는 서비스입니다.  
학교 메일 인증으로 인증된 구성원들과 함께 안전하고 경제적으로 등하교길을 이용하세요!

### 🗓️ 기간  
2025.12 ~ 2026.02  
  
### 👩🏻‍💻 개발자
<br />

| [김기환(BE)](https://github.com/LOV-ING-U) | [김용현(BE)](https://github.com/Mined2022) | [나규하(FE)](https://github.com/Daniel-Na118) | [이유리(BE)](https://github.com/colswap) | [이정연(FE)](https://github.com/jylee05) |
| :---: | :---: | :---: | :---: | :---: |
| <a href="https://github.com/LOV-ING-U"><img src="https://avatars.githubusercontent.com/LOV-ING-U" width="150px"></a> | <a href="https://github.com/Mined2022"><img src="https://avatars.githubusercontent.com/Mined2022" width="150px"></a> | <a href="https://github.com/Daniel-Na118"><img src="https://avatars.githubusercontent.com/Daniel-Na118" width="150px"></a> | <a href="https://github.com/colswap"><img src="https://avatars.githubusercontent.com/colswap" width="150px"></a> | <a href="https://github.com/jylee05"><img src="https://avatars.githubusercontent.com/jylee05" width="150px"></a> |

<br />
  
### 🧱 Tech Stack  
#### Front-End  
<p>
    <img alt="React"  src="https://img.shields.io/badge/-ReactJs-61DAFB?logo=react&logoColor=white&style=for-the-badge">
    <img alt="TypeScript"  src="https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square">
    <img alt="VITE"  src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white">
    <img alt="AWS"  src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white">
</p>  

#### Back-End  
<p>
    <img alt="spring boot"  src="https://img.shields.io/badge/SpringBoot-6DB33F?style=for-the-badge&logo=SpringBoot&logoColor=white">
    <img alt="docker"  src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white">
    <img alt="docker compose" src="https://img.shields.io/badge/docker_compose-2496ED?style=for-the-badge&logo=docker&logoColor=white">
    <img alt="mysql"  src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=MySQL&logoColor=white">
    <img alt="firebase" src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white">
    <img alt="AWS" src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white">
    <img alt="Nginx"  src="https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white&style=for-the-badge">
</p>  

### 협업 전략  
#### Slack, Notion, Swagger 기반 API 명세 공유 및 아키텍처 구조 협의  
https://www.notion.so/API-2ffe04be1b438100888be0685a7158ba?source=copy_link  
  
#### 주 단위 스프린트, 커밋 컨벤션 규칙 및 Git, GitHub를 통한 PR 단위 코드 리뷰  
https://api.snuxi.com/swagger-ui/index.html  
  
## 아키텍처 구조(FE)
*   **컴포넌트 기반 구조 (React)**: 재사용 가능한 UI 컴포넌트들을 중심으로 애플리케이션을 구축하여 유지보수성과 확장성을 높였습니다. 페이지 단위로 컴포넌트를 구성하고, 각 컴포넌트의 책임을 명확히 분리합니다.
*   **상태 관리 (Jotai)**: 전역 상태 관리를 위해 Jotai 라이브러리를 사용합니다. Atom 기반의 미니멀한 접근 방식으로, 필요한 상태만 효율적으로 관리하고 컴포넌트 간의 불필요한 리렌더링을 최소화합니다.
*   **클라이언트 측 라우팅 (React Router DOM)**: 단일 페이지 애플리케이션(SPA)의 내비게이션을 위해 React Router DOM을 활용합니다. URL과 UI의 동기화를 통해 사용자에게 매끄러운 페이지 전환 경험을 제공합니다.
*   **API 통신 계층 (Axios)**: 백엔드 API와의 효율적인 통신을 위해 Axios를 사용합니다. 요청/응답 인터셉터를 활용하여 인증 토큰 관리, 에러 처리 등의 공통 로직을 중앙에서 관리합니다.
*   **모듈화된 디렉토리 구조**:
    *   `src/api`: 백엔드 API와의 통신을 위한 함수들을 정의합니다. (e.g., `auth.ts`, `room.ts`, `admin.ts`)
    *   `src/common`: 공통으로 사용되는 상수, 유틸리티 함수, Jotai 아톰 등을 포함합니다.
    *   `src/components`: 여러 페이지에서 재사용되는 UI 컴포넌트들을 모아둡니다.
    *   `src/pages`: 각 서비스 페이지를 구성하는 컴포넌트들을 포함하며, 라우팅 단위의 엔트리 포인트입니다.
    *   `src/router`: React Router DOM을 사용하여 애플리케이션의 라우팅 설정을 정의합니다.
    *   `src/types`: TypeScript 타입 정의를 중앙에서 관리합니다.
    
## 주요 기능  
#### 1. 약관 동의와 학교 메일 인증 절차로 안전하게!  
OAuth2 기반 학교 메일 로그인을 통해 인증된 구성원들끼리 택시팟을 이용할 수 있어요.
   
#### 2. 택시팟 생성은 랜드마크 기반 출발, 도착지 지정으로 간편하게!  
학교 안, 서울대입구역, 낙성대역, 녹두까지! 학우들이 자주 사용하는 대표 지역으로 빠르게 이용해보세요.  
  
#### 3. 실시간 채팅으로 보다 빠르게!  
WebSocket 기술을 기반으로 빠른 실시간 텍스트 채팅을 지원해요.  
  
#### 4. 부적절한 채팅은 No! 신고 기능으로 채팅방을 클린하게!  
운영자가 채팅 내역을 모두 볼 수 있어요! 목적에 맞는 서비스 이용을 부탁드려요.  
  
#### 5. 택시 호출은 카카오 택시로 간편하게!  
애플리케이션 내부에서, 곧바로 출발지와 목적지가 입력된 카카오 택시 호출 어플로 이동할 수 있어요.  
  
## 기술적 의사결정  
1.  **React.js 및 TypeScript 채택**:
    *   **React.js**: 선언적이고 컴포넌트 기반의 UI 개발을 가능하게 하여, 복잡한 UI를 효율적으로 구축하고 유지보수하는 데 용이합니다. 활발한 커뮤니티와 풍부한 생태계를 갖추고 있습니다.
    *   **TypeScript**: 정적 타입 검사를 통해 개발 과정에서 발생할 수 있는 잠재적인 오류를 미리 방지하고, 코드의 가독성과 안정성을 향상시킵니다. 대규모 프로젝트 협업에 필수적이라고 판단했습니다.

2.  **Vite를 빌드 도구로 선택한 이유**:
    *   기존 Webpack 대비 매우 빠른 개발 서버 구동 및 HMR(Hot Module Replacement)을 제공하여 개발 생산성을 극대화합니다. ES Module 기반의 빌드 시스템으로 효율적인 번들링을 수행합니다.

3.  **Jotai를 상태 관리 라이브러리로 선택한 이유**:
    *   Redux와 같은 복잡한 보일러플레이트 없이 미니멀하고 직관적인 API를 제공합니다. Atom 기반으로 필요한 상태만 구독하여 컴포넌트의 불필요한 리렌더링을 최소화하고 성능을 최적화합니다. 특히, 작은 규모의 프로젝트에서 빠른 도입과 쉬운 학습 곡선을 가집니다.

4.  **클라이언트 측 라우팅에 React Router DOM 사용**:
    *   SPA의 핵심인 URL 기반의 내비게이션을 선언적으로 관리할 수 있게 해줍니다. 동적 라우팅, 중첩 라우팅 등 다양한 라우팅 시나리오를 유연하게 처리할 수 있어 사용자 경험을 향상시킵니다.

5.  **Axios를 API 클라이언트로 활용**:
    *   Promise 기반의 HTTP 클라이언트로, 간결한 API와 강력한 기능을 제공합니다. 요청/응답 인터셉터를 통해 토큰 기반 인증, 에러 처리(예: 401 Unauthorized 시 로그인 페이지로 리다이렉션) 등의 공통 로직을 효율적으로 구현하여 API 통신 계층의 일관성을 유지합니다.
