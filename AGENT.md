# 프로젝트: ApplyMate

## 기술 스택
- Chrome Extension Manifest V3
- Vite
- React
- TypeScript strict mode
- Tailwind CSS
- Vitest
- lucide-react

## 아키텍처 규칙
- CRITICAL: 사용자의 프로필 데이터는 MVP에서 외부 서버로 전송하지 않는다.
- CRITICAL: 자동 채우기는 사용자가 popup에서 명시적으로 실행한 경우에만 수행한다.
- CRITICAL: content script는 DOM 스캔과 입력 이벤트 발생만 담당한다. 영속 저장소 접근과 프로필 편집 로직을 넣지 마라.
- CRITICAL: 필드 매칭 로직은 `src/lib/fieldMatcher.ts`의 순수 함수로 유지하고 DOM API와 결합하지 마라.
- 컴포넌트는 `src/components/`, 타입은 `src/types/`, Chrome storage helper는 `src/lib/`에 둔다.
- 고위험 민감정보(주민등록번호 전체, 비밀번호, 금융 정보)는 저장 모델에 포함하지 않는다.

## 개발 프로세스
- CRITICAL: 새 기능 구현 시 테스트 가능한 순수 로직은 먼저 테스트를 작성하고, 테스트가 통과하는 구현을 작성할 것.
- 커밋 메시지는 conventional commits 형식을 따를 것 (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- UI는 `docs/UI_GUIDE.md`를 따른다.

## 명령어
```bash
npm run dev      # 개발 서버 또는 watch 빌드
npm run build    # extension 번들 생성
npm run lint     # ESLint
npm run test     # Vitest
```
