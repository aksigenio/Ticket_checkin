# Мир Дверь Мяч — сайт продажи билетов

Отдельный проект в папке `mir-dver-myach-bilet` (старые файлы в корне репозитория не менялись).

## Возможности

- Схема зала с рядами **FILA A–H**, разделителем между блоком A–E и рядами F–H, цены по вашим правилам.
- Несколько мест в одном заказе: клики добавляют места в корзину, одна оплата и одно письмо покупателю со всеми местами.
- Форма: имя, фамилия, email, чек; реквизиты IBAN, Revolut и общая сумма.
- Данные сохраняются в **Supabase** (таблица доступна только вам через личный проект и service role).
- Чек загружается в **Storage** (bucket `receipts`).
- **SMTP** (Gmail, Outlook и др.): письма с вашего ящика — уведомление вам о заявке и билет покупателю после кнопки в админке. **Свой домен не нужен.**
- Страница **`/admin`**: после проверки оплаты кнопка **«Отправить билет»** шлёт покупателю письмо (текст + HTML) с рядом, местом и текстом благодарности. Если в папке **`email-assets/`** лежит **`ticket-poster.png`** или **`ticket-poster.jpg`**, та же афиша встраивается в письмо (вложение с `cid`).

## Почта без покупки домена (Gmail)

1. Включите **двухфакторную аутентификацию** в аккаунте Google.
2. **Google аккаунт → Безопасность → Пароли приложений** → создайте пароль для «Почта» / «Другое» (название произвольное).
3. В `.env.local` (шаблон — `.env.example`):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=ваш@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM="Мир Дверь Мяч <ваш@gmail.com>"
ADMIN_EMAIL=ваш@gmail.com
```

`MAIL_FROM` для Gmail лучше указывать с **тем же адресом**, что и `SMTP_USER`, иначе письма могут уходить в спам или отклоняться.

## Outlook / Microsoft 365

Рабочий аккаунт Microsoft 365:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

Личный **@outlook.com / @hotmail.com** часто лучше так:

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

```env
SMTP_USER=ваш@outlook.com
SMTP_PASSWORD=пароль_приложения_или_аккаунта
MAIL_FROM="Мир Дверь Мяч <ваш@outlook.com>"
ADMIN_EMAIL=ваш@outlook.com
```

У Microsoft свой раздел для паролей приложений, если включена 2FA.

## Афиша в письме с билетом

Положите файл афиши в **`email-assets/ticket-poster.png`** (или **`ticket-poster.jpg`** / **`ticket-poster.jpeg`**) и закоммитьте в репозиторий вместе с проектом — при выдаче билета из `/admin` картинка попадёт в HTML-письмо. Если файла нет, уходит только текст (plain + HTML без картинки).


1. Установите зависимости (нужны Node.js и npm):

```bash
cd mir-dver-myach-bilet
npm install
```

2. **Supabase**: создайте проект → SQL Editor → выполните `supabase/schema.sql`.

3. **Storage**: Storage → New bucket → имя **`receipts`**, **Private**.

4. Скопируйте `.env.example` в `.env.local` и заполните **SMTP_***, **ADMIN_EMAIL**, **ADMIN_PASSWORD**, **NEXT_PUBLIC_SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY**.

5. Запуск:

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Деплой

[Vercel](https://vercel.com): импорт репозитория, те же переменные в **Environment Variables** (включая пароль приложения в `SMTP_PASSWORD`).

## Важно по безопасности

- `SUPABASE_SERVICE_ROLE_KEY` и `SMTP_PASSWORD` только на сервере (`.env.local` / Vercel), не в Git.
- Пароль админки (`ADMIN_PASSWORD`) держите длинным и уникальным.
