# 커서 위치에 사진 삽입

## 기존 문제

본문 중간에 커서를 놓고 사진을 업로드해도 사진이 항상 본문 맨 아래에 추가되었다. 원하는 문단에 배치하려면 업로드 후 이미지 마크다운을 직접 잘라 옮겨야 했다.

원인은 업로드 완료 시 현재 본문 전체 뒤에 이미지 마크다운을 붙이는 처리였다. 편집기의 커서 위치는 사용하지 않았다.

```tsx
setValue((prevValue) => prevValue + markdownImage);
```

이를 사진 선택 시점의 커서 위치를 기억하고, 업로드가 끝나면 해당 위치에 이미지를 끼워 넣는 방식으로 변경했다.

## 사용자 동작 흐름

1. 본문에서 사진을 넣을 위치에 커서를 놓는다.
2. 상단 사진 추가 버튼이나 편집기 사진 버튼으로 파일 선택창을 연다.
3. 사진을 선택하면 기존 리사이징 및 Firebase 업로드를 진행한다. 업로드 중에도 본문을 편집할 수 있다.
4. 업로드가 완료되면 기억한 위치에 이미지 마크다운을 삽입한다. 선택된 글자가 있었다면 해당 글자를 삭제하지 않고 선택 영역 시작점에 삽입한다.
5. 편집기로 포커스를 돌리고 삽입한 이미지 마크다운 뒤로 커서를 옮겨 이어서 작성할 수 있게 한다.

파일 선택을 취소하거나 업로드가 실패하면 이미지 삽입은 실행되지 않는다. 다시 파일 선택창을 열면 그 시점의 위치를 새로 기억한다.

## 위치를 기억하는 방식

작성 화면에서 편집기 컨테이너를 `editorContainerRef`로 참조하고, 내부 `textarea`의 `selectionStart`를 읽는다. 이 값은 마크다운 원문에서 선택 영역이 시작되는 문자열 인덱스다. 선택 영역이 없으면 현재 커서 위치를 나타낸다.

```tsx
const editorContainerRef = useRef<HTMLDivElement>(null);
const imageAnchor = useRef<number | null>(null);
const previousValue = useRef(value);

const rememberImagePosition = useCallback(() => {
  const textarea = editorContainerRef.current?.querySelector("textarea");
  imageAnchor.current = textarea?.selectionStart ?? previousValue.current.length;
}, []);
```

`ImageUploader`의 `onUploadRequested` 콜백으로 파일 선택창을 열기 직전에 위치를 기억한다. 상단 추가 버튼과 편집기 버튼 모두 같은 파일 선택 경로를 사용한다. `textarea`를 찾지 못하면 본문 끝을 삽입 위치로 사용한다.

### ref를 사용하는 이유

`imageAnchor`는 업로드가 끝날 때까지 기억해야 하지만, 값이 바뀌는 것만으로 화면을 다시 그릴 필요는 없다. `useRef`를 사용하면 렌더링 사이에도 값을 유지하고 비동기 업로드 완료 콜백에서 최신 위치를 읽을 수 있다.

`position` 자체는 state나 ref가 아니라, 업로드 완료 시 `imageAnchor.current`에서 꺼내 계산하는 지역 변수다. `previousValue`도 ref로 관리하며 이전 본문과 현재 본문을 비교하는 데 사용한다.

## 업로드 중 편집에 따른 위치 보정

파일 업로드에는 시간이 걸린다. 그동안 삽입 지점 앞에 글자를 입력하거나 삭제하면 처음 기억한 숫자만으로는 같은 문맥에 사진을 넣을 수 없다.

본문 변경을 감지하는 `useEffect`에서 이전 본문과 새 본문의 공통 앞부분과 공통 뒷부분을 찾는다. 그 사이를 하나의 변경 구간으로 보고 `imageAnchor.current`를 보정한다.

