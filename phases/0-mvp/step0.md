# Step 0: extension-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 제품 의도와 아키텍처를 파악하라:

- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/docs/UI_GUIDE.md`
- `/AGENT.md`

## 작업

Chrome Extension Manifest V3 기반 ApplyMate 앱의 최소 프로젝트 뼈대를 만든다.

필수 생성/수정 범위:

- `package.json`
- `index.html` 또는 Vite 빌드에 필요한 HTML entry 파일
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json` 필요 시 생성
- `tailwind.config.js`
- `postcss.config.js`
- `eslint.config.js` 또는 현재 ESLint 권장 구성
- `vitest.config.ts` 또는 Vite/Vitest 통합 설정
- `public/manifest.json`
- `src/popup/`
- `src/options/`
- `src/background/`
- `src/content/`
- `src/components/`
- `src/lib/`
- `src/types/`
- `src/test/`

구현 지시:

- React, TypeScript strict mode, Vite, Tailwind CSS, Vitest, lucide-react를 사용한다.
- Manifest V3의 `action.default_popup`은 popup entry를 가리키게 한다.
- options page entry를 구성한다.
- background service worker와 content script가 빌드 산출물에 포함되게 Vite 설정을 구성한다.
- popup/options는 최소 화면만 렌더링해도 된다. 단, 빈 화면이면 안 된다.
- `npm run build`, `npm run lint`, `npm run test` 스크립트를 제공한다.
- 테스트 파일을 최소 1개 만들어 Vitest가 동작함을 검증한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `docs/ARCHITECTURE.md` 디렉토리 구조를 따르는가?
   - `docs/ADR.md` 기술 스택을 벗어나지 않았는가?
   - `AGENT.md` CRITICAL 규칙을 위반하지 않았는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 해당 step을 업데이트한다:
   - 성공 -> `"status": "completed"`, `"summary": "Vite React MV3 extension scaffold와 빌드/린트/테스트 스크립트 생성"`
   - 수정 3회 시도 후에도 실패 -> `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 -> `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 자동 채우기 기능을 구현하지 마라. 이유: 이 step은 프로젝트 뼈대만 담당한다.
- 외부 서버나 로그인 기능을 추가하지 마라. 이유: MVP는 로컬 우선 확장 프로그램이다.
- 기존 테스트를 깨뜨리지 마라.
