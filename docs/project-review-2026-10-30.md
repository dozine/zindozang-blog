# 블로그 개발 재개를 위한 현황 점검

점검일: 2026-10-30 (Asia/Seoul)

## 1. 총평

**핵심 기능과 구조는 이미 갖춰져 있다. 기존 구조를 유지하면서 권한 경계, 초기 렌더링, 검증 체계를 먼저 보완하는 것이 좋다.**

단순한 정적 블로그를 넘어 관리자 로그인, Markdown 작성·수정, 공개/비공개, 카테고리·태그, Firebase 이미지, 댓글, 방문 집계까지 구현했다. 페이지 / 서버 데이터 접근 / 브라우저 API 호출 / 훅 / UI의 책임을 나눈 점도 좋다.

다만 관리자 화면을 숨기는 것과 API를 보호하는 것은 별개다. 현재 일부 변경 API에 인증이 없고, 태그 상세 응답에 비공개 글이 포함될 수 있다. 기능 추가 전에 이 두 문제를 해결해야 한다. SSR을 도입했지만 테마 Provider가 초기 콘텐츠를 숨기며, 테스트 설정은 있으나 CI에서 실행하는 Jest 테스트는 없다.

이 문서는 로컬 코드와 실제 명령 실행 결과를 근거로 작성했다. 운영 환경을 공격하거나 운영 데이터를 변경하는 요청은 보내지 않았다. 배포 사이트의 시각적 완성도, 실제 트래픽, Lighthouse 점수, Firebase Storage 규칙, DB 인덱스 적용 상태, 백업 및 OAuth 운영 설정은 확인하지 않았다. 아래의 보안 문제는 코드상 누락을 확인한 것이며 운영 환경에서의 악용 재현 결과는 아니다.

## 2. 현재 구성

| 영역 | 확인한 상태 |
| --- | --- |
| 실제 Git 저장소 | `blogapp/` 내부에 별도 `.git` 존재. 명령과 CI 판단 기준은 이 디렉터리 |
| 프레임워크 | 선언: Next.js `^16.0.10`, React `^19.2.3`; 로컬 설치: Next.js 16.2.1, React 19.2.4 |
| 데이터 | Prisma / MongoDB. 로컬 Prisma 및 Client 6.19.2 |
| 인증 | NextAuth v4, Google·GitHub, `MYEMAIL`로 관리자 로그인 제한 |
| 에디터 | `@uiw/react-md-editor`, 본문은 `react-markdown` + GFM + raw HTML |
| 이미지 | Firebase Storage 직접 업로드, 브라우저에서 세 크기로 리사이즈 |
| UI | CSS Modules, 테마 Context, 반응형 스타일, Storybook 16개 스토리 파일 |
| 외부 기능 | Utterances, Vercel Analytics, Google Analytics, 자체 방문 집계 |
| 자동화 | GitHub Actions: npm ci → Jest → build → 브랜치별 Vercel 배포 |

일반적인 읽기 흐름은 `Server Page → lib/data → Prisma`, 쓰기 흐름은 `UI/Hook → lib/services → API Route → Prisma`다. 이 구분은 유지할 가치가 있다.

## 3. 잘된 점

### 책임을 분리한 코드 구조

`src/lib/data`, `src/lib/services`, `src/hooks`, `src/components`, `src/types`가 구분돼 있다. `blog/page.tsx`는 URL 파라미터와 화면 조립을 담당하고 `CardList`가 서버 데이터 함수를 호출한다. 작성 화면에서도 데이터 로딩과 편집 상태를 별도 훅으로 나눴다. 다음 기능을 추가할 때 기존 코드를 확장하기 좋은 기반이다.

### 개인 블로그 운영에 필요한 흐름을 구현

글 작성·편집·삭제, 비공개 저장, 태그·카테고리 필터, 썸네일 선택까지 연결했다. 작성 에디터를 동적 import하고 작성 화면에 한정한 것도 적절하다. 공개 여부를 데이터 모델에 포함해 둔 덕분에 초안 기능을 확장하기 쉽다.

