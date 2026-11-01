# API 요청 본문 검증

게시글 생성·수정, 카테고리 생성, 태그 생성 API는 인증 검사 후 Zod로 JSON 본문을 검증한다. 검증에 실패하거나 JSON이 잘못됐으면 DB에 접근하기 전에 `{ message: string }` 형식의 400 응답을 반환한다.

스키마는 `src/lib/validation/schemas.ts`, 공통 파싱과 오류 응답은 `src/lib/validation/request.ts`에 있다. 현재 필수 문자열의 공백 여부와 필드의 자료형을 검사한다. 기존 이미지의 문자열·문자열 배열·null, 선택적인 태그·공개 설정은 유지한다. 제목과 본문 등은 검증 과정에서 값을 변경하지 않는다.

요청 타입은 기존 `src/types/api`에 유지하고 스키마가 해당 타입에 호환되는지 `satisfies`로 확인한다. 프로젝트 전체에 `strict: true`를 적용하며, `npm run typecheck`로 전체 타입을 검사한다. 이 검사는 CI에서도 실행한다. [Zod 공식 문서](https://zod.dev/)도 strict 모드를 요구한다.

이번 작업은 위 네 요청의 본문을 다룬다. 경로·쿼리 파라미터, 외부 서비스의 응답, 요청 크기 제한과 파일 업로드 자체의 검증은 포함하지 않는다. Zod 타입 선언과 TypeScript 검사는 데이터베이스 연결이나 OAuth를 검증하지 않는다.
