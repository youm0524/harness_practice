# Step 1: profile-model

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/AGENT.md`
- `/package.json`
- `/src/types/`
- `/src/lib/`
- `/phases/0-mvp/index.json`

이전 step에서 만들어진 프로젝트 설정과 entry 파일을 꼼꼼히 읽고, 설계 의도를 이해한 뒤 작업하라.

## 작업

사용자 프로필 데이터 모델과 Chrome storage helper를 구현한다.

필수 생성/수정 범위:

- `src/types/profile.ts`
- `src/lib/storage.ts`
- `src/lib/storage.test.ts`
- 필요 시 `src/test/`의 Chrome API mock

필수 타입:

```ts
export interface PersonalInfo
export interface Education
export interface Credential
export interface ProjectExperience
export interface UserProfile
```

필수 함수 시그니처:

```ts
export function createEmptyProfile(): UserProfile
export async function getProfile(): Promise<UserProfile>
export async function saveProfile(profile: UserProfile): Promise<void>
export async function clearProfile(): Promise<void>
```

핵심 규칙:

- `UserProfile`에는 `personal`, `educations`, `credentials`, `projects`, `updatedAt`을 포함한다.
- 인적사항은 이름, 생년월일, 이메일, 전화번호, 주소를 지원한다.
- 학력은 학교명, 전공, 학위, 입학일, 졸업일, 학점을 지원한다.
- 자격사항은 자격증명, 취득일, 발급처를 지원한다.
- 프로젝트는 제목, 시작일, 종료일, 역할, 주요 내용, 기술 스택을 지원한다.
- 고위험 민감정보(주민등록번호 전체, 비밀번호, 금융 정보)는 모델에 포함하지 않는다.
- 저장소에 데이터가 없거나 깨진 데이터가 있으면 앱이 죽지 않고 `createEmptyProfile()` 결과로 복구한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `src/types/`와 `src/lib/` 경계를 지켰는가?
   - `chrome.storage.local` 외의 영속 저장소를 쓰지 않았는가?
   - 고위험 민감정보 필드를 추가하지 않았는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 해당 step을 업데이트한다:
   - 성공 -> `"status": "completed"`, `"summary": "프로필 타입과 chrome.storage.local 기반 저장 helper 및 테스트 구현"`
   - 수정 3회 시도 후에도 실패 -> `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 -> `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- options UI를 완성하지 마라. 이유: 이 step은 데이터 모델과 저장 계층만 담당한다.
- content script에서 storage에 직접 접근하게 만들지 마라. 이유: content script는 DOM 작업만 담당해야 한다.
- 기존 테스트를 깨뜨리지 마라.
