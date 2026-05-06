# 아키텍처

## 디렉토리 구조
```text
src/
├── popup/             # extension popup 진입점과 자동 채우기 실행 UI
├── options/           # 사용자 프로필 관리 페이지
├── content/           # 현재 페이지 DOM 스캔 및 폼 입력
├── background/        # Manifest V3 service worker와 메시지 라우팅
├── components/        # React 공통 UI 컴포넌트
├── lib/               # storage, field matching, messaging helper
├── types/             # TypeScript 타입 정의
└── test/              # 테스트 유틸리티와 fixture
```

## 패턴
- Chrome Extension Manifest V3를 기준으로 구현한다.
- popup/options는 React Client UI로 작성한다.
- content script는 DOM 접근과 입력 이벤트 발생만 담당한다.
- background service worker는 popup과 content script 사이의 메시지를 중계하고 탭 권한을 다룬다.
- 필드 매칭 로직은 DOM과 분리된 순수 함수로 작성해 Vitest에서 검증 가능하게 한다.

## 데이터 흐름
```text
사용자 정보 입력
→ options React form
→ lib/storage.ts
→ chrome.storage.local

자동 채우기 실행
→ popup 버튼 클릭
→ background service worker
→ active tab content script
→ 페이지 폼 필드 스캔
→ lib/fieldMatcher.ts 규칙 기반 매칭
→ 값 입력 및 input/change 이벤트 dispatch
→ popup에 결과 반환
```

## 상태 관리
- 저장된 프로필은 `chrome.storage.local`을 단일 영속 저장소로 사용한다.
- popup/options 내부의 임시 UI 상태는 React `useState`와 `useReducer`를 사용한다.
- 전역 상태 라이브러리는 MVP에서 사용하지 않는다.
- 자동 채우기 결과는 popup 세션 상태로만 유지하고 영속 저장하지 않는다.

## 보안 경계
- 사용자가 popup에서 명시적으로 실행한 경우에만 현재 탭에 자동 채우기를 수행한다.
- 외부 네트워크로 프로필 데이터를 전송하지 않는다.
- content script는 저장소에 직접 접근하지 않는다. 필요한 프로필 데이터는 popup/background 메시지로 전달한다.
- 저장 대상에서 고위험 민감정보를 제외한다.
