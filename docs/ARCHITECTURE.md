# 아키텍처

## 시스템 개요
ApplyMate는 Manifest V3 Chrome Extension이다. UI는 popup과 options 페이지로 나뉘며, 현재 웹페이지의 DOM 접근은 content script가 담당한다. 자동 채우기 실행은 사용자의 popup 클릭에서 시작되고, background service worker가 active tab과 메시지를 중계한다. 프로필 데이터는 `chrome.storage.local`에만 저장한다.

## 디렉토리 구조
```text
src/
├── popup/             # extension popup 진입점과 자동 채우기 실행 UI
├── options/           # 사용자 프로필 관리 페이지
├── content/           # 현재 페이지 DOM 스캔 및 폼 입력
├── background/        # Manifest V3 service worker와 메시지 라우팅
├── components/        # React 공통 UI 컴포넌트
├── lib/               # storage, field matching, DOM candidate helper
├── types/             # TypeScript 타입 정의
└── test/              # 테스트 유틸리티와 fixture
```

## 주요 모듈 책임
| 모듈 | 책임 | 금지 |
|------|------|------|
| `src/options/` | 프로필 입력, 수정, 삭제, 저장 상태 표시 | 자동 채우기 DOM 조작 |
| `src/popup/` | 자동 채우기 실행 버튼, 결과 표시, options 이동 | 프로필 편집 전체 UI 중복 구현 |
| `src/background/` | active tab 조회, 메시지 라우팅, content script 실행 보조 | 장기 상태 저장 |
| `src/content/` | 페이지 필드 스캔, 값 입력, DOM 이벤트 발생 | `chrome.storage.local` 직접 접근 |
| `src/lib/storage.ts` | 프로필 로드/저장/초기화, 깨진 데이터 복구 | DOM 접근 |
| `src/lib/fieldMatcher.ts` | 후보 필드와 프로필을 받아 자동 채우기 계획 생성 | DOM 접근, Chrome API 접근 |
| `src/types/` | Profile, Autofill, Message 타입 계약 | 런타임 로직 |

## 런타임 경계
```text
options page
  └─ chrome.storage.local read/write

popup
  ├─ chrome.storage.local read
  └─ runtime message: RUN_AUTOFILL

background service worker
  ├─ tabs.query active tab
  ├─ tabs.sendMessage
  └─ 필요 시 scripting.executeScript

content script
  ├─ DOM scan
  ├─ AutofillPlan apply
  └─ result message response
```

## 데이터 흐름
### 프로필 저장
```text
사용자 정보 입력
→ options React form
→ UserProfile validation/normalization
→ lib/storage.ts
→ chrome.storage.local
```

### 자동 채우기
```text
popup 버튼 클릭
→ popup이 저장된 UserProfile 로드
→ background에 RUN_AUTOFILL 메시지 전송
→ background가 active tab content script에 요청 전달
→ content script가 FieldCandidate[] 생성
→ fieldMatcher가 AutofillPlan 생성
→ content script가 plan을 DOM에 적용
→ input/change 이벤트 dispatch
→ AutofillResult를 popup에 반환
```

## 타입 계약
핵심 타입은 다음 파일에 둔다.

- `src/types/profile.ts`
  - `PersonalInfo`
  - `Education`
  - `Credential`
  - `ProjectExperience`
  - `UserProfile`
- `src/types/autofill.ts`
  - `FieldCandidate`
  - `FieldMatch`
  - `AutofillPlan`
  - `AutofillResult`
- `src/types/messages.ts`
  - `RunAutofillRequest`
  - `RunAutofillResponse`
  - `ExtensionMessage`

메시지 payload에는 DOM 노드를 넣지 않는다. 직렬화 가능한 JSON 값만 사용한다.

`AutofillResult`는 UI가 상태를 명확히 보여줄 수 있도록 최소한 다음 정보를 포함한다.

- `status`: `success`, `partial`, `no-match`, `error` 중 하나
- `filledCount`
- `skippedCount`
- `failedCount`
- `matches`: popup에 표시할 수 있는 짧은 매칭 요약 배열
- `message`: 사용자에게 보여줄 수 있는 짧은 결과 문구

프로필 원문 값 전체를 결과에 싣지 않는다. popup 결과 목록에는 필드 라벨과 프로필 필드 이름 중심으로 표시한다.

## 필드 후보 생성
content script는 실제 DOM 요소를 아래 정보로 축약한다.

- 안정적인 selector 또는 내부 key
- `tagName`
- `type`
- `id`
- `name`
- 연결된 `label` 텍스트
- `placeholder`
- `aria-label`
- 가까운 wrapper의 텍스트 일부
- disabled/readonly/hidden 여부

