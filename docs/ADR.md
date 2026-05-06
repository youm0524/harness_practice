# Architecture Decision Records

## 철학
개인정보를 다루는 도구이므로 MVP의 최우선 가치는 로컬 우선, 예측 가능성, 사용자의 명시적 실행이다. 처음부터 범용 AI 추론을 넣기보다 테스트 가능한 규칙 기반 자동 채우기로 작동하는 최소 구현을 만든다.

---

### ADR-001: Chrome Extension Manifest V3 선택
**결정**: Chrome Extension Manifest V3 기반으로 구현한다.
**이유**: 지원서 입력은 브라우저 페이지 DOM 접근이 필요하고, MV3는 현재 Chrome 확장 프로그램의 표준이다.
**트레이드오프**: service worker 생명주기 제약 때문에 background에 장기 상태를 두지 않고 storage와 메시지 기반으로 설계해야 한다.

### ADR-002: React + TypeScript + Vite 선택
**결정**: popup/options UI는 React와 TypeScript로 만들고, 빌드는 Vite를 사용한다.
**이유**: 폼 편집 UI와 반복 섹션 관리가 필요하며, TypeScript 타입으로 개인정보 모델과 메시지 계약을 안정적으로 유지할 수 있다.
**트레이드오프**: 순수 HTML보다 초기 설정이 늘어나지만, 이후 프로필 섹션 확장과 테스트가 쉬워진다.

### ADR-003: chrome.storage.local 로컬 저장
**결정**: MVP의 프로필 데이터는 `chrome.storage.local`에 저장한다.
**이유**: 외부 서버 없이 동작하며 사용자의 개인정보가 브라우저 로컬에 남는다.
**트레이드오프**: 기기간 동기화와 백업은 제공하지 않는다.

### ADR-004: 규칙 기반 필드 매칭
**결정**: 라벨, placeholder, name, id, aria-label, 주변 텍스트를 정규화한 뒤 사전 정의된 alias와 비교하는 규칙 기반 매칭을 사용한다.
**이유**: 개인정보를 외부 모델에 보내지 않아도 되고, 테스트 가능한 결정적 동작을 만들 수 있다.
**트레이드오프**: 사이트마다 표현이 다른 복잡한 문항은 일부 놓칠 수 있다. MVP에서는 안전한 자동 채우기를 우선한다.

### ADR-005: Vitest 중심 테스트
**결정**: 필드 매칭, storage helper, message payload 타입 주변 로직은 Vitest로 테스트한다.
**이유**: 자동 채우기 품질은 매칭 규칙의 회귀 방지가 중요하다.
**트레이드오프**: 실제 브라우저 통합 테스트는 MVP 이후 Playwright 기반으로 확장한다.