### 데이터 일관성을 고려

글과 태그 관계를 생성·수정·삭제할 때 트랜잭션을 사용한다. `PostTag`의 복합 unique, 글 slug와 태그 이름의 unique도 있다. 카테고리 삭제 시 글을 미분류로 이동시키는 정책, 방문 집계의 원자적 increment와 충돌 재시도도 의도가 명확하다. 개발 중 Prisma Client를 전역 재사용하는 코드도 있다.

### 일부 보안·성능 기반이 마련됨

게시글 수정·삭제 API는 세션과 작성자를 검사한다. CSP, frame 차단, MIME sniffing 차단 등 헤더를 설정했다. 이미지 도메인을 제한하고 `next/image`에 `sizes`, blur placeholder를 사용한다. 보안이나 성능을 전혀 고려하지 않은 프로젝트는 아니다. 다만 설정의 존재와 실제 효과는 구분해야 한다.

### UI를 개별 확인할 기반

카드, 페이지네이션, 모달 등의 Storybook이 있고 a11y 및 Vitest 설정도 있다. 디자인의 독립 검증에 활용할 자산이다. 단, 스토리가 있는 것만으로 핵심 사용자 흐름이 테스트되는 것은 아니다.

## 4. 우선 해결할 문제

우선순위: P0 = 재개 첫 작업 / P1 = 기능 확장 전 / P2 = 품질 개선 단계.

### P0 — 카테고리·태그 변경 API에 인증·권한 검사 없음

- 근거: `src/app/api/categories/route.ts`의 POST·DELETE, `src/app/api/tags/route.ts`의 POST, `src/app/api/tags/[id]/route.ts`의 DELETE.
- 이 핸들러들은 `getAuthSession()`이나 관리자 검사를 거치지 않고 DB를 변경한다. NextAuth 로그인 제한은 이 API들을 자동으로 보호하지 않는다.
- 영향: 외부 요청으로 카테고리/태그를 생성·삭제할 수 있는 경로가 코드에 열려 있다. 카테고리 삭제는 연결된 글의 분류까지 변경한다.
- 조치: 공통 관리자 가드를 만들고 모든 변경 경로에서 적용한다. 세션 없음은 401, 권한 없음은 403으로 일관되게 응답한다. 입력 검증과 함께 적용한다.
- 완료 기준: 비로그인 요청이 DB 호출 전에 거부되고, 관리자 정상 작업은 유지되는 API 테스트.

### P0 — 태그 상세 API로 비공개 글이 노출될 수 있음

- 근거: `src/app/api/tags/[id]/route.ts`의 GET은 인증 없이 `posts.include.post: true`를 반환하며 `isPublished` 조건이 없다.
- 영향: 태그 ID를 알면 비공개 글의 제목뿐 아니라 `desc` 본문도 응답에 포함될 수 있다. 게시글 상세의 공개 검사와 다른 우회 경로다.
- `src/lib/data/tag.ts`의 `getTagById`도 같은 조회 구조다. 사용처를 포함해 정책을 통일해야 한다. 태그 개수 집계도 비공개 글을 포함한다.
- 조치: 공개 API에서 공개 글만 조회하고 필요한 필드만 select한다. 관리자용 조회가 필요하면 권한에 따른 조건을 명시한다.
- 완료 기준: 공개·비공개 글이 같은 태그를 가질 때 익명 응답에는 공개 글만 존재한다.

### P1 — 테마 Provider가 서버 초기 콘텐츠를 숨김

- 근거: `src/providers/ThemeProvider.tsx`는 `mounted === false`일 때 `null`을 반환하며, 루트 layout에서 전체 children을 감싼다.
- 영향: 서버에서 데이터를 읽더라도 초기 HTML의 화면 콘텐츠를 활용하지 못하고 브라우저의 마운트를 기다린다. JavaScript에 대한 의존과 초기 표시 지연이 커진다. README의 SSR·SEO 개선 주장은 이 구조를 반영해 다시 평가해야 한다.
- 조치: 콘텐츠는 처음부터 렌더링하고 테마 값만 처리한다. 서버 쿠키 기반 초기 테마 또는 검증된 초기 테마 적용 방식 중 하나로 통일한다.
- 완료 기준: `/blog`와 공개 글의 초기 HTML에 제목·본문이 있고 JavaScript 비활성 상태에서도 읽을 수 있다. 저장된 다크 테마에서 hydration 경고 및 깜빡임 확인.

