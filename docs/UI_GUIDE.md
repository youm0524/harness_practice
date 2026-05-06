# UI 디자인 가이드

## 디자인 원칙
1. 도구처럼 보여야 한다. 마케팅 페이지가 아니라 반복 작업을 줄이는 브라우저 유틸리티다.
2. 개인정보 입력 화면은 신뢰감과 명료함이 우선이다. 장식보다 읽기 쉬운 레이블, 저장 상태, 오류 표시를 우선한다.
3. 자동 채우기는 사용자가 통제한다고 느껴야 한다. 실행 버튼, 결과 요약, 실패 피드백을 분명히 보여준다.

## AI 슬롭 안티패턴 - 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 템플릿 느낌이 강하고 폼 가독성을 해친다 |
| gradient-text | 개인정보 도구와 어울리지 않는 장식이다 |
| "Powered by AI" 배지 | MVP는 AI 기능을 제공하지 않는다 |
| box-shadow 글로우 애니메이션 | 채용 지원 도구의 신뢰감을 떨어뜨린다 |
| 보라/인디고 브랜드 색상 중심 팔레트 | 흔한 AI SaaS처럼 보인다 |
| 모든 카드에 동일한 rounded-2xl | 폼 밀도가 낮아지고 템플릿 느낌이 난다 |
| 배경 gradient orb | 실제 기능과 관련 없는 장식이다 |

## 색상
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | `#f7f8f5` |
| 패널 | `#ffffff` |
| 보조 영역 | `#eef2e8` |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | `#18201a` |
| 본문 | `#374239` |
| 보조 | `#69736a` |
| 비활성 | `#9aa39a` |

### 데이터/시맨틱 색상
| 용도 | 값 |
|------|------|
| 성공/채움 | `#2f7d4f` |
| 경고/미매칭 | `#a15c14` |
| 에러 | `#b42318` |
| 중립/테두리 | `#d8ded2` |

## 컴포넌트
### 카드
```text
rounded-md bg-white border border-[#d8ded2] p-4
```

### 버튼
```text
Primary: rounded-md bg-[#2f7d4f] text-white hover:bg-[#286b44]
Secondary: rounded-md border border-[#c8d0c2] bg-white text-[#18201a] hover:bg-[#eef2e8]
Text: text-[#69736a] hover:text-[#18201a]
```

### 입력 필드
```text
rounded-md bg-white border border-[#c8d0c2] px-3 py-2 text-sm focus:border-[#2f7d4f] focus:ring-2 focus:ring-[#dcebdd]
```

## 레이아웃
- popup 너비: `360px` 안팎, 세로 스크롤 최소화
- options 페이지: `max-w-5xl`, 좌측 정렬, 2단 그리드는 데스크톱에서만 사용
- 섹션 간격: `gap-4`, 큰 페이지 섹션은 `space-y-6`
- 카드 안에 카드를 중첩하지 않는다.

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 페이지 제목 | `text-2xl font-semibold text-[#18201a]` |
| 섹션 제목 | `text-base font-semibold text-[#18201a]` |
| 필드 레이블 | `text-sm font-medium text-[#374239]` |
| 본문 | `text-sm text-[#374239] leading-6` |
| 보조 설명 | `text-xs text-[#69736a] leading-5` |

## 애니메이션
- 허용: 버튼 hover, focus ring, 150ms opacity/색상 전환
- 금지: 자동 반복 애니메이션, 글로우, 배경 움직임

## 아이콘
- lucide-react를 사용한다.
- 실행, 저장, 삭제, 추가, 경고, 성공 상태에는 텍스트와 아이콘을 함께 쓴다.
- 익숙하지 않은 아이콘 버튼에는 tooltip 또는 `aria-label`을 제공한다.
