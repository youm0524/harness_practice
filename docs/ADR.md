# Architecture Decision Records

## 철학
개인정보를 다루는 도구이므로 MVP의 최우선 가치는 로컬 우선, 예측 가능성, 사용자의 명시적 실행이다. 처음부터 범용 AI 추론을 넣기보다 테스트 가능한 규칙 기반 자동 채우기로 작동하는 최소 구현을 만든다. ApplyMate는 사용자를 대신해 판단하거나 제출하는 도구가 아니라, 반복 입력을 줄이는 보조 도구다.

---

### ADR-001: Chrome Extension Manifest V3 선택
**결정**: Chrome Extension Manifest V3 기반으로 구현한다.

**이유**: 지원서 입력은 브라우저 페이지 DOM 접근이 필요하고, MV3는 현재 Chrome 확장 프로그램의 표준이다. popup, options, content script, background service worker의 책임 분리가 제품 요구와 잘 맞는다.

**트레이드오프**: service worker 생명주기 제약 때문에 background에 장기 상태를 두지 않고 storage와 메시지 기반으로 설계해야 한다. 일부 디버깅도 일반 웹앱보다 번거롭다.

**구현 규칙**:
- background는 메시지 라우팅과 active tab 조작만 담당한다.
- 재시작되어도 잃으면 안 되는 상태를 background 메모리에 저장하지 않는다.
- 자동 채우기는 사용자의 popup 클릭에서 시작되어야 한다.

### ADR-002: React + TypeScript + Vite 선택
**결정**: popup/options UI는 React와 TypeScript로 만들고, 빌드는 Vite를 사용한다.

**이유**: 프로필 편집은 반복 섹션, 저장 상태, 오류 표시가 필요하다. TypeScript는 프로필 모델, 자동 채우기 결과, extension message payload의 계약을 안정적으로 유지하게 해준다. Vite는 MV3 번들 구성이 비교적 단순하고 빠르다.

**트레이드오프**: 순수 HTML보다 초기 설정이 늘어난다. Chrome Extension의 multi-entry 빌드 구성을 명시적으로 관리해야 한다.

**구현 규칙**:
- TypeScript strict mode를 유지한다.
- popup/options entry, background entry, content entry를 빌드 산출물에서 분리한다.
- UI 컴포넌트가 Chrome API에 직접 깊게 결합되지 않도록 storage/message helper를 둔다.

### ADR-003: chrome.storage.local 로컬 저장
**결정**: MVP의 프로필 데이터는 `chrome.storage.local`에 저장한다.

**이유**: 외부 서버 없이 동작하며 사용자의 개인정보가 브라우저 로컬에 남는다. MVP의 핵심 신뢰 약속인 "외부 전송 없음"과 맞는다.

**트레이드오프**: 기기간 동기화와 백업은 제공하지 않는다. 브라우저 프로필을 삭제하거나 확장 프로그램 데이터를 지우면 프로필도 사라질 수 있다.

**구현 규칙**:
- storage helper는 저장된 데이터가 없거나 깨져도 `createEmptyProfile()`로 복구한다.
- 저장 시 `updatedAt`을 갱신한다.
- content script는 `chrome.storage.local`에 직접 접근하지 않는다.
- 테스트에서는 Chrome storage mock을 사용한다.

### ADR-004: 규칙 기반 필드 매칭
**결정**: 라벨, placeholder, name, id, aria-label, 주변 텍스트를 정규화한 뒤 사전 정의된 alias와 비교하는 규칙 기반 매칭을 사용한다.

**이유**: 개인정보를 외부 모델에 보내지 않아도 되고, 테스트 가능한 결정적 동작을 만들 수 있다. 채용 지원서의 기본 정보 필드는 반복적인 표현이 많아 MVP에서는 규칙 기반 접근이 효율적이다.

**트레이드오프**: 사이트마다 표현이 다른 복잡한 문항은 일부 놓칠 수 있다. 자동 채우기 범위가 보수적이라 사용자가 직접 수정해야 하는 필드가 남는다.