### P1 — CI가 핵심 회귀를 검증하지 못함

- Jest 설정과 mock은 있으나 현재 testMatch에 맞는 테스트가 0개다. `npm run test:ci -- --runInBand`는 실패한다.
- `.github/workflows/ci-cd.yml`은 `--passWithNoTests`를 사용해 테스트가 없어도 통과한다.
- CI의 “Lint and Build” 단계는 실제로 `npm run build`만 실행한다. Next.js 16은 build에서 lint를 자동 실행하지 않는다.
- `npm run lint`는 제거된 `next lint`를 사용한다. `eslint-config-next`도 15.2.2로 Next 본체와 버전 차이가 있다.
- 조치: ESLint CLI 명령, 별도 typecheck, 인증/비공개/저장 흐름 테스트를 CI에 넣는다. 핵심 테스트를 마련한 후 `--passWithNoTests`를 제거한다. Storybook의 브라우저 테스트를 CI에 넣을지는 실행 비용과 검증 범위를 보고 결정한다.

### P1 — 이미지 우선 로딩 조건이 모든 카드에서 참

- 근거: `src/components/card/Card.tsx`는 `index = 0`, `shouldPrioritize = priority || index < 3`. `CardList`는 `priority={index < 3}`만 넘기고 index를 넘기지 않는다.
- 영향: 뒤쪽 카드도 기본 index 0 때문에 eager/priority 로딩된다. 상단 이미지와 네트워크를 경쟁할 수 있다.
- 조치: 우선 로딩 판단을 호출부의 `priority`로 통일하거나 index를 명시한다.
- 완료 기준: 첫 화면에서 중요한 이미지에만 우선 로딩이 적용되고 나머지는 lazy 상태다.

### P1 — API 응답과 클라이언트의 계약 불일치

| 위치 | 실제 불일치 | 개선 방향 |
| --- | --- | --- |
| 카테고리 생성 | 서버는 `{ message, category }`, `addCategory()`는 응답 전체를 Category처럼 취급 | 응답 DTO 고정, `data.category` 반환 |
| 카테고리 오류 | 서버는 일반 텍스트, 서비스는 `res.json()` 기대 | 오류도 `{ message, code? }` JSON으로 통일 |
| 기존 태그 생성 | 409 응답은 Tag 자체, `createTag()`는 `result.existingTag` 기대 | 기존 태그 반환 계약 통일 |
| 작성 화면 태그 목록 | `setAvailableTags={() => {}}`를 전달 | 실제 상태 setter 또는 캐시 갱신 연결 |

이들은 README에 남아 있는 태그 문제와 함께 먼저 재현할 항목이다. 모든 태그 문제의 원인이 하나라고 단정할 수는 없다.

### P1 — 태그 구분자가 정상 태그 이름과 충돌

- 근거: `useTagSelection`, `getPosts`, 게시글 목록 API가 태그를 `.`로 join/split한다. 태그 생성 API는 점이 포함된 이름을 허용한다.
- 예: `Node.js`가 `Node`, `js`로 분리돼 원하는 글이 필터링되지 않는다. URL 인코딩만으로 해결되지 않는다.
- 조치: `?tag=Node.js&tag=React`처럼 반복 query를 사용하거나 안정적인 태그 ID를 사용한다. 여러 태그는 현재 OR(`some` + `in`) 조건이라는 점도 UI 의도와 맞춘다.

### P1 — 저장 안정성과 이미지 데이터 모델