| 삽입 지점과 변경 구간의 관계           | 처리                                     |
| -------------------------------------- | ---------------------------------------- |
| 삽입 지점이 변경 구간보다 앞           | 기존 위치 유지                           |
| 삽입 지점이 이전 변경 구간의 끝보다 뒤 | 새 구간과 이전 구간의 길이 차이만큼 이동 |
| 삽입 지점이 변경 구간 내부 또는 경계   | 새 변경 구간의 끝으로 이동               |

예를 들어 `앞│뒤`에서 사진 업로드를 시작한 뒤 본문 앞에 `추가`를 입력하면, 사진 위치도 `추가앞│뒤`로 이동한다. 커서를 다른 곳으로 옮기기만 한 경우에는 업로드를 시작한 위치를 유지한다.

이 방식은 문자열의 공통 부분을 이용한 보정이다. 여러 곳의 변경이 한 번에 반영되면 하나의 넓은 변경 구간으로 해석할 수 있으며, 편집 이력을 추적하는 정밀한 위치 매핑은 제공하지 않는다.

## 업로드 완료 후 삽입

기억한 위치가 현재 본문 길이를 넘지 않도록 제한하고, 해당 위치 앞뒤로 본문을 나누어 이미지 마크다운을 끼워 넣는다.

```tsx
const markdownImage = `\n\n![image](${imageUrl})\n\n`;
const position = Math.min(
  imageAnchor.current ?? previousValue.current.length,
  previousValue.current.length
);
imageAnchor.current = null;

setValue((prevValue) => prevValue.slice(0, position) + markdownImage + prevValue.slice(position));
setImageCaret(position + markdownImage.length);
```

`setValue`의 함수형 업데이트로 현재 본문을 기준으로 결합하므로 업로드 중 입력한 내용을 유지한다. 삽입 직전에는 `imageAnchor`를 비워 이미지 삽입 자체가 추가 위치 보정으로 처리되지 않게 한다.

이미지 URL 선택, 업로드 사진 목록 갱신, 첫 사진의 기본 썸네일 지정은 기존 처리를 유지한다.

## 삽입 후 커서 이동에 state를 사용하는 이유

실제 편집기의 커서는 변경된 본문이 DOM에 반영된 뒤 옮겨야 한다. 이를 위해 이동할 위치를 `imageCaret` state에 넣고, 렌더링 후 실행되는 `useEffect`에서 포커스와 선택 범위를 지정한다.

```tsx
const [imageCaret, setImageCaret] = useState<number | null>(null);

useEffect(() => {
  if (imageCaret === null) return;
  const textarea = editorContainerRef.current?.querySelector("textarea");
  textarea?.focus();
  textarea?.setSelectionRange(imageCaret, imageCaret);
  setImageCaret(null);
}, [value, imageCaret]);
```

즉, `imageAnchor` ref는 업로드 중 삽입 위치를 기억하고 보정하는 용도이고, `imageCaret` state는 삽입 결과가 화면에 반영된 뒤 커서를 이동시키는 용도다.

## 구현 파일과 검증

- [작성 화면](<../src/app/(blog)/write/page.tsx>): 위치 기억·보정, 이미지 삽입, 포커스와 커서 복원
- [이미지 업로더](../src/components/imageUploader/ImageUploader.tsx): 파일 선택창을 열기 전 `onUploadRequested` 호출
- [작성 화면 테스트](../src/__test__/write-page.test.tsx): 본문 중간 삽입과 선택 텍스트 유지, 삽입 후 포커스·커서 위치, 업로드 중 앞쪽 입력에 따른 보정, 빈 본문 삽입 검증

구현 시 작성 화면 테스트 15개와 TypeScript 타입 검사를 통과했다. 테스트는 편집기와 업로더를 모의 구현으로 대체하므로 실제 편집기 툴바, 파일 선택창, Firebase 업로드를 포함한 브라우저 동작은 별도로 확인해야 한다.

```sh
npx jest src/__test__/write-page.test.tsx --runInBand
npm run typecheck
```
