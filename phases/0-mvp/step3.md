# Step 3: profile-options-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/docs/UI_GUIDE.md`
- `/AGENT.md`
- `/src/types/profile.ts`
- `/src/lib/storage.ts`
- `/src/options/`
- `/src/components/`
- `/phases/0-mvp/index.json`

이전 step에서 만들어진 프로필 모델, storage helper, UI scaffold를 꼼꼼히 읽고, 설계 의도를 이해한 뒤 작업하라.

## 작업

사용자가 프로필을 입력, 수정, 삭제할 수 있는 options 페이지를 구현한다.

필수 구현:

- 인적사항 섹션
- 학력 반복 섹션
- 자격사항 반복 섹션
- 프로젝트 반복 섹션
- 저장 버튼
- 로컬 데이터 초기화 버튼
- 저장 성공/실패 상태 표시
- 마지막 저장 시간 표시
- 전체 초기화 확인 단계

구현 지시:

- `src/lib/storage.ts`의 `getProfile`, `saveProfile`, `clearProfile`을 사용한다.
- 반복 섹션은 추가/삭제가 가능해야 한다.
- 모든 섹션이 완성되지 않아도 저장 가능해야 한다.
- Tailwind CSS와 `docs/UI_GUIDE.md`를 따른다.
- 버튼에는 적절한 lucide-react 아이콘을 사용한다.
- 필수값 검증은 MVP 수준으로 하되, 빈 반복 항목 때문에 앱이 죽지 않게 한다.
- 모든 form input에는 접근 가능한 label을 제공한다.
- 전체 초기화는 저장 버튼과 떨어진 위험 영역에 배치한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - options UI가 storage helper를 통해서만 저장소를 사용하는가?
   - UI_GUIDE의 색상, 카드, 버튼, 입력 필드 방향을 따르는가?
   - 고위험 민감정보 입력란이 없는가?
   - 부분 프로필 저장과 전체 초기화 확인 흐름이 있는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 해당 step을 업데이트한다:
   - 성공 -> `"status": "completed"`, `"summary": "프로필 CRUD options UI와 반복 입력 섹션 구현"`
   - 수정 3회 시도 후에도 실패 -> `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 -> `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 자동 채우기 DOM 입력 로직을 구현하지 마라. 이유: 이 step은 프로필 관리 UI만 담당한다.
- 카드 안에 카드를 중첩하지 마라. 이유: options 페이지의 정보 밀도와 가독성을 해친다.
- 기존 테스트를 깨뜨리지 마라.