- `useWritePage.ts`는 `isSubmitting` 상태를 설정하지만 반환하지 않으며 모달 버튼에도 연결하지 않는다. 중복 클릭에 대한 UI/핸들러 방어가 없다.
- 저장 요청은 이미지 목록 중 썸네일 하나만 `img`에 저장한다. 편집 재진입 시 `uploadedImages`를 `img`에서 복원하므로 본문에 삽입한 나머지 이미지가 썸네일 선택 목록에서 빠진다.
- 업로더는 card/medium/large 세 파일을 만들지만 훅은 medium 하나를 선택한다. 파생 이미지 연결과 삭제 정책도 없다.
- `createMultipleSizes()`는 `img.onerror`, `toBlob(null)` 실패 경로에서 reject하지 않아 손상 이미지 입력 시 업로드가 끝나지 않을 수 있다. object URL도 해제하지 않는다.
- 조치: 썸네일과 본문 이미지/파생 크기 정보를 분리하고, 저장 중 중복 요청을 막는다. 브라우저 이탈·실패 시 초안 복원도 도입하면 실제 집필 경험에 도움이 된다.
- Firebase Storage 규칙과 Firebase Auth 연동은 저장소에서 확인되지 않았다. NextAuth 세션만으로 Storage 쓰기가 보호된다고 가정하지 말고 콘솔 규칙을 별도로 확인한다. 이것은 현재 규칙이 공개돼 있다는 판정은 아니다.

## 5. 다음 품질 개선 항목

### 오류 처리·입력 검증·타입

- `tsconfig.json`의 `strict: false`, 여러 `any` 때문에 TypeScript의 보호 범위가 작다. 변경이 잦은 API DTO와 데이터 함수부터 강화한다.
- `getPostData()`는 조회 결과가 null인지 확인하기 전에 `postCheck.isPublished`를 접근한다. 없는 글도 catch로 처리되며 DB 장애와 함께 null → 404로 합쳐진다. “없음 / 권한 없음 / 서버 오류”를 구분하는 것이 좋다.
- `/blog`의 `Number(page)`와 API의 `parseInt(page)`에 유효성 검증이 없다. `abc`, 소수, 음수, 과도한 값을 검증·정규화한다.
- 생성 API의 TypeScript 타입 표기는 요청 본문의 런타임 검증을 대신하지 않는다. 길이, 배열 원소, boolean, slug, URL 등 검증을 공통화한다.
- 카테고리 slug 변환은 한글을 제거한다. 한글 이름만 입력하면 빈 slug가 돼 생성되지 않는다. 글 slug와의 정책 차이를 해소한다.
- 일부 오류 응답에 `err.message`를 그대로 노출한다. 사용자용 메시지와 서버 로그를 분리한다.

### 데이터 접근과 운영

- 게시글 목록과 상세의 권한·형식 변환 로직이 `lib/data/post.ts`와 API에 중복된다. 공유 서버 쿼리/정책 함수를 만들어 응답 경로마다 공개 조건이 달라지는 것을 막는다.
- 기본 카테고리 보장은 data/API 양쪽에 중복되고 조회 중 DB 쓰기를 한다. 초기 seed 또는 멱등적인 초기화 정책을 정한다. 조회 후 생성 방식은 동시 최초 접근 시 unique 충돌도 가능하다.
- 상세 GET과 `getPostData()`는 조회수를 증가시킨다. 메타데이터 생성과 수정용 로딩도 읽기 함수에 연결돼 있으므로 사람의 실제 읽기와 집계가 어긋날 수 있다. React cache가 같은 렌더 내 중복을 줄여도 다른 요청·봇·prefetch까지 정의하지는 않는다.
- 방문 집계는 서버 로컬 날짜로 일자를 계산한다. 서울 날짜가 기준이면 `Asia/Seoul`로 명시하고 자정 쿠키 만료와 함께 맞춘다. 쿠키 기반 수치는 정확한 고유 방문자 수로 해석하기 어렵다.
- Prisma 스키마에는 unique 외 조회용 `@@index`가 없다. 공개 여부·생성일·카테고리·관계 필드를 중심으로 실제 쿼리 플랜을 보고 추가한다. 운영 DB에 별도로 만든 인덱스 유무는 미확인이다.
- `Post`에 `updatedAt`이 없어 수정 이력 표시와 운영 추적에 제약이 있다. 백업·복구 및 MongoDB replica set/트랜잭션 환경도 개발 재개 시 확인한다.

