# Aimee 도구 카탈로그

Aimee 앱이 "도구 찾기" 화면에 보여 주는 검토된 도구 목록입니다. 앱은 이 저장소의 **최신 릴리스**에 올라간 두 파일을 받습니다.

- `catalog.json`: 목록 본문
- `catalog.json.sig`: 그 본문의 ed25519 서명

```
https://github.com/beyondworks/aimee-catalog/releases/latest/download/catalog.json
https://github.com/beyondworks/aimee-catalog/releases/latest/download/catalog.json.sig
```

이 저장소에는 비밀 값이 없습니다. 서명용 비밀키는 발행하는 맥의 키체인과 발행 담당자의 비밀번호 관리자에만 있습니다.

## 앱이 받아들이는 조건

앱은 아래 조건을 모두 만족할 때만 새 목록을 씁니다. 하나라도 어긋나면 마지막 정상 목록(없으면 앱에 내장된 목록)을 계속 씁니다.

1. 서명이 앱에 고정된 공개키 중 하나로 맞습니다. 폐기된 키의 서명은 받지 않습니다.
2. 형식이 맞습니다(아래 "형식").
3. `version`이 앱이 이미 가진 판보다 큽니다. 예전 판을 다시 보내도 받지 않습니다.

목록은 하루에 한 번(앱 시작 1분 뒤 첫 시도) 받습니다. 실패하면 1시간, 6시간, 24시간 뒤에 다시 시도합니다.

## 형식

```json
{
  "version": 2,
  "signedAt": "2026-10-14",
  "items": [
    {
      "id": "example-pack",
      "name": "Example pack",
      "summary": "한 줄 설명",
      "kind": "skill-pack",
      "source": { "url": "https://github.com/owner/repo.git", "commit": "<40자리 git SHA>" },
      "license": "MIT",
      "needTier": "make",
      "permissions": ["files-read", "files-write"],
      "runners": ["claude-code", "codex"],
      "cpu": ["arm64", "x64"],
      "author": "owner",
      "reviewedAt": "2026-10-14"
    }
  ],
  "blocked": [],
  "revokedKeys": []
}
```

| 필드 | 규칙 |
|---|---|
| `version` | 1 이상의 정수입니다. 낼 때마다 1씩 올립니다. |
| `items[].id` | 영문 소문자·숫자·`.`·`_`·`-`로 씁니다. 한 번 정한 id는 바꾸지 않습니다(갱신과 차단이 id를 따라갑니다). |
| `items[].kind` | `skill-pack`, `mcp`, `connector`, `plugin` 중 하나입니다. 지금 앱이 설치하는 것은 `skill-pack`뿐입니다. |
| `items[].source` | `https://` 저장소 주소와 40자리 커밋 SHA입니다. 앱은 이 커밋만 설치합니다. |
| `items[].needTier` | `research`, `make`, `run`, `operate` 중 하나입니다. 빠지면 `operate`로 봅니다. |
| `items[].permissions` | `files-read`, `files-write`, `network`, `commands`, `browser` 중에서 고릅니다. 설치 전에 사용자에게 보여 줍니다. |
| `items[].cpu` | 생략하면 모든 CPU입니다. |

규칙에 맞지 않는 항목은 앱이 조용히 빼고, 나머지 항목만 씁니다.

## 차단 목록

`blocked`에 아래 중 하나를 넣으면, 이미 설치된 도구도 다음 갱신 때 꺼집니다. 파일은 지우지 않으며, 차단이 풀리기 전에는 사용자가 다시 켤 수 없습니다.

- 카탈로그 항목 id: `"example-pack"`
- 저장소 주소와 커밋: `"https://github.com/owner/repo.git@<40자리 SHA>"`

## 키 폐기

`revokedKeys`에 키 id를 넣으면, 앱은 그 뒤로 그 키의 서명을 받지 않습니다. 이 목록은 **다른 키**로 서명했을 때만 효력이 있습니다(유출된 키가 자기 자신을 폐기하거나 되살릴 수 없게 하기 위해서입니다).

## 발행 절차 (발행하는 맥)

