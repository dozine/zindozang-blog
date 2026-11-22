# 사진 여러 장 업로드

## 기존 문제

사진을 여러 장 넣으려면 파일 선택과 업로드를 한 장씩 반복해야 했다. 파일 입력에는 다중 선택 설정이 없었고, 선택 결과에서도 `e.target.files?.[0]`으로 첫 번째 파일만 사용했다.

파일 입력에 `multiple`을 추가하고, 선택된 파일 목록을 순서대로 처리하도록 변경했다. 성공한 사진의 URL을 모아 작성 화면에 전달하고, 기억해 둔 커서 위치에 한 번에 삽입한다.

## 사용자 동작 흐름

1. 본문에 커서를 놓고 사진 추가 버튼을 누른다. 기존 커서 삽입 기능이 이때의 위치를 기억한다.
2. 파일 선택창에서 여러 사진을 선택한다.
3. 파일 목록 순서대로 검사·변환·업로드를 진행한다. 화면에는 현재 파일 번호와 이름, 전체 진행률을 표시한다.
4. 실패한 파일은 이름과 사유를 표시하고 다음 파일을 계속 처리한다.
5. 전체 처리가 끝나면 성공한 사진들을 목록 순서대로 본문에 삽입하고, 마지막 사진 뒤로 커서를 옮긴다.

일부만 성공하면 성공한 사진만 삽입한다. 전부 실패하면 본문 삽입을 요청하지 않는다. 파일 선택창이 반환한 목록의 순서를 사용하며, 별도 정렬이나 순서 변경 UI는 제공하지 않는다.

## 파일 하나에서 파일 목록으로 변경

기존에는 첫 번째 파일만 가져왔다.

```tsx
const file = e.target.files?.[0];
```

이제 파일 입력에서 다중 선택을 허용하고, `FileList` 전체를 배열로 변환한다.

```tsx
<input type="file" multiple />;

const files = Array.from(e.target.files ?? []);
```

기존의 한 파일 처리 과정을 `uploadFile` 함수로 분리했다. 이 함수는 파일 크기와 형식을 검사하고, 크기별 이미지를 생성해 Firebase Storage에 업로드한 뒤 본문용 URL을 반환한다.

## 순차 업로드와 부분 실패 처리

여러 파일을 동시에 업로드하지 않고 `for...of`와 `await`로 한 파일씩 처리한다. 동시에 진행하는 변환·업로드 작업을 제한하고, 성공한 URL을 원래 목록 순서대로 모으는 방식이다.

```tsx
const urls: string[] = [];

for (const [index, file] of files.entries()) {
  setFileStatus(`${index + 1}/${files.length} · ${file.name}`);
  try {
    urls.push(await uploadFile(file, index, files.length));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "업로드에 실패했습니다.";
    setUploadErrors((prev) => [...prev, `${file.name}: ${reason}`]);
  }
}

if (urls.length) onImagesUploaded?.(urls);
```

오류 처리를 파일별 반복문 안에 두어 한 파일의 실패가 전체 작업을 중단하지 않게 했다. 잘못된 형식, 크기 초과, 이미지 읽기·변환 실패, Storage 업로드 및 URL 조회 실패를 해당 파일의 실패로 처리한다.

이미지 읽기 실패와 Canvas 변환 실패가 발생하면 Promise를 거절하도록 보완했다. 생성한 Object URL도 이미지 읽기 완료 또는 실패 시 해제한다.

## 진행 상태와 중복 요청 방지

`uploading` state는 버튼과 파일 입력을 비활성화하고 진행 UI를 표시하는 데 사용한다. `uploadInProgress` ref는 이벤트 처리 시 즉시 확인하는 잠금 값으로, state 변경이 렌더링되기 전에도 중복 요청을 막는다.

진행률은 각 파일과 파일 내 크기별 업로드를 동일한 비중으로 계산한다. 전체 바이트 수 기준은 아니다. 실패한 파일도 처리가 끝난 것으로 반영하므로 진행률 100%가 모든 파일의 성공을 의미하지는 않는다. 실패 여부는 파일별 오류 목록으로 확인한다.

