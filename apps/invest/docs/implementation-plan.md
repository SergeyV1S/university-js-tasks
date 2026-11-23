# Invest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать учебное SPA для обзора рынка криптовалют, изучения монеты и оценки локального портфеля покупок.

**Architecture.** React Router Data Mode загружает начальные данные маршрутов. Actions Zustand управляют действиями после открытия экрана. Общий рыночный клиент нормализует ответы CoinGecko. Хранение покупок, синхронизация вкладок и расчёты выполняются в браузере. Основные проверки проходят через публичные маршруты и действия пользователя.

**Tech Stack.** TypeScript, React, React Router, Vite, Zustand, Chart.js, CoinGecko Demo API, `localStorage`, `BroadcastChannel`, Web Locks, Playwright.

**Spec:** [Спецификация](./spec.md) · [Учебное задание](./task.txt) · [Бизнес-требования](./business-requirements.md) · [Функциональные требования](./functional-requirements.md) · [Нефункциональные требования](./non-functional-requirements.md) · [Варианты использования](./use-cases.puml) · [Истории и критерии](./user-stories.puml)

## Global Constraints

- «Главная», «Детали монеты» и «Портфель» работают в одном HTML-документе. Интерфейс собственный, исходники на TypeScript, графики на сторонней библиотеке. Zustand хранит прикладное состояние, состояние компонентов ограничено взаимодействием с интерфейсом.
- Один бесплатный рыночный API поставляет каталог, цены, метрики, историю и данные для валютных пересчётов. Во внешних запросах присутствуют только параметры получения рыночных данных. Покупки, суммы и структура портфеля обрабатываются локально.
- Все строки из API выводятся явно через `textContent` или `innerText`. Поиск и обновление обходятся без полной замены `document.body` через `innerHTML`.
- Поиск запускается после паузы 300 мс через собственный debounce. Опрос главной через `setInterval` каждые 30–60 секунд. При первой загрузке используется Skeleton, при фоновом опросе — индикатор с сохранением видимости и прокрутки таблицы.
- Один портфель на профиль браузера, `localStorage` для покупок, `BroadcastChannel` для подтверждённых изменений. При первом открытии выбран RUB, доступен USD. Сохраняется курс USD/RUB на момент каждой покупки.
- Для НФТ-18–20 используется настольный Chrome 1440×900, одно устройство и контролируемые ответы API. Пересчёт при загруженных котировках занимает до 200 мс. Покупка появляется во второй одновременно видимой вкладке в течение 1 секунды.
- Профиль нагрузки — один пользователь, две вкладки, 200 покупок по 20 монетам, до 80% каждого применимого опубликованного лимита тарифа. Восстановление сети и хранилища оценивается по результату.
- Основные сценарии проверяются в Chrome и Firefox при 1280×720 и 1440×900 CSS-пикселей, в Chrome на Android при ширине 360 и в Safari на iOS при ширине 390. Обязательны управление с клавиатуры, видимый фокус, доступные имена и различимость знака изменения цены независимо от цвета.
- Объём портфеля ограничен учётом покупок и оценкой вложений. Границы по сделкам, кошелькам, редактированию, учётным записям, облачному хранению и аудиту заданы в разделе «За рамками». [Спецификация](./spec.md#за-рамками)

## Начальная загрузка и действия экрана

- Loader получает параметры маршрута, вызывает функции начального чтения и возвращает типизированные результаты. Общие операции чтения можно вызывать из loader и из actions Zustand. Передавай `request.signal` при начальных сетевых чтениях. Ожидаемые ошибки рынка и хранилища возвращай как результаты соответствующих блоков, чтобы экран сохранил доступные действия.
- Пока начальные данные загружаются, показывай Skeleton при прямом входе и при внутреннем переходе. Хуки подключают полученные данные к Zustand без повторной начальной загрузки. Не применяй результат отменённой навигации или устаревших параметров. При смене параметров внутри открытого экрана и при фоновых повторах используй actions Zustand. При уходе со страницы очищай таймеры и отменяй устаревшие чтения.
- Loader главной получает первую страницу топ-100 (20 монет) и глобальные метрики. Loader деталей проверяет ID и получает историю за семь дней и котировки конвертера для известной монеты. Loader портфеля читает снимок, загружает список монет для формы и, для непустого снимка, котировки оценки в начальной валюте. Сбой одного блока сохраняет возможность использовать другие доступные блоки.

## Review Focus

1. Две вкладки отправили формы с одной ревизией, а уведомление в одной задержалось. Хранилище сохраняет первую покупку, вторая форма позволяет повторить отправку. Задача 5.
2. Старый ответ поиска приходит после нового запроса или очистки строки. Таблица показывает последний запрос или топ-100. Задача 3.
3. Ответ за предыдущий период приходит после переключения графика. Активный период и данные остаются согласованными. Задача 4.
4. Купленная монета выпала из топ-100, а её актуальная цена равна 0. Монета участвует в расчёте как позиция с известной котировкой. Задача 6.
5. Вкладка ушла с главной во время ожидания `Retry-After`. Запланированный повтор главной не меняет текущий экран. Задача 7.

---

## Структура файлов

Пути в таблице относительно `apps/invest`. Вертикальные этапы объединены общей навигацией и одним рыночным клиентом. После каждого этапа его сценарий доступен для проверки в рабочем приложении или через HTTP-контракт.

| Файлы                                                                                                                                                                                                                                        | Ответственность                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `playwright.config.ts`                                                                                                                                                      | npm workspace, HTML-вход, проверка типов, сборка и запуск браузерных проверок. Корневой `package-lock.json` обновляется при установке зависимостей. |
| `src/main.tsx`, `src/app/{App.tsx,router.tsx,styles.css}`, `src/shared/constants/router-paths.ts`, `src/shared/ui/ApiText.tsx`                                                                                                               | Запуск SPA, сборка маршрутов, навигация, общие стили и буквальный вывод строк поставщика.                                                           |
| `src/shared/market/client.ts`, `src/shared/market/resource.ts`                                                                                                                                                                               | Контракт с поставщиком, затем единый жизненный цикл рыночного блока и политика повторов.                                                            |
| `src/pages/home/{page.tsx,route.ts,index.ts,homeStore.ts,helpers/selectRows.ts,helpers/debounce.ts}`                                                                                                                                         | Таблица, метрики, опрос, управление поиском и отбор строк.                                                                                          |
| `src/pages/coin/{page.tsx,route.ts,index.ts,coinStore.ts,helpers/converter.ts}`                                                                                                                                                              | История цены, состояние деталей и пересчёт количества.                                                                                              |
| `src/pages/portfolio/{page.tsx,route.ts,index.ts,portfolioStore.ts,storage.ts,helpers/valuation.ts,components/PortfolioSummary.tsx}`                                                                                                         | Форма, действия с покупками, запись и согласование вкладок, оценка и круговая диаграмма.                                                            |
| `tests/navigation.spec.ts`, `tests/market-client.test.ts`, `tests/market-fixture.ts`, `tests/home.spec.ts`, `tests/coin.spec.ts`, `tests/portfolio.spec.ts`, `tests/valuation.spec.ts`, `tests/recovery.spec.ts`, `tests/acceptance.spec.ts` | Контракт поставщика, управляемые рыночные ответы, браузерные сценарии и измерения.                                                                  |

Команды запускаются из корня. В `apps/invest/package.json` задать `dev` как `vite --host 127.0.0.1 --port 4174 --strictPort`, `build` как `npm run typecheck && vite build`, `typecheck` как `tsc --noEmit`, `test:market` как `node --test tests/market-client.test.ts`, `test:e2e` как `playwright test`. Коммит каждого этапа включает только перечисленные в его разделе изменения. Проверки используют данные из тестов, а реальный API используется при проверках подключения и фактического расхода квоты.

## Задача 1. Навигация SPA

**Требования** ФТ-01, ФТ-10 в части открытия прямого маршрута, НФТ-01–03, НФТ-06–07, НФТ-12–13, НФТ-28–30. US-01 и UC-01.

**Файлы** `apps/invest/{package.json,index.html,tsconfig.json,vite.config.ts,playwright.config.ts}`, `apps/invest/src/main.tsx`, `apps/invest/src/app/{App.tsx,router.tsx,styles.css}`, `apps/invest/src/shared/constants/router-paths.ts`, модули страниц с `page.tsx`, `route.ts` и `index.ts`, `apps/invest/tests/navigation.spec.ts` и корневой `package-lock.json`.

**Интерфейсы** `createBrowserRouter` собирает маршруты `/`, `/coin/:coinId` и `/portfolio`, экспортируемые модулями страниц. `App` показывает общую навигацию и `Outlet`. Ссылки на монеты формируются из шаблона `PATHS.COIN` и кодированного ID.

- [ ] Подготовить npm workspace с `"type": "module"`, зависимости TypeScript, React, React DOM, React Router, Zustand, Vite и Playwright. Установить Chromium и Firefox командой `npm exec -w invest -- playwright install chromium firefox`. В Playwright задать `testDir: './tests'`, `testMatch: '**/*.spec.ts'`, `webServer.command: 'npm run dev'`, `webServer.url` и `use.baseURL` как `http://127.0.0.1:4174`, `webServer.env.VITE_INVEST_MARKET_BASE: '/api/v3/'`. Включить пустую точку входа для первого запуска проверки.
- [ ] Написать `switches_screens_in_one_document`.

  ```ts
  await expect(page.getByRole("heading", { name: "Главная" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Портфель" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Детали монеты" })).toBeVisible();
  expect(await page.evaluate(() => window.navigationMarker)).toBe("same-document");
  ```

  Открыть `/coin/bitcoin` напрямую. Установить маркер, перейти между экранами с клавиатуры и вернуться через историю браузера. Сверить адреса, сохранность маркера и доступные имена ссылок.

- [ ] Запустить `npm run test:e2e -w invest -- navigation.spec.ts`. Ожидание RED — первый экран отсутствует.
- [ ] Реализовать `App`, маршруты и общую навигацию. На этом этапе достаточно заголовков экранов. Оставить стили собственными и добавить видимый фокус для навигации.
- [ ] Повторить браузерную проверку и выполнить `npm run build -w invest`. Ожидание GREEN — тест и сборка проходят.
- [ ] Настроить SPA fallback на хостинге сборки. Проверить прямое открытие и перезагрузку `/coin/bitcoin` и `/portfolio` на опубликованной сборке.
- [ ] Сделать коммит `feat(invest): add SPA navigation`.

## Задача 2. Подключение рыночного API

**Требования** ФТ-02, ФТ-05, ФТ-08, ФТ-11, ФТ-23, ФТ-40, ФТ-57, НФТ-05, НФТ-26.

**Файлы** Создать `apps/invest/src/shared/api/{client.ts,instance.ts,requests.ts}`, `apps/invest/tests/api-client.test.ts`, `apps/invest/tests/market-fixture.ts`.

**Интерфейсы** `createApiClient({ baseUrl, apiKey, adapter? }): MarketClient` создаёт экземпляр Axios. Все методы получают последним аргументом опциональный `{signal: AbortSignal}`. `Coin` содержит `{id: string, name: string, rank: number|null, price: number|null, change24h: number|null, marketCap: number|null}`. `MarketError` содержит `{kind: 'rate-limit'|'network'|'not-found'|'http'|'invalid-response', status?: number, retryAt?: number}`. Отмена сохраняет `AbortError`.

`installMarketFixture(context: BrowserContext, respond: (url: URL) => FixtureResponse | Promise<FixtureResponse>): Promise<{requests: RecordedRequest[]}>`. `FixtureResponse` содержит `{status: number, json?: unknown, headers?: Record<string, string>}` или `{abort: true}`. `RecordedRequest` содержит `{url: string, method: string, body: string|null, atMs: number, status: number|null}`. Перехват действует в обеих вкладках контекста.

| Метод и результат                                                                                                        | Запрос                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `getCatalog(options?): Promise<Array<{id: string, name: string}>>`                                                       | `/coins/list` с активным каталогом, без платформ.                                           |
| `getMarkets(ids?: string[], options?): Promise<Coin[]>` | `/coins/markets` в USD. Без ID возвращает 20 монет по капитализации, `options.page` по умолчанию равен 1. Для списка ID запросы делятся на партии с учётом ограничений параметра и URL. |
| `getGlobal(options?): Promise<{marketCap: number                                                                         | null, marketCapChange24h: number                                                            | null, volume24h: number | null}>` | `/global`, поля `total_market_cap.usd`, `market_cap_change_percentage_24h_usd`, `total_volume.usd`. |
| `getHistory(id: string, days: 1\|7\|30\|365, options?): Promise<Array<[number, number]>>`                                | `/coins/{id}/market_chart`, `vs_currency=usd`, `days`, массив `prices`.                     |
| `getPrices(ids: string[], currencies: Currency[], options?): Promise<Record<string, Partial<Record<Currency, number>>>>` | `/simple/price`, список ID и валют. `Currency` равен `USD\|EUR\|BTC\|RUB`.                  |
| `getExchangeRates(options?): Promise<Partial<Record<Currency, number>>>`                                                 | `/exchange_rates`, `rates.*.value` для USD/EUR/BTC/RUB, единиц валюты за 1 BTC.             |

- [x] Проверить подключение из браузера от origin приложения с действующим Demo-ключом и заголовком `x-cg-demo-api-key`. Проверить каталог, поиск по ID вне топ-100, выбранные метрики, историю на 365 дней, `simple/price` в нужных валютах, `rates.usd` и `rates.rub` и доступность `Retry-After` для JavaScript при наличии заголовка в ответе. Зафиксировать CORS, актуальные лимиты и правила учёта. На дату плана опубликованы 100 запросов в минуту и 10 000 кредитов в месяц. Приёмочные пороги на этих лимитах — 80 запросов в минуту и 8 000 кредитов в месяц. Все статусы учитываются в минутном лимите, HTTP 200 — в месячных кредитах. Если прямая интеграция не подтверждается, зафиксировать расхождение до выбора другого допустимого варианта. [Авторизация](https://docs.coingecko.com/demo/reference/authentication) · [Лимиты тарифа](https://www.coingecko.com/en/api/pricing) · [Правила учёта](https://support.coingecko.com/articles/1864417806-how-does-coingecko-api-count-the-api-usage-credit)
- [x] Написать `normalizes_market_payloads_and_errors` в `market-client.test.ts`. Моделировать HTTP через адаптер Axios, зафиксировать тестовое время для `Retry-After`. В `market-fixture.ts` реализовать `installMarketFixture` с перехватом запросов к `/api/v3/` на тестовом origin.

  ```ts
  assert.equal(top[0].rank, 1);
  assert.equal(markets[0].price, 0);
  assert.equal(markets[1].marketCap, null);
  assert.equal(historyQuery.get("days"), "365");
  assert.deepEqual(emptyHistory, []);
  assert.equal(rates.RUB / rates.USD, 90);
  assert.deepEqual([error.kind, error.status, error.retryAt], ["rate-limit", 429, now + 45_000]);
  ```

  Дополнить проверками временной метки HTTP-date, `AbortError`, сетевого сбоя, 404, неполных котировок и повторяющихся ID. Убедиться, что запросы используют только рыночные параметры и что заголовок API не попадает в URL.

- [x] Запустить `npm run test:market -w invest`. Ожидание RED — клиент отсутствует.
- [x] Реализовать методы таблицы и явную нормализацию отсутствующих полей. Сохранить нулевые цены. Для `Retry-After` поддержать секунды и HTTP-date. В `client.ts` экспортировать экземпляр `marketClient`, читающий базовый URL из `VITE_INVEST_MARKET_BASE` с URL CoinGecko по умолчанию. Для локальной учебной приёмки Demo-ключ передаётся в браузер на время сеанса через `sessionStorage` с ключом `invest:market-demo-key`. Тесты задают `VITE_INVEST_MARKET_BASE=/api/v3/`, действующий ключ в сборку и репозиторий не включается. [Каталог](https://docs.coingecko.com/demo/reference/coins-list) · [Рыночные поля](https://docs.coingecko.com/demo/reference/coins-markets) · [Метрики](https://docs.coingecko.com/demo/reference/crypto-global) · [История](https://docs.coingecko.com/demo/reference/coins-id-market-chart) · [Котировки](https://docs.coingecko.com/demo/reference/simple-price) · [Курсы](https://docs.coingecko.com/demo/reference/exchange-rates)
- [x] Повторить `npm run test:market -w invest`. Ожидание GREEN — проходят проверки сущностей, запросов, чисел и ошибок.
- [x] Сделать коммит `feat(invest): add CoinGecko Demo client`.

**Проверка 22.11.2026.** Chromium на `http://127.0.0.1:4174` с Demo-ключом в заголовке получил топ-100, активный каталог, рыночные поля монеты вне топ-100, глобальные метрики, историю Bitcoin за 365 дней, цены в USD/EUR/BTC/RUB и курсы USD/RUB. Успешный CORS preflight разрешил `x-cg-demo-api-key`. При проверке котировок и курсов CoinGecko вернул на preflight HTTP 429 с `Retry-After: 41` без `Access-Control-Allow-Origin`. JavaScript получил сетевую ошибку, и GET-запросы браузер не отправил. После паузы обе операции вернули HTTP 200. Их ответы открывали через CORS заголовки `link`, `per-page` и `total`. Чтение `Retry-After` проверено отдельно на тестовых ответах 429.

CoinGecko публикует для Demo 100 запросов в минуту и 10 000 кредитов в месяц. Для приёмки действуют пороги 80 запросов в минуту и 8 000 кредитов в месяц. В минутный лимит входят все статусы, в месячную квоту — HTTP 200. Клиент ограничивает партии 250 ID для `coins/markets` и 515 ID для `simple/price`, а длину закодированного URL — 2 000 символами. [Тариф](https://www.coingecko.com/en/api/pricing) · [Учёт запросов](https://support.coingecko.com/articles/1864417806-how-does-coingecko-api-count-the-api-usage-credit) · [Партии рыночных данных](https://support.coingecko.com/articles/6611130216-can-i-batch-call-multiple-tokens-current-price-data) · [Котировки](https://docs.coingecko.com/demo/reference/simple-price)

Локальный Vite dev-сервер читает `INVEST_MARKET_DEMO_KEY` из игнорируемого `apps/invest/.env`. Опубликованная учебная сборка читает ключ из `sessionStorage` по имени `invest:market-demo-key`.

## Задача 3. Главная, поиск и рыночные метрики

**Требования** ФТ-02–09, ФТ-28–29, ФТ-35–36, НФТ-10, НФТ-14, НФТ-16–17, НФТ-31. US-02–06 и UC-02–06.

**Файлы** Изменить `apps/invest/src/pages/home/{page.tsx,route.ts}` и `apps/invest/src/app/styles.css`. Создать `apps/invest/src/pages/home/{homeStore.ts,helpers/selectRows.ts,helpers/debounce.ts}`, `apps/invest/src/shared/ui/ApiText.tsx` и `apps/invest/tests/home.spec.ts`.

**Интерфейсы** `HomePage(): JSX.Element`. `selectRows(rows: Coin[], {min: number|null, max: number|null, sort: {key: 'rank'|'name'|'price'|'change24h'|'marketCap', direction: 'asc'|'desc'}}): Coin[]`. `debounce(fn, delayMs: number)` возвращает вызываемую функцию с методом `cancel(): void`. `useHomeStore` предоставляет `setInitialData(data: HomeInitialData): void`, `setQuery(value: string): void`, `setRange(min: string, max: string): void`, `sortBy(key): void`, `refresh(): Promise<void>` и `stop(): void`. `ApiText({value}: {value: string}): JSX.Element` создаёт текстовый узел назначением `textContent` элементу через ref.

- [x] Написать `shows_top_100_and_searches_full_catalog`, `combines_price_and_sort`, `explains_metrics` и `ignores_late_search`. До первого ответа проверить Skeleton. Задать управляемые таймеры и два ответа поиска с обратным порядком завершения.

  ```ts
  await expect(coinRows).toHaveCount(100); // каталог содержит 105 монет с рангами
  await expect(exampleCoin).toBeVisible(); // PLEco находит ранг 120
  expect(searchRequestsAt299ms).toBe(0);
  expect(sortedSearchRows).toEqual(expectedFirst100Of120);
  expect(pricesByFixture).toEqual([
    [10, 20],
    [5, 10, 20],
    [10, 20, 25]
  ]);
  await expect(apiName).toHaveText("<b>Пример</b>");
  await expect(metricCards).toHaveCount(4);
  await expect(coinRows).toHaveText(latestQueryNames);
  ```

  Проверить очистку поиска при активных фильтре и сортировке, включая очистку до завершения запроса, нечисловые и отрицательные границы, пропуски при фильтрации и сортировке, оба направления на пяти столбцах, знаки и цвета `+2%`, `−2%`, `0%`, состояние «ничего не найдено». Проверить открытие и закрытие пояснений мышью, с клавиатуры и касанием, включая касание вне пояснения.

- [x] Запустить `npm run test:e2e -w invest -- home.spec.ts`. Ожидание RED — таблица и поиск отсутствуют.
- [x] Подключить loader главной к общему клиенту и передать его результаты в `HomePage` и `useHomeStore`. При прокрутке догружать по 20 монет, добавлять уникальные ID и останавливаться на странице 5. После 300 мс `setQuery` ищет подстроку по полному каталогу без учёта регистра и запрашивает рыночные поля по всем совпавшим ID, переиспользуя доступные данные. Если записи из каталога нет в рыночном ответе, сохранить название и ID с отсутствующими полями. Фильтр с включёнными границами и сортировка применяются ко всем совпадениям поиска или к загруженным монетам топа. При очистке вернуть уже загруженные монеты топа и сохранить фильтр и сортировку. Смена запроса отменяет старую выдачу, а проверка текущего запроса перед записью защищает от уже завершившегося устаревшего ответа. На главной отобразить четыре карточки по Figma: капитализацию рынка с изменением за сутки, объём торгов за 24 часа, долю Bitcoin и долю Ethereum. Доли берутся из `market_cap_percentage` ответа `/global`. Названия монет ведут в детали.
- [x] Повторить `npm run test:e2e -w invest -- home.spec.ts navigation.spec.ts`. Ожидание GREEN — поиск, таблица, метрики и навигация проходят.
- [x] Сделать коммит `feat(invest): build market overview and search`.

## Задача 4. Детали монеты, история и конвертер

**Требования** ФТ-10–13, ФТ-28, ФТ-37–42, ФТ-50, НФТ-04, НФТ-20. US-08–10 и UC-08–10.

**Файлы** Создать `apps/invest/src/pages/coin/{coinStore.ts,helpers/converter.ts}` и `apps/invest/tests/coin.spec.ts`. Изменить `apps/invest/src/pages/coin/{page.tsx,route.ts}`, `apps/invest/src/app/styles.css`, `apps/invest/package.json` и корневой `package-lock.json`.

**Интерфейсы** `CoinPage` получает ID и начальные данные из loader. `useCoinStore` предоставляет `setInitialData(data: CoinInitialData): void`, `setPeriod(days: 1|7|30|365): Promise<void>`, `setQuantity(raw: string): void`, `setCurrency(currency: 'USD'|'EUR'|'BTC'): void`, `stop(): void`. `formatConversion(raw: string, currency: 'USD'|'EUR'|'BTC', quotes: Partial<Record<Currency, number>>, rates: Partial<Record<Currency, number>>): string`. На вход передаются цены одной монеты и единицы валюты за 1 BTC из задачи 2.

- [x] Написать `opens_known_and_unknown_urls`, `shows_selected_history`, `converts_loaded_prices` и `ignores_late_history`. Проверить начальный Skeleton, два известных URL, неизменный неизвестный URL и кнопку возврата. Проверить запросы всех четырёх периодов, пустой ответ, ошибку, успешное переключение после обоих состояний и запоздавший ответ предыдущего периода.

  ```ts
  expect(requestedPeriods).toEqual([7, 1, 7, 30, 365]);
  await expect(page.getByText("Монета не найдена")).toBeVisible();
  await expect(page.getByText("За этот период нет данных")).toBeVisible();
  await expect(conversion).toHaveText("80,00 EUR"); // 100 USD, 1 EUR = 1,25 USD
  expect(formattedExamples).toEqual([
    "12,00 USD",
    "1,25 EUR",
    "0,12500000 BTC",
    "< 0,01 USD",
    "< 0,00000001 BTC"
  ]);
  expect(invalidQuantity).toEqual(["0,00 USD", "0,00 EUR", "0,00000000 BTC"]);
  await expect(conversion).toHaveText("Курс недоступен");
  ```

  Проверить начальное количество 1, ввод 2,5, приоритет прямой котировки, независимость валют и нулевой результат для пустого ввода, текста, нуля и отрицательного значения при загруженных ценах. При загрузке 1 дня и последующем выборе 30 дней задержанный ответ 1 дня не меняет график за 30 дней.

- [x] Запустить `npm run test:e2e -w invest -- coin.spec.ts`. Ожидание RED — экран подробностей показывает только заголовок.
- [x] Подключить Chart.js, `CoinPage` и loader деталей. Каталог определяет существование ID. Ошибка его загрузки остаётся ошибкой данных. Отображать выбранный временной ряд в USD, управлять запросом истории по паре ID и периода. Ошибка истории предлагает другой период. Конвертер запрашивает прямые котировки единым запросом, при отсутствии нужной использует курс из того же API и формулу `priceUSD × rates[currency] / rates.USD`. Когда котировки загружены, смена количества пересчитывает результат локально. Положительную сумму меньше шага распознать до округления.
- [x] Повторить `npm run test:e2e -w invest -- coin.spec.ts navigation.spec.ts`. Ожидание GREEN — переходы, адреса, история и конвертация проходят.
- [x] Сделать коммит `feat(invest): add coin history and converter`.

## Задача 5. Добавление покупок, хранилище и вкладки

**Требования** ФТ-14–15, ФТ-19–23, ФТ-43–47, ФТ-53–58, НФТ-08–09, НФТ-19, НФТ-24. US-11–12, US-15–16 и UC-11–12, UC-15–16.

**Файлы** Создать `apps/invest/src/pages/portfolio/{portfolioStore.ts,storage.ts}` и `apps/invest/tests/portfolio.spec.ts`. Изменить `apps/invest/src/pages/portfolio/{page.tsx,route.ts}` и `apps/invest/src/app/styles.css`.

**Интерфейсы** `Purchase = {coinId: string, quantity: number, unitPrice: number, currency: 'RUB'|'USD', rubPerUsd: number}`. `PortfolioSnapshot = {revision: number, purchases: Purchase[]}`. `readPortfolio(): PortfolioSnapshot` читает ключ `invest:portfolio`, отсутствие ключа даёт ревизию 0 и пустой список. `appendPurchase(purchase: Purchase, expectedRevision: number): Promise<{kind: 'saved'|'conflict', snapshot: PortfolioSnapshot}>`. `subscribePortfolio(onChange: (snapshot: PortfolioSnapshot) => void, onError: (error: Error) => void): () => void`. `usePortfolioStore` предоставляет `setInitialData(data: PortfolioInitialData): void`, `retryRead(): Promise<void>`, `close(): void`, `setCurrency(currency: 'RUB'|'USD'): void`, `submit(draft: {coinId: string, quantity: string, unitPrice: string}): Promise<'saved'|'rejected'|'ignored'>` и состояние `snapshot`, `currency`, статусы чтения и сохранения и ошибки полей. `PortfolioPage(): JSX.Element` использует этот store и очищает поля только при `saved`.

- [x] Написать `adds_persists_and_retries_purchase` и `recovers_from_storage_error`. Открыть пустой портфель напрямую. Проверить поиск в форме по названию, доступность рангов 1 и 100 и отсутствие ранга 101. Отдельно проверить отсутствие выбора и значения `''`, текст, `0`, отрицательные числа. При отказе сверить сохранность полей и ошибки рядом с полями.

  ```ts
  await expect(page.getByText("Портфель пока пуст")).toBeVisible();
  await expect(portfolioCurrency).toHaveValue("RUB");
  expect(saved.purchases).toEqual([
    { coinId: "coin-1", quantity: 0.5, unitPrice: 25.75, currency: "RUB", rubPerUsd: 90 }
  ]);
  await expect(page.getByText("Курс USD/RUB недоступен")).toBeVisible();
  await expect(page.getByRole("button", { name: "Сохранить покупку" })).toBeEnabled();
  expect(restored.purchases).toEqual(confirmed.purchases);
  ```

  Двойная отправка при задержанном курсе даёт одну запись. После успеха форма очищается, ещё одна такая же отправка даёт вторую запись. При сбое курса после успешной прошлой покупки, отсутствии RUB в успешном ответе и ошибке записи форма и прежние покупки сохраняются, успешный повтор добавляет одну запись. При сбое чтения «Повторить» восстанавливает все подтверждённые записи и доступность формы. Проверить перезагрузку, повторное открытие, отдельный контекст и отсутствие данных покупок в рыночных запросах.

- [x] Написать `syncs_purchases_in_both_directions` и `preserves_first_purchase_on_conflict`. Открыть две страницы одного контекста. Для конфликта задержать второй ответ курса, начать обе отправки на одной ревизии, дождаться подтверждения первой, затем отпустить второй ответ. Доставку сообщения во вторую вкладку в этом тесте задержать до её попытки записи, сохранив обычный `BroadcastChannel` в тесте синхронизации.

  ```ts
  expect(afterConflict.purchases).toEqual([firstPurchase]);
  await expect(secondTab.getByLabel("Количество")).toHaveValue("0,5");
  await expect(secondTab.getByRole("status")).toContainText("Повторите сохранение этой покупки.");
  expect(afterRetry.purchases).toEqual([firstPurchase, secondPurchase]);
  ```

- [x] Запустить `npm run test:e2e -w invest -- portfolio.spec.ts`. Ожидание RED — форма и сохранение отсутствуют.
- [x] Реализовать хранилище. Под эксклюзивным `navigator.locks.request('invest:portfolio-write', …)` перечитать текущую ревизию, сравнить с ревизией на момент отправки и при совпадении записать новый снимок с `revision + 1`. Ответ о конфликте содержит актуальный снимок. Первый результат определяется успешной записью. После записи опубликовать новую ревизию в `BroadcastChannel('invest:portfolio')`. Получатель перечитывает `localStorage` и применяет только более новую ревизию. При ошибке чтения показать «Повторить», при ошибке записи сохранить прежнюю версию и поля. Проверить Web Locks на localhost или HTTPS и во всех целевых браузерах. При отсутствии Web Locks показывать портфель при доступном чтении, блокировать добавление и пояснять причину. Отметить приёмку сохранения на этой платформе как незавершённую. Отказ отправки уведомления после записи обрабатывать отдельно, сохраняя успешный результат покупки. Перечитывать снимок при возвращении во вкладку и применять только более новую ревизию. [Web Locks API](https://www.w3.org/TR/web-locks/)
- [x] Подключить loader портфеля к чтению снимка и загрузке страниц 1–5 через `getMarkets`, а форму к Zustand. Поиск в форме использует загруженный топ-100 и сохраняет выбранную монету по ID. Количество и цена принимают целые и дробные числа с точкой или запятой в полях с `inputMode="decimal"`. После валидации зафиксировать значения, валюту и ревизию до запроса курса. На время операции повторная отправка возвращает `ignored`. Применимым считать результат успешного запроса `/exchange_rates`, начатого для текущей отправки, с конечными положительными `RUB` и `USD` и конечным положительным отношением `RUB / USD`. При сбое курса или записи вернуть `rejected` с сохранением формы. Вернуть `saved` после успешного `appendPurchase`.
- [x] Проверить отсутствие Web Locks и сбой уведомления после записи. При сбое уведомления покупка сохраняется один раз, форма очищается как при успехе, а вторая вкладка догоняет актуальный снимок при возвращении.
- [x] Повторить `npm run test:e2e -w invest -- portfolio.spec.ts`. Ожидание GREEN — сохранение, повтор, чтение и конфликт работают.
- [x] Сделать коммит `feat(invest): add local purchases and tab sync`.

Проверка на localhost прошла в Chromium, Firefox и WebKit. Мобильный сценарий проверен в эмуляции Android и iOS. Проверка на физических устройствах входит в сквозную приёмку.

## Задача 6. Стоимость, PnL и структура портфеля

**Требования** ФТ-16–18, ФТ-22–24, ФТ-47–50, ФТ-57, НФТ-04, НФТ-25. US-13–16 и UC-13–16.

**Файлы** Создать `apps/invest/src/pages/portfolio/{components/PortfolioSummary.tsx,helpers/valuation.ts}` и `apps/invest/tests/valuation.spec.ts`. Изменить `apps/invest/src/pages/portfolio/{page.tsx,route.ts,portfolioStore.ts}` и `apps/invest/src/app/styles.css`.

**Интерфейсы** `calculateValuation(purchases: Purchase[], prices: Record<string, number>, currency: 'RUB'|'USD'): Valuation`. `Valuation` — `{kind: 'empty'}` или `{kind: 'missing', missingIds: string[]}` или `{kind: 'ready', total: number, costs: number, pnl: number, allocations: Array<{coinId: string, percent: number}>}`. При нулевой стоимости `allocations` пуст. `PortfolioSummary({valuation, currency}: {valuation: Valuation, currency: 'RUB'|'USD'}): JSX.Element|null`. Дополнить `usePortfolioStore` действием `loadQuotes(): Promise<void>`.

- [x] Написать `values_purchases_in_both_currencies`, `distinguishes_missing_and_zero_prices` и `handles_200_purchases_across_two_tabs`. Для PnL использовать контрольные покупки 2 × 100 и 3 × 20 и котировки для стоимости 270, 250 и 260. Для долей — позиции 240 и 30. Для валют — покупки на 100 USD по курсу 90 и 10 000 RUB по курсу 100 при текущем курсе 110. Проверить те же затраты после повторного открытия.

  ```ts
  expect(shownPnls).toEqual([10, -10, 0]);
  expect(shownShares[0]).toBeCloseTo((100 * 240) / 270, 2);
  expect(shownShares[1]).toBeCloseTo((100 * 30) / 270, 2);
  expect(costsByCurrency).toEqual({ USD: 200, RUB: 19_000 });
  expect(zeroValuation).toEqual({ total: 0, pnl: -200 });
  await expect(page.getByText("Доли недоступны при нулевой стоимости портфеля")).toBeVisible();
  expect([firstTabPurchaseCount, secondTabPurchaseCount]).toEqual([200, 200]);
  ```

  Затраты получить из разности показанных стоимости и PnL, доли — из подписей диаграммы. Покупка с ID вне топ-100 сперва остаётся без котировки, затем получает цену 0. До появления цены проверить имя монеты и три недоступных результата, после — известную нулевую цену и сводку. Пустой портфель скрывает сводку и диаграмму. При изменении цены проверить новые доли. В двух вкладках начать со 199 покупок по 20 монетам, добавить 200-ю по уже представленной монете и сверить расчёты с полным набором.

- [x] Запустить `npm run test:e2e -w invest -- valuation.spec.ts`. Ожидание RED — сводка и диаграмма отсутствуют.
- [x] Реализовать `calculateValuation`. Получать актуальные цены всех уникальных купленных ID при открытии через loader, а при смене валюты и изменении покупок через actions Zustand, включая запись из второй вкладки. Для затрат использовать валюту и `rubPerUsd` каждой покупки. Формула PnL — стоимость минус затраты. Доли агрегировать по ID и считать от текущей стоимости. В `PortfolioSummary` отрисовать круговую диаграмму Chart.js с процентами и доступными текстовыми подписями при положительной стоимости, а состояния недоступности показать по ФТ-47–49. Названия купленных монет брать из каталога и выводить через `ApiText`. При отсутствии названия использовать ID. Запоздавший ответ для другой валюты или набора монет не меняет текущую сводку.
- [x] Повторить `npm run test:e2e -w invest -- valuation.spec.ts portfolio.spec.ts`. Ожидание GREEN — стоимость, PnL, доли и прежние сценарии покупки проходят.
- [x] Сделать коммит `feat(invest): calculate portfolio valuation and allocation`.

## Задача 7. Фоновый опрос и восстановление данных

**Требования** ФТ-25–28, ФТ-30–34, ФТ-39, ФТ-50–52, НФТ-11, НФТ-15, НФТ-18, НФТ-22–23, НФТ-26. US-07, US-17 и UC-07, UC-17.

**Файлы** Создать `apps/invest/src/shared/market/resource.ts` и `apps/invest/tests/recovery.spec.ts`. Изменить `apps/invest/src/shared/market/client.ts`, loaders и actions трёх страниц, `apps/invest/src/pages/portfolio/components/PortfolioSummary.tsx` и `apps/invest/src/app/styles.css`.

**Интерфейсы** `createMarketResource({load, onState, retainOnFailure}): {run(): Promise<void>, stop(): void}`. `load(signal: AbortSignal): Promise<T>` и `onState(state: {status: 'initial'|'refreshing'|'ready'|'unavailable'|'stale', data: T|null, error: MarketError|null}): void` задаются action соответствующего экрана. `retainOnFailure` включается для таблицы, карточек, конвертера и оценки. `stop()` отменяет активный запрос и таймер повтора для текущего блока.

- [x] Написать `polls_without_hiding_or_resetting_the_table`, `recovers_from_429_and_network_failure` и `stops_obsolete_retries_on_navigation`. Использовать управляемое время и задержанные HTTP-ответы, проверить таблицу и карточки отдельно. После успешного первого ответа ждать 60 секунд, задержать следующий запрос больше одного интервала и проверить пропуск пересекающегося опроса. На деталях и в портфеле при неизменных параметрах проверить отсутствие периодического опроса.

  ```ts
  expect(pollIntervalMs).toBe(60_000);
  expect(concurrentUpdates).toBe(1);
  expect(scrollOffsets).toEqual([600, 400]);
  await expect(table).toBeVisible();
  await expect(initialSkeleton).toHaveCount(0);
  await expect(block).toContainText("Данные временно недоступны");
  await expect(block).toContainText("Могут быть устаревшими");
  expect(retryAt - received429At).toBeGreaterThanOrEqual(45_000);
  await expect(block).not.toContainText("Могут быть устаревшими");
  expect(obsoleteRetriesAfterLeavingHome).toBe(0);
  ```

  Для смещений использовать старое 600 и новые максимумы 800 и 400. Проверить индикатор при видимой таблице и его исчезновение после завершения. Воспроизвести 429 и сетевой сбой при первой загрузке и при наличии данных, включая конвертер и портфель. Проверить уведомление и доступность навигации. История показывает ошибку и оставляет смену периода. После пяти минут отсутствия сети восстановить доступ и дождаться свежих данных без действий пользователя. Во второй вкладке проверить соблюдение общего срока ожидания после полученного в первой вкладке HTTP 429. Уйти с главной во время `Retry-After` и подтвердить, что актуальный экран сохраняется. Задержать начальный запрос loader, сменить маршрут и проверить отмену запроса и сохранность текущего экрана. При успешном входе проверить, что подключение экрана к Zustand не дублирует начальные запросы.

- [x] Запустить `npm run test:e2e -w invest -- recovery.spec.ts`. Ожидание RED — опрос или автоматическое восстановление отсутствует.
- [x] Подключить `createMarketResource` к рыночным actions. Передавать им начальные результаты loader, включая ошибки, которые требуют фонового повтора. Хранить последние успешные значения по активным параметрам. При `rate-limit` или `network` уведомить, завершить первую загрузку в состоянии `unavailable` либо показать сохранённые данные как `stale`. Для графика использовать сообщение об ошибке и выбор периода. Планировать один повтор на блок с задержкой 2, 4, 8, 16, 32, затем максимум 60 секунд при продолжающемся сбое. Для 429 время запуска — максимум срока из `Retry-After` и задержки повтора. В `client.ts` проверять срок перед отправкой запроса. В профиле с одним Demo-ключом передавать этот срок между активными вкладками через `BroadcastChannel('invest:market-cooldown')`, сохраняя максимальное полученное значение. Успех сбрасывает задержку и отметку для обновлённого блока. Отправку покупки повторяет пользователь по ФТ-58, фоновые повторы охватывают чтение рыночных данных.
- [x] В `homeStore` добавить `startPolling(): void` и `stopPolling(): void`. `setInterval` с 60 000 мс активен на главной. Опрос обновляет выбранную выборку таблицы и карточки, пропускает незавершённый цикл и освобождает таймер при выходе с экрана. В `HomePage` сохранить `scrollTop` перед обновлением строк и после отрисовки восстановить минимум старого смещения и нового максимума. Избегать дублирующих запросов по одному набору рыночных параметров и группировать ID. Проверку общего расхода провести в задаче 8.
- [x] Повторить `npm run test:e2e -w invest -- recovery.spec.ts home.spec.ts coin.spec.ts valuation.spec.ts`. Ожидание GREEN — опрос, восстановление и предыдущие сценарии проходят.
- [x] Сделать коммит `feat(invest): refresh market data and recover from failures`.

## Задача 8. Сквозная учебная приёмка

**Требования** БТ-01–04, НФТ-18–21, НФТ-25–31, В-НФТ-01–07.

**Файлы** Создать `apps/invest/tests/acceptance.spec.ts`. Изменить `apps/invest/playwright.config.ts` для проверок Chrome и Firefox. Исправления по результатам проверок относятся к файлам соответствующего этапа.

**Интерфейсы** Публичные маршруты и формы задачи 1, контрольные ответы `installMarketFixture` задачи 2, счётчик HTTP-вызовов по вкладкам и окнам тарифа.

- [ ] Написать `meets_quote_and_sync_latency` и `stays_within_both_demo_quotas`. Запустить пятиминутную приёмочную сессию в двух вкладках одного профиля с одним Demo-ключом и портфелем из 199 покупок по 20 монетам. Отсчёт начинается с открытия главной в обеих вкладках. Дождаться первого фонового обновления и выполнить поиск во время опроса. Затем оставить одну вкладку на главной, открыть портфель во второй, добавить 200-ю покупку по одной из 20 монет. После следующего фонового обновления первой вкладки открыть в ней портфель и сверить состав в обеих вкладках до окончания сессии.
- [ ] Суммировать сетевые запросы обеих вкладок по правилам тарифа. Для минутного лимита проверить пиковый расход в применимом минутном окне, для месячного — кредиты, израсходованные сессией в текущем расчётном месяце. Записать опубликованные пороги, единицы учёта, границы окон и измеренный расход. При проверке месячных кредитов на реальном API снять показания до и после сессии в пределах одного расчётного месяца с ключом, который используется только для этой проверки. Вывод о квоте относится к приёмочной сессии.

  ```ts
  expect(conversionMs).toBeLessThanOrEqual(200);
  expect(syncMs).toBeLessThanOrEqual(1_000);
  expect(combinedRequestsPerMinute).toBeLessThanOrEqual(Math.floor(minuteLimit * 0.8));
  expect(combinedMonthlyCredits).toBeLessThanOrEqual(Math.floor(monthlyLimit * 0.8));
  ```

- [ ] Запустить `npm run build -w invest`, `npm run test:market -w invest` и `npm run test:e2e -w invest`. Ожидание — сборка, HTTP-контракт и браузерные сценарии проходят.
- [ ] Запустить измерения без подмены часов в настольном Chrome при 1440×900 на одном устройстве и с контролируемыми ответами API. Разместить две вкладки в видимых окнах одного профиля, проверить `document.visibilityState === 'visible'` у обеих. Зафиксировать версию, параметры устройства, время обновления конвертера и портфеля, сохранение видимости таблицы и прокрутки.
- [ ] Проверить Chrome и Firefox на компьютере при 1280×720 и 1440×900 CSS-пикселей, Chrome на Android при ширине 360 и Safari на iOS при ширине 390. Для физических мобильных устройств использовать доступный им HTTPS-адрес сборки. В каждом сочетании выполнить поиск, выбор периода, конвертацию и добавление покупки. На мобильных открыть и закрыть пояснение касанием. Отдельно пройти основные действия клавиатурой, проверить фокус и доступные имена, а в оттенках серого различить `+2%`, `−2%`, `0%`. Зафиксировать браузеры и версии.
- [ ] Провести проверку удобства с одним новым участником. Без подсказок он находит заданную монету, открывает указанный период и добавляет покупку с заданными значениями. Зафиксировать результат каждого действия.
- [ ] Провести учебную приёмку. Проверяющий сверяет технологические ограничения по коду, включая явный `textContent` или `innerText`, собственный debounce, Zustand, `setInterval`, `localStorage`, `BroadcastChannel` и TypeScript. На контролируемых данных показать оценку рынка, историю и конвертацию, стоимость, PnL и доли портфеля после повторного открытия. Зафиксировать каждый из пяти навыков и три сценария по БТ-01–04. [Критерии](./business-requirements.md)
- [ ] Сделать коммит `test(invest): verify Invest acceptance scenarios` после завершения применимых проверок и фиксации результатов.

## Трассировка требований

| Блок                                  | Требования                                           | Задачи    |
| ------------------------------------- | ---------------------------------------------------- | --------- |
| Цели учебной приёмки                  | БТ-01–04, В-БТ-01                                    | 8         |
| Навигация и рынок                     | ФТ-01–09, ФТ-29, ФТ-35–36, В-ФТ-01–02                | 1–3, 8    |
| Детали монеты                         | ФТ-10–13, ФТ-37–42, В-ФТ-03–04                       | 2, 4, 7–8 |
| Покупки и оценка                      | ФТ-14–24, ФТ-43–49, ФТ-53–58, В-ФТ-05–06, В-ФТ-09–11 | 2, 5–6, 8 |
| Загрузка, опрос и сбои                | ФТ-25–28, ФТ-30–34, ФТ-50–52, В-ФТ-07–08             | 3–8       |
| Стек, данные и ограничения реализации | НФТ-01–17, В-НФТ-05–07                               | 1–7       |
| Метрики, нагрузка и восстановление    | НФТ-18–20, НФТ-22–26, В-НФТ-01–03                    | 2, 5–8    |
| Удобство, совместимость и доступность | НФТ-21, НФТ-27–31, В-НФТ-04                          | 1, 3–6, 8 |