처음 한 번만 키를 만듭니다.

```
node scripts/generate.mjs
```

- 운영 키는 키체인 항목 `aimee-catalog-signing` / `operating`에 저장됩니다.
- 예비 키는 키체인 임시 항목 `aimee-catalog-signing` / `backup-temporary`에 저장됩니다. 비밀번호 관리자로 옮긴 뒤 키체인에서 지웁니다.
- 출력은 두 공개키와 키 id뿐입니다. 공개키는 비밀이 아니며, Aimee 앱 코드에 고정합니다.

목록을 낼 때마다 아래 순서로 진행합니다.

1. `catalog.json`을 고치고 `version`을 1 올립니다.
2. `node scripts/sign.mjs catalog.json`으로 서명합니다. 옆에 `catalog.json.sig`가 생깁니다.
3. 커밋하고 릴리스를 만들어 두 파일을 올립니다.

```
gh release create v<version> catalog.json catalog.json.sig --title "catalog v<version>" --notes "<바뀐 점>"
```

키체인에 있는 키의 공개키를 다시 확인할 때는 `node scripts/pubkeys.mjs`를 씁니다(비밀키는 출력하지 않습니다).

## 사고 대응

| 상황 | 할 일 |
|---|---|
| 운영 키를 잃음(유출 아님) | 비밀번호 관리자의 예비 키를 키체인 `aimee-catalog-signing` / `backup` 항목으로 잠시 넣고(`security add-generic-password -s aimee-catalog-signing -a backup -w`, 값은 물을 때 붙여 넣기), `node scripts/sign.mjs catalog.json --key backup`으로 서명해 냅니다. 쓴 뒤 그 항목을 지웁니다. |
| 운영 키가 유출됨 | 예비 키로, `revokedKeys`에 운영 키 id를 넣은 목록을 서명해 냅니다. 앱은 그 뒤 운영 키 서명을 거부합니다. 다음 앱 판에서 키를 교체합니다. |
| 예비 키를 잃음(운영 키는 있음) | 아래 "예비 키를 잃었을 때" 순서대로 새 예비 키를 만듭니다. 잃은 예비 키는 비밀 값이 아무 데도 없으니 폐기 목록에 넣지 않아도 됩니다. |
| 두 키를 모두 잃음 | 새 앱 판을 내야 합니다. 그동안 앱은 내장 목록과 마지막 정상 목록으로 동작합니다. |

### 예비 키를 잃었을 때

운영 키가 키체인에 그대로 있고 예비 키의 비밀 값만 잃었을 때의 순서입니다. 운영 키는 건드리지 않습니다.
예비 키는 서명에 쓰지 않으므로 어느 맥에서 만들어도 됩니다. 만든 맥의 키체인에 임시 항목이 생깁니다.

1. 예비 키만 새로 만듭니다(어느 맥이든 됩니다).

   ```
   cd ~/aimee-catalog && git pull && node scripts/generate-backup.mjs
   ```

   - 키체인 임시 항목 `aimee-catalog-signing` / `backup-temporary`에만 넣습니다. 그 항목이 이미 있으면 아무것도 만들지 않고 멈춥니다.
   - 출력은 새 공개키와 키 id 한 줄입니다(비밀 값은 출력하지 않습니다). 이 줄을 Aimee 앱 담당에게 보냅니다.
2. 키체인 접근 앱에서 `Aimee catalog signing (backup-temporary)` 항목의 "암호 보기"로 값을 복사해 비밀번호 관리자에 새 항목으로 저장합니다.
3. **비밀번호 관리자에서 그 항목을 다시 열어 값이 들어 있는 것을 확인한 뒤에** 키체인의 임시 항목을 지웁니다.

   ```
   security delete-generic-password -s aimee-catalog-signing -a backup-temporary
   ```

4. Aimee 앱의 고정 공개키(`src/main/tools/catalog-keys.ts`)에서 옛 예비 키 줄을 새 키로 바꾼 판을 냅니다. 그 판을 쓰는 앱부터 새 예비 키 서명을 받아들입니다.