후보 생성 단계에서 password, file, submit, button, reset, hidden 타입과 disabled/readonly 필드는 제외한다.

## 필드 매칭
- `fieldMatcher`는 DOM을 모르는 순수 함수다.
- 텍스트는 lower-case, 공백 정리, 특수문자 제거, 한영 alias 통합 방식으로 정규화한다.
- 매칭은 allowlist 기반이다. 알 수 없는 필드는 채우지 않는다.
- 후보 하나에 여러 alias가 걸리면 더 구체적인 필드를 우선한다. 예: `project title`은 일반 `name`보다 프로젝트 제목을 우선한다.
- profile 값이 비어 있으면 match를 만들지 않는다.

## 값 입력
content script는 plan을 적용할 때 다음 순서를 따른다.

1. selector/key로 DOM 요소를 다시 찾는다.
2. 여전히 입력 가능한 요소인지 확인한다.
3. `HTMLInputElement`, `HTMLTextAreaElement`, `HTMLSelectElement`에 맞게 값을 설정한다.
4. `input` 이벤트를 dispatch한다.
5. `change` 이벤트를 dispatch한다.
6. 성공/실패 결과를 누적한다.

React/Vue/Angular 제어 컴포넌트 호환성을 위해 이벤트는 bubbling 가능하게 발생시킨다.

## 상태 관리
- 저장된 프로필은 `chrome.storage.local`을 단일 영속 저장소로 사용한다.
- popup/options 내부의 임시 UI 상태는 React `useState`와 `useReducer`를 사용한다.
- 전역 상태 라이브러리는 MVP에서 사용하지 않는다.
- 자동 채우기 결과는 popup 세션 상태로만 유지하고 영속 저장하지 않는다.
- background service worker에는 재시작되어도 잃으면 안 되는 상태를 두지 않는다.

## 권한 모델
MVP는 최소 권한 원칙을 따른다.

- `storage`: 프로필 로컬 저장
- `activeTab`: 사용자가 popup을 누른 현재 탭에 한해 실행
- `scripting`: content script를 동적으로 주입해야 할 경우 사용

가능하면 broad host permission (`<all_urls>`)은 피한다. 구현상 정적 content script가 필요해 `<all_urls>`를 쓰게 되면 ADR 또는 코드 주석에 이유를 남긴다.

## 보안과 개인정보
- 사용자가 popup에서 명시적으로 실행한 경우에만 현재 탭에 자동 채우기를 수행한다.
- 외부 네트워크로 프로필 데이터를 전송하지 않는다.
- content script는 저장소에 직접 접근하지 않는다. 필요한 프로필 데이터는 popup/background 메시지로 전달한다.
- 저장 대상에서 고위험 민감정보를 제외한다.
- 오류 로그에 프로필 원문 값을 남기지 않는다. 필요하면 필드 이름과 상태만 기록한다.
- 자동 제출은 구현하지 않는다. 최종 제출은 항상 사이트의 기본 UI에서 사용자가 수행한다.

## 접근성과 UX 상태
- 모든 form input은 명시적인 label을 가져야 한다.
- popup의 primary action은 키보드 포커스로 접근 가능해야 한다.
- loading 상태에서는 실행 버튼을 disabled 처리해 중복 실행을 막는다.
- 오류 메시지는 색상만으로 구분하지 않고 텍스트와 아이콘을 함께 사용한다.
- 저장 성공 상태는 자동으로 사라져도 되지만, 마지막 저장 시간은 유지한다.
- 위험 행동인 전체 초기화는 확인 단계와 별도 시각 영역을 사용한다.

## 테스트 전략
- `fieldMatcher`는 한국어/영어 alias, 낮은 확신도 스킵, 빈 값 스킵, 중복 후보 처리를 단위 테스트한다.
- `storage`는 빈 저장소, 정상 저장소, 깨진 데이터 복구를 테스트한다.
- DOM 후보 생성은 fixture HTML로 금지 input 타입과 label/placeholder 추출을 테스트한다.
- popup/options는 MVP에서는 빌드와 핵심 helper 테스트를 우선하고, 복잡한 UI 회귀는 이후 Playwright로 확장한다.

## 빌드 산출물
Vite 빌드는 Chrome이 로드할 수 있는 extension 번들을 생성해야 한다.

- `manifest.json`
- popup HTML/JS/CSS
- options HTML/JS/CSS
- background service worker JS
- content script JS

`npm run build` 결과물을 Chrome의 "Load unpacked"로 불러올 수 있어야 한다.
