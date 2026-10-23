# 청현

Next.js 16, React 19, Supabase로 만든 공유 메모 보드입니다. Vercel에서 프론트엔드와 서버 API를 함께 실행하고 Supabase에 메모를 저장합니다. 보드 이름은 **청현**입니다.

누구나 메모를 읽고 작성할 수 있습니다. 작성자는 숫자 4자리 비밀번호로 자신의 메모를 삭제하고, 관리자는 로그인한 뒤 개별 또는 전체 메모를 삭제할 수 있습니다. 검색과 수동 동기화를 지원합니다.

## 로컬 실행

1. Node.js 24 LTS를 설치하고 프로젝트 폴더에서 `npm ci`를 실행합니다. Windows PowerShell 실행 정책으로 `npm`이 차단되면 `npm.cmd`를 사용하세요.
2. Supabase 프로젝트를 만들고 SQL Editor에서 `schema.sql` 전체를 실행합니다. 기존 보드에서도 데이터를 보존한 채 다시 실행할 수 있습니다. 이전 SQL을 사용했다면 변경된 권한을 적용하기 위해 반드시 다시 실행하세요.
3. `.env.local.example`을 `.env.local`로 복사합니다. PowerShell에서는 `Copy-Item .env.local.example .env.local`을 사용합니다.
4. Supabase 프로젝트 URL과 **레거시 API 키(anon, service_role)**를 입력합니다. 이 앱은 아래 다섯 환경 변수만 사용합니다.

| 환경 변수 | 값 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (`https://프로젝트.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개용 레거시 `anon` 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 레거시 `service_role` 키 |
| `ADMIN_PASSWORD_HASH` | 아래 명령으로 생성한 bcrypt 해시 |
| `ADMIN_SESSION_SECRET` | 아래 명령으로 생성한 무작위 문자열, 최소 32자 |

Supabase 프로젝트의 API Keys 설정에서 레거시 `anon` 키와 `service_role` 키를 각각 복사하세요. [Supabase API 키 문서](https://supabase.com/docs/guides/getting-started/api-keys)

5. 관리자 비밀번호 해시와 세션 비밀키를 생성합니다. 비밀번호는 bcrypt 제한인 UTF-8 72바이트 이내로 정하세요.

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "원하는-관리자-비밀번호"
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

`.env.local`의 bcrypt 해시는 `$` 문자가 환경 변수로 확장되지 않도록 **모든 `$` 앞에 백슬래시를 붙여서** 저장합니다. 작은따옴표만으로는 Next.js의 변수 확장을 막을 수 없습니다.

```dotenv
ADMIN_PASSWORD_HASH=\$2b\$12\$여기에_생성된_해시_전체
ADMIN_SESSION_SECRET=생성된_무작위_문자열
```

6. 개발 서버를 실행하고 `http://localhost:3000`에 접속합니다.

```bash
npm run dev
```

## Vercel 배포

1. `schema.sql`을 실행한 Supabase 프로젝트를 준비합니다. `tests/database-permissions.sql`도 SQL Editor에서 실행하면 공개 조회 권한, 해시 차단, 서버 권한을 검사할 수 있습니다. 오류 없이 끝나면 통과입니다.
2. 소스를 GitHub 저장소에 올리고 Vercel에서 Import Project로 연결합니다. `.env.local`은 Git에 포함하지 않습니다.
3. Framework Preset은 **Next.js**, Node.js는 **24.x**, Build Command는 `npm run build`를 사용합니다. 프로젝트 루트가 `package.json`이 있는 폴더인지 확인하고 Output Directory는 기본값을 유지합니다.
4. Project Settings → Environment Variables에 위 표의 다섯 값을 등록합니다. Vercel의 `ADMIN_PASSWORD_HASH`에는 **백슬래시와 따옴표 없이 원본 해시 전체만** 붙여 넣습니다. Production과 사용할 Preview 환경에 각각 적용하세요.
5. 배포한 뒤 메모 작성 → 동기화 → 잘못된 비밀번호로 삭제 거부 → 올바른 비밀번호로 삭제 → 관리자 로그인·삭제·로그아웃을 확인합니다.

`NEXT_PUBLIC_` 변수는 빌드 시 브라우저 코드에 포함되므로 변경하면 **재배포**해야 합니다. `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`에는 `NEXT_PUBLIC_` 접두사를 붙이지 마세요. Preview에서 별도 데이터를 쓰려면 별도 Supabase 프로젝트와 해당 환경 변수를 사용하세요.

## 검증

```bash
npm run lint
npm run build
npm test
```

`npm test`는 임시 포트에서 Next.js 개발 서버와 가짜 Supabase HTTP 서버를 실행합니다. 테스트 전용 키와 메모만 사용하며 실제 Supabase에 접속하지 않습니다. 같은 작업 폴더의 개발 서버를 종료한 상태에서 실행하세요. API 입력 검증, 비밀번호 확인, 관리자 세션과 만료 검사, DB 장애 응답을 확인합니다. 실제 DB 권한 검증은 위 SQL 검사를 별도로 실행해야 합니다.

로컬에서 배포 빌드를 실행하려면 `npm run build` 후 `npm start`를 사용합니다. 운영 모드의 관리자 쿠키는 HTTPS에서만 전송되므로 관리자 기능의 최종 검증은 HTTPS Vercel 주소에서 진행하세요.

## 보안 구조

- 브라우저는 공개 키로 `id`, `title`, `content`, `created_at`만 조회합니다. `password_hash` 조회는 DB 열 권한으로 차단합니다. [Supabase 열 권한 문서](https://supabase.com/docs/guides/database/postgres/column-level-security)
- 생성과 삭제는 서버 API를 거칩니다. 생성 시 4자리 비밀번호를 bcrypt로 해시하고 서버 전용 키로 저장합니다. 공개 키로 직접 쓰기는 허용하지 않습니다.
- 일반 삭제는 서버에서 해시를 비교한 뒤 service role로 수행합니다.
- 관리자 인증과 삭제는 HttpOnly·SameSite 쿠키를 검증하는 서버 API에서만 수행합니다. 세션은 서버에서도 8시간 후 만료되며 관리자 해시 또는 세션 비밀키를 바꾸면 기존 세션이 무효화됩니다.
- `schema.sql`은 명시적 `GRANT`와 RLS 정책을 함께 적용합니다.
- 보드 내용은 공개입니다. 4자리 삭제 비밀번호는 열람 제한 기능이 아닙니다. 현재 앱 자체의 요청 횟수 제한은 없으므로 불특정 다수에게 공개할 경우 Vercel Firewall 등에서 작성·로그인·삭제 API의 반복 요청 제한을 설정하세요.
