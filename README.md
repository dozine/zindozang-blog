# Zindozang Blog

## 1. 개요 (Overview)

링크 : https://zindozang.vercel.app

Zindozang Blog는 기술 블로그 용도로 제작된 프로젝트입니다.

React Quill을 활용한 에디터 기능, 카테고리 및 태그 필터링 기능 등을 갖춘 블로그 플랫폼이며

기존 CSR 방식에서 SSR을 도입하여 초기 로딩 성늘 및 SEO를 대폭 개선했습니다. 또한 이미지 로딩 최적화를 통해 사용자 경험을 한층 더 향상 시켰습니다. Vercel을 통해 배포되었습니다.

- 주요 기능: 에디터, 게시글 CRUD, 이미지 업로드, 카테고리/태그 필터링
- 기술 스택: Next.js 15, React, TypeScript, Prisma, MongoDB, Firebase, module.css

---

## 2. 폴더 구조 (Project Structure)

> `src/app`: 페이지 및 API 라우팅 구조
>
> `src/components`: UI 컴포넌트 모음
>
> `src/utils`: Firebase, Prisma 등 유틸 함수
>
> `prisma`: Prisma 스키마 및 설정
>
> `public`: 정적 파일

---

## 3. 주요 기능 (Features)

- 게시글 작성, 수정, 삭제 (CRUD)
- 이미지 업로드 (Firebase)
- 카테고리 및 태그 관리
- 태그/카테고리 필터링
- 라이트/다크 모드
- 로그인 인증 (NextAuth 사용)
- 초기 로딩 성능 및 SEO 개선을 위한 SSR적용
- 사용자 경험 향상을 위한 이미지 로딩 최적화
- 웹 보안 강화

---

## 4. 사용 기술 및 라이브러리

| 기술          | 설명                               |
| ------------- | ---------------------------------- |
| Next.js 15    | App Router 기반 CSR 구조           |
| React         | 프론트엔드 UI                      |
| TypeScript    | 정적 타입 검사 및 개발 생산성 향상 |
| Prisma        | ORM, MongoDB 연동                  |
| MongoDB Atlas | 클라우드 NoSQL 데이터베이스        |
| Firebase      | 이미지 업로드 기능                 |
| Vercel        | 정적 배포                          |
| module.css    | 모듈 단위 CSS 적용                 |

---

## 5. 개발 과정 요약 및 트러블슈팅

### 🔧 Prisma와 MongoDB 연결 이슈

- 문제: `prisma migrate dev` 명령어가 작동하지 않음
- 원인: MongoDB는 관계형 DB가 아니므로 마이그레이션 지원이 제한적
- 해결: `prisma db push` 명령어로 직접 스키마를 반영

### 이미지 업로드 - Firebase Storage

- 문제: CSR 환경에서 Firebase 초기화 타이밍 이슈
- 해결: 클라이언트 사이드 전용 코드로 Firebase 로직 분리

### Markdown 기반 전환

- 문제: 기존 React-Quill은 Next.js 15 SSR 환경과 호환성 문제 무거운 번들 사이즈 에디터/렌더링 커스터마이징 한계 때문에 장기적으로 유지보수가 어려움
- 해결:

  - WritePage → @uiw/react-md-editor 도입 (Markdown 기반 작성 지원)
  - PostPage → 클라이언트 컴포넌트에서 react-markdown으로 렌더링

- 성과:

  - 작성/조회가 분리되어 더 가벼운 구조 확보
  - SSR 환경과 호환성 강화
  - 개발자 친화적인 Markdown 워크플로우 확립

### 태그 설정 이슈

- 문제: 태그 중복 선택 문제 발생
- 원인: API와 컴포넌트 간 태그 구분자 설정 불일치로 추정
- 해결: 추후 개선 예정 (2차 리팩토링 단계에서 처리 계획)

### SSR전환 및 SEO개선

- 문제 : 초기 로딩 속도 저하
- 해결 : SSR기능을 적극 활용하여 페이지 데이터를 서버에서 미리 렌더링하도록 변경. 이를 통해 FCP 및 LCP지표가 크게 개선 되었습니다.

### Typescript전환

- 문제 : 프로젝트가 지속되면서 Javscript의 동적 타이핑으로 인한 런타임 오류 발생 가능성 증가 및 리팩토링 어려움
- 해결 : Typescript를 도입하여 개발 단계에서 타입 관련 오류를 사전에 방지하고 코드의 가독성 및 유지 보수성을 향상시켰습니다.

### 이미지 로딩 최적화

- 문제 : 이밎 사용으로 인한 로딩 시간 증가 및 사용자 경험 저하
- 해결 : Next.js의 Image컴포넌트를 활용하여 이미지 자동 최적화 및 지연 로딩을 적용하였습니다. 이를 통해 불필요한 네트워크 요청을 줄이고 사용자에게 콘텐츠를 더 빠르게 제공할 수 있게 되었습니다.

### 카테고리 초기화 로직 최적화 및 책임 분리

- 문제: 기존 클라이언트 코드에서 uncategorized 카테고리 존재 여부를 매번 확인하고 없으면 생성 요청 후 다시 데이터를 가져오는 비효율적인 API 호출과 복잡한 클라이언트 로직이 존재했습니다.

- 해결: 카테고리 초기화 로직의 책임을 서버로 완전히 이전했습니다. api/categories GET 라우트에서 카테고리를 조회하기 전에 ensureUncategorizedCategory 함수를 호출하여 uncategorized 카테고리의 존재를 자동으로 보장하도록 변경했습니다.

---

## 6. 배포 정보 (Deployment)

- 배포 플랫폼: Vercel
- 자동 배포: GitHub main 브랜치에 push 시 자동 배포
- 환경 변수 설정: `.env`에 Firebase, MongoDB, NextAuth 관련 정보 포함

### 배포 트러블슈팅

- 문제 : Prisma Client 누락 오류 (Vercel)
- 원인 : Vercel은 prisma generate를 자동 실행하지 안흥ㅁ
- 해결 : package.json의 buil스크립트 "build": "prisma generate && next build"로 수정

---

## 7. 회고 및 다음 단계 (Retrospective & Next Steps)

- SSR 및 메타 태그 최적화를 위한 리팩토링 예정
- lihgthouse 모바일 부분에서 점수 개선 필요
- TypeScript 전환 필요성 느낌:
  - 에러 추적 및 리팩토링 시 타입 시스템의 부재가 불편함
- 에디터 커스터마이징을 추가로 개선하고 싶음
- tag컴포넌트에서 중복 선택이 안되는 오류 개선이 필요함
- ***
