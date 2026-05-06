# Step 5: popup-results-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/docs/UI_GUIDE.md`
- `/AGENT.md`
- `/src/types/messages.ts`
- `/src/types/autofill.ts`
- `/src/lib/storage.ts`
- `/src/popup/`
- `/src/background/`
- `/phases/0-mvp/index.json`

이전 step에서 만들어진 자동 채우기 runtime과 message 타입을 꼼꼼히 읽고, 설계 의도를 이해한 뒤 작업하라.

## 작업

popup UI에서 현재 탭 자동 채우기를 실행하고 결과를 보여준다.

필수 구현:

- 자동 채우기 실행 버튼
- 실행 중 loading 상태
- 성공 시 채운 필드 수 표시
- 미매칭/스킵 필드 수 표시
- 오류 상태 표시
- options 페이지 열기 버튼
- 프로필이 비어 있을 때 options 페이지로 유도하는 상태
- 부분 성공 상태 표시
- 자동 채우기 결과가 0건일 때의 no-match 상태
- 제출 전 직접 확인 안내

구현 지시:

- popup은 `chrome.runtime`/`chrome.tabs` 메시지를 통해 background 또는 content script와 통신한다.
- 자동 채우기 버튼은 사용자가 클릭했을 때만 메시지를 보낸다.
- 결과 목록은 너무 길어지지 않게 주요 매칭 몇 개만 보여준다.
- 대표 매칭 결과는 최대 5개만 보여준다.
- UI는 `docs/UI_GUIDE.md`를 따르고 popup 너비에 맞게 텍스트가 넘치지 않게 한다.
- 적절한 lucide-react 아이콘을 사용한다.
- 오류 문구는 사용자가 다음에 할 수 있는 행동을 포함해야 한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - popup에서 사용자가 클릭하기 전 자동 채우기 메시지를 보내지 않는가?
   - 성공/실패/빈 프로필 상태가 모두 표현되는가?
   - partial/no-match 상태가 오류와 구분되어 표현되는가?
   - popup 텍스트와 버튼이 좁은 화면에서 넘치지 않는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 해당 step을 업데이트한다:
   - 성공 -> `"status": "completed"`, `"summary": "자동 채우기 실행 popup UI와 결과/오류/빈 프로필 상태 구현"`
   - 수정 3회 시도 후에도 실패 -> `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 -> `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- options 페이지의 프로필 편집 기능을 중복 구현하지 마라. 이유: 프로필 관리는 options 책임이다.
- 자동 채우기 결과를 영속 저장하지 마라. 이유: 실행 결과는 popup 세션 정보로 충분하다.
- 기존 테스트를 깨뜨리지 마라.
