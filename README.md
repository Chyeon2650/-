# MINDLET

Next.js, Supabase, Vercel 기반의 단일 개인 메모 보드입니다. 섹션·컬럼·카테고리 없이 메모 카드만 자유롭게 쌓입니다.

## 로컬 실행

1. Supabase SQL Editor에서 `schema.sql`을 실행합니다.
2. `.env.local.example`을 `.env.local`로 복사하고 값을 채웁니다.
3. 관리자 비밀번호 해시는 아래처럼 생성합니다.

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "원하는-관리자-비밀번호"
```

4. `ADMIN_SESSION_SECRET`에는 길고 무작위인 문자열을 넣습니다.
5. 개발 서버를 실행합니다.

```bash
npm run dev
```

## Vercel 배포

GitHub 저장소를 Vercel에 연결한 뒤 Project Settings → Environment Variables에 `.env.local.example`의 다섯 값을 등록하고 배포합니다. `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`에는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

## 보안 구조

- 브라우저는 공개 URL/anon key로 메모 목록만 조회합니다.
- 메모 생성 시 4자리 비밀번호 해시는 서버 API에서 bcrypt로 만듭니다.
- 일반 삭제는 서버에서 해시를 비교한 뒤 service role로 수행합니다.
- 관리자 인증과 삭제는 HttpOnly 세션 쿠키를 검증하는 서버 API에서만 수행합니다.
- `schema.sql`은 명시적 `GRANT`와 RLS 정책을 함께 적용합니다.