### 테마·접근성·화면 흐름

- 테마는 `.light/.dark` wrapper class인데 `useUtterances`는 `html[data-theme]`를 한 번 읽는다. 댓글·코드블록 테마가 실제 토글과 어긋나는 구조다. 댓글 생성 시 script만 검사하고 정리하지 않아 테마나 글 이동 처리도 재검토해야 한다.
- 모바일 메뉴는 클릭 가능한 div, 로그아웃은 span이다. button과 접근 가능한 이름, `aria-expanded`, 키보드 동작을 제공한다.
- 공통 모달은 dialog 의미, Escape 닫기, focus trap/복귀가 없다. 페이지네이션에 현재 페이지 `aria-current`를 제공하고 카드 제목의 반복 h1을 h2 등으로 조정한다.
- About 링크는 `/`로 연결된다. 실제 소개 페이지를 만들거나 메뉴의 의미를 정리한다.
- 글 제목 입력의 label, 썸네일 선택 키보드 접근, 저장 실패 메시지와 상태 표시를 보강한다. 실제 모바일·스크린리더 검증은 별도 수행한다.

### SEO·성능·측정

- 제목 템플릿과 글별 `generateMetadata`는 좋은 시작이다. 다만 sitemap/robots 파일, canonical, metadataBase, 글별 OG 이미지/Article 구조화 데이터는 현재 소스에 없다.
- README 배포 주소와 layout OG 주소가 다르다. 실제 대표 도메인을 정하고 메타데이터·인증 callback·운영 문서를 일치시킨다.
- Google Analytics에 `send_page_view: false`가 있고 소스에서 별도 `page_view` 전송은 찾지 못했다. GA 페이지뷰가 의도대로 쌓이는지 확인한다. Vercel Analytics는 별도다.
- 루트에서 Google 폰트 6종과 로컬 폰트를 선언한다. 실제 사용 글꼴·웨이트를 줄일 여지가 있으며 빌드가 Google Fonts 네트워크에 의존한다. 다운로드 용량과 LCP는 측정 후 판단한다.
- 빌드 결과 홈 `/`는 정적 페이지다. 홈의 날짜와 카테고리는 요청마다 최신이라고 보장되지 않는다. 카테고리 변경 시 재검증 또는 동적 렌더링 정책을 정한다.
- `rehypeRaw`로 HTML을 허용하며 sanitizer는 없다. 현 작성자가 관리자 한 명이라는 전제에서 위험을 평가하되, 필요한 이미지 그리드 HTML을 유지하는 allowlist 정책을 고려한다. 이를 곧바로 XSS 악용이 입증됐다는 뜻으로 해석하면 안 된다.
- CSP의 `unsafe-inline`/`unsafe-eval`은 보강 여지가 있다. 외부 스크립트와 인증을 포함한 실제 동작을 확인하면서 적용한다.

### 문서·의존성

- README는 Next.js 15, Quill, CSR 설명과 현재 Markdown/Next 16 구현이 섞여 있다. TypeScript 도입 완료 설명과 “전환 필요” 회고도 공존한다. 측정값 없는 성능 개선 표현은 현재 검증 결과로 대체한다.
- `src/utils` 설명은 현재 `src/lib` 구조와 다르며 시작 명령·환경변수 예제·테스트·배포 절차가 부족하다. 비밀 값 없는 `.env.example`을 추가하면 재시작 비용이 줄어든다. 로컬 `.env*`는 ignore되고 현재 tracked 목록에는 없지만 과거 이력의 노출 여부까지 조사한 것은 아니다.
- Quill 관련 유틸·타입·mock과 여러 렌더링 패키지가 남아 있다. import와 간접 의존을 확인한 후 제거한다. 소스에서 직접 import가 없다고 무조건 삭제할 수는 없다.
- Storybook 10과 addon-actions 9, Jest 29와 @types/jest 30 등 버전 정합성을 점검한다. 설치된 패키지의 보안 취약점 전수 감사나 최신 안전 버전 확인은 이번 범위에 포함하지 않았다.

