# Step 4: autofill-runtime

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/AGENT.md`
- `/src/types/profile.ts`
- `/src/types/autofill.ts`
- `/src/lib/storage.ts`
- `/src/lib/fieldMatcher.ts`
- `/src/background/`
- `/src/content/`
- `/phases/0-mvp/index.json`

이전 step에서 만들어진 프로필 모델, 매칭 로직, options UI를 꼼꼼히 읽고, 설계 의도를 이해한 뒤 작업하라.

## 작업

현재 탭의 지원서 페이지를 스캔하고 자동 채우기를 수행하는 runtime을 구현한다.

필수 생성/수정 범위:

- `src/content/`
- `src/background/`
- `src/types/messages.ts`
- 필요 시 `src/lib/domCandidates.ts`
- 관련 테스트

필수 동작:

- popup/background에서 `RUN_AUTOFILL` 메시지를 받으면 active tab의 content script가 페이지의 `input`, `textarea`, `select`를 스캔한다.
- content script는 각 필드를 `FieldCandidate`로 변환한다.
- content script는 DOM 후보와 프로필을 이용해 `buildAutofillPlan`을 실행하거나, background가 plan을 만든 뒤 content script에 적용하게 한다. 선택한 방식은 타입으로 명확히 유지한다.
- 적용 시 값 설정 후 `input`과 `change` 이벤트를 dispatch한다.
- disabled, readonly, hidden input은 채우지 않는다.
- password, file, submit, button 타입은 채우지 않는다.
- 결과로 채운 필드 수, 스킵한 필드 수, 매칭 목록 요약을 반환한다.

핵심 규칙:

- 자동 채우기는 popup에서 명시적으로 시작된 메시지에 의해서만 실행되어야 한다.
- content script는 프로필을 영속 저장하지 않는다.
- 실패한 개별 필드 때문에 전체 실행이 중단되지 않게 한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - content script가 DOM 스캔과 값 입력 책임만 수행하는가?
   - 사용자의 명시적 실행 없이 자동 채우기가 발생하지 않는가?
   - 금지 input 타입과 readonly/disabled/hidden 필드를 건너뛰는 테스트가 있는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 해당 step을 업데이트한다:
   - 성공 -> `"status": "completed"`, `"summary": "RUN_AUTOFILL 메시지 기반 DOM 스캔/입력 runtime과 결과 반환 구현"`
   - 수정 3회 시도 후에도 실패 -> `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 -> `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 페이지 로드 시 자동으로 값을 채우지 마라. 이유: 사용자의 명시적 실행 원칙을 위반한다.
- 외부 네트워크 요청을 추가하지 마라. 이유: 개인정보 로컬 우선 원칙을 지켜야 한다.
- 기존 테스트를 깨뜨리지 마라.