**구현 규칙**:
- 매칭 로직은 DOM과 분리된 순수 함수로 유지한다.
- allowlist alias에 없는 필드는 채우지 않는다.
- 낮은 확신도의 match는 결과에서 제외한다.
- 빈 프로필 값은 자동 채우기 계획에 포함하지 않는다.
- 한 candidate에는 하나의 값만 배정한다.

### ADR-005: 명시적 실행 기반 자동 채우기
**결정**: 페이지 로드나 focus 이벤트에서 자동 채우기를 수행하지 않고, 사용자가 popup에서 버튼을 클릭했을 때만 실행한다.

**이유**: 개인정보 자동 입력은 사용자의 통제감과 안전성이 중요하다. 페이지에 들어가자마자 값을 넣으면 의도하지 않은 사이트나 잘못된 폼에 개인정보가 들어갈 수 있다.

**트레이드오프**: 사용자는 매 페이지에서 한 번 클릭해야 한다. 완전 자동화보다 마찰이 있지만, MVP에서는 안전성과 신뢰가 우선이다.

**구현 규칙**:
- content script는 로드 즉시 값을 입력하지 않는다.
- popup에서 `RUN_AUTOFILL` 메시지가 들어온 경우에만 plan을 적용한다.
- 자동 제출 버튼 클릭은 구현하지 않는다.

### ADR-006: 최소 권한 원칙
**결정**: MVP 권한은 `storage`, `activeTab`, 필요 시 `scripting`을 기본으로 한다.

**이유**: 확장 프로그램은 권한 요청 자체가 신뢰와 직결된다. 모든 사이트 접근 권한을 처음부터 요구하면 개인정보 도구로서 부담이 커진다.

**트레이드오프**: 일부 페이지에서는 content script 주입 방식에 추가 처리가 필요할 수 있다. 정적 content script를 쓰는 설정보다 구현이 약간 복잡해질 수 있다.

**구현 규칙**:
- broad host permission은 피한다.
- `<all_urls>`가 필요하다고 판단되면 문서와 코드에 이유를 남긴다.
- active tab을 찾지 못하거나 주입에 실패하면 popup에 명확한 오류를 반환한다.

### ADR-007: DOM 입력 이벤트 호환성
**결정**: 값을 설정한 뒤 `input`과 `change` 이벤트를 bubbling 가능하게 dispatch한다.

**이유**: 많은 채용 사이트가 React, Vue, Angular 같은 제어 컴포넌트를 사용한다. 단순히 DOM value만 바꾸면 앱 상태가 갱신되지 않을 수 있다.

**트레이드오프**: 모든 프레임워크와 커스텀 컴포넌트를 완벽히 지원하지는 못한다. select, date, custom combobox 같은 필드는 추가 처리가 필요할 수 있다.

**구현 규칙**:
- input, textarea, select 요소별 값 설정 방식을 분리한다.
- disabled, readonly, hidden, password, file, submit, button 필드는 스킵한다.
- 개별 필드 입력 실패는 결과에 기록하고 전체 실행은 가능한 범위에서 계속한다.

### ADR-008: Vitest 중심 테스트
**결정**: 필드 매칭, storage helper, message payload 타입 주변 로직은 Vitest로 테스트한다.

**이유**: 자동 채우기 품질은 매칭 규칙의 회귀 방지가 중요하다. 특히 개인정보를 잘못된 필드에 넣지 않는 테스트가 필요하다.

**트레이드오프**: 실제 브라우저 통합 테스트는 MVP 이후 Playwright 기반으로 확장한다. 초기에는 jsdom/fixture 기반 테스트가 실제 사이트의 모든 변형을 담지 못한다.

**구현 규칙**:
- 한국어/영어 alias fixture를 포함한다.
- 금지 input 타입과 낮은 확신도 스킵 테스트를 포함한다.
- storage는 빈 데이터, 정상 데이터, 깨진 데이터 복구를 테스트한다.