## 6. 실행 검증 결과

모든 명령의 작업 디렉터리: `blogapp/`. 소스·설정 수정 없이 기존 설치 의존성을 사용했다.

| 검증 | 결과 | 해석 |
| --- | --- | --- |
| 최초 `tsc --noEmit --incremental false` | 실패 | 기존 `.next/types/validator.ts`가 삭제된 `(editor)/write` 경로를 참조. 소스 자체 타입 오류로 단정하지 않음 |
| `npm run lint` (기본 Node 18.16.0) | 실패 | Next 요구 Node >=20.9 미충족 |
| Node 20.19.6로 `next lint` | 실패 | `lint` 디렉터리를 찾으려 함. Next 16에서 명령 제거됨 |
| ESLint CLI로 `src` 검사 | 오류 10 / 경고 106 | 오류 10개는 ImageUploader의 Prettier 형식 문제. 경고는 unused 51, console 53, img 2 |
| `npm run test:ci -- --runInBand` | 실패 | Jest 대상 테스트 0개. Storybook 브라우저 테스트는 이 명령의 대상이 아님 |
| Node 20.19.6로 `next build`, 샌드박스 | 실패 | Google Fonts 6종 네트워크 접근 실패 |
| 같은 build, 네트워크 허용 후 | **통과** | 컴파일·TypeScript·정적 페이지 생성 완료. `/blog`, 글 상세, `/tags`는 dynamic, `/`는 static |
| 빌드 후 `tsc --noEmit --incremental false` | **통과** | 생성 타입 갱신 후 최초의 경로 참조 오류 해소 |
| `prisma validate` | **통과** | 스키마 유효. package.json의 prisma 설정은 향후 제거 예정이라는 경고 |

`next build`를 직접 실행했으므로 `npm run build` 앞단의 `prisma generate`를 새로 실행한 결과는 아니다. 기존 생성 Client로 빌드 가능함을 확인했다. 새 환경의 `npm ci → npm run build`, 운영 로그인·저장·업로드·댓글 및 Storybook 브라우저 테스트는 별도 검증이 필요하다.

현재 `.nvmrc`와 CI는 Node 20을 지정하지만 기본 셸은 Node 18이었다. 재개 시 우선 프로젝트의 Node 버전을 적용한다. Next.js 16의 최소 Node 및 lint 변경은 [공식 업그레이드 가이드](https://nextjs.org/docs/app/guides/upgrading/version-16)를 참고했다.

## 7. 개발 재개 순서

| 순서 | 작업 묶음 | 완료 기준 |
| --- | --- | --- |
| 1 | 권한·공개 정책 | 카테고리/태그 변경 API 보호, 태그 경유 비공개 유출 차단, 회귀 테스트 |
| 2 | 검증 기반 | Node 버전 적용, lint/typecheck/test CI 분리, 실제 핵심 테스트 실행 |
| 3 | 읽기 화면 | 테마 Provider 초기 HTML 유지, 카드 우선 로딩 수정, 오류/빈 상태 분리 |
| 4 | 집필 안정성 | 태그 계약·구분자 수정, 중복 저장 방지, 이미지 메타데이터·실패 복구 |
| 5 | 운영 품질 | 대표 도메인/SEO/분석 계측, 방문 날짜, 백업·Storage 규칙 검증 |
| 6 | 확장 | 검색, 목차, 관련 글 등 실제 집필·독서에서 필요한 기능 선택 |

첫 PR은 “변경 API 관리자 검사 + 태그 상세 공개 필터 + 이를 증명하는 테스트”로 범위를 좁히는 것이 좋다. 이후 검증 기반과 초기 렌더링을 각각 분리하면 변경 효과를 확인하기 쉽다.

이번 점검에서는 앱 동작을 바꾸는 수정 없이 이 문서만 추가했다.