작업 종료 시 `finally`에서 잠금을 풀고 진행 상태를 정리한다. 파일 입력값도 비워 같은 파일을 다시 선택할 수 있게 한다. 실패 파일만 자동 재시도하는 기능은 없으며 사용자가 다시 선택해야 한다.

## 작성 화면에 여러 사진 삽입

기존 `onImageUploaded`는 한 사진의 크기별 URL을 전달했다. 현재 `onImagesUploaded`는 성공한 각 사진의 본문용 URL 목록을 전달한다. 배열의 의미를 구분하기 위해 콜백 이름도 변경했다.

작성 화면에서는 URL들을 이미지 마크다운으로 변환해 합친다.

```tsx
const markdownImage = imageUrls.map((url) => `\n\n![image](${url})\n\n`).join("");

setValue((prevValue) => prevValue.slice(0, position) + markdownImage + prevValue.slice(position));
setImageCaret(position + markdownImage.length);
```

기존 커서 위치 기억·보정 기능을 재사용한다. 업로드 도중 사진을 한 장씩 붙이는 대신, 성공한 목록 전체를 한 번에 삽입한다. 업로드 사진 목록에도 함께 추가하며 기존 사진이 없으면 첫 성공 사진을 기본 썸네일로 지정한다.

커서 위치와 `ref`, 삽입 후 커서 이동에 대한 상세 설명은 [커서 위치에 사진 삽입](./image-cursor-insertion.md)을 참고한다.

## 파일 형식과 현재 Storage 처리

파일별 최대 크기는 10MB이며 JPEG, PNG, GIF, WEBP, SVG를 허용한다. SVG는 브라우저에서 이미지로 읽어 Canvas에 그린 뒤 PNG로 변환한다. 벡터 원본은 보관하지 않는다. GIF도 Canvas를 거치므로 애니메이션 보존을 제공하지 않는다.

현재는 기존 리사이징 구조를 유지하여 원본 한 장당 다음 세 파일을 생성하고 업로드한다. 크기는 원본 비율에 맞춰 조정한다.

| 종류     | 크기 기준  | 현재 작성 화면에서 사용 |
| -------- | ---------- | ----------------------- |
| `card`   | 400 × 300  | 사용하지 않음           |
| `medium` | 800 × 600  | 본문 및 썸네일 후보 URL |
| `large`  | 1200 × 900 | 사용하지 않음           |

업로드 경로에는 `crypto.randomUUID()`로 생성한 ID와 크기 이름, 파일명을 사용한다. 모든 파일이 성공하면 사진 5장 선택 시 Storage 파일 15개가 생성된다. 크기 하나만 생성하는 단순화는 아직 적용하지 않았다.

사진은 게시글 저장 전에 Storage에 즉시 업로드된다. 게시글을 저장하지 않고 나가거나 본문에서 사진을 제거해도 Storage 파일은 자동 삭제되지 않는다. 크기별 업로드 도중 실패한 경우 이미 성공한 일부 파일도 남을 수 있다. 자동 복구본에는 사진 URL이 보관되지만, 미사용 Storage 파일의 정리 기능은 구현하지 않았다.

## 구현 파일과 검증

- [이미지 업로더](../src/components/imageUploader/ImageUploader.tsx): 다중 선택, 파일별 순차 처리, 진행 상태와 오류 표시, SVG 변환
- [작성 화면](<../src/app/(blog)/write/page.tsx>): URL 목록을 커서 위치에 일괄 삽입
- [업로더 테스트](../src/__test__/image-uploader.test.tsx): 부분 실패 후 순서 유지, 전체 실패 시 삽입 요청 생략, SVG의 PNG 변환
- [작성 화면 테스트](../src/__test__/write-page.test.tsx): 여러 사진을 커서 위치에 순서대로 삽입하고 사진 목록 갱신

관련 테스트 19개와 TypeScript 타입 검사를 통과했다. 테스트에서는 편집기·이미지 변환·Firebase 업로드를 모의 처리한다. 실제 파일 선택창과 이미지 변환 결과, Firebase 업로드를 포함한 브라우저 동작은 별도 확인 대상이다.

```sh
npx jest src/__test__/image-uploader.test.tsx src/__test__/write-page.test.tsx --runInBand
npm run typecheck
```
