/* ============================================================================
 * ФАЙЛ: scripts/settings-sheet-api.gs — Серверный скрипт для Google Apps Script
 * ЗА ЧТО ОТВЕЧАЕТ: Принимает настройки со страницы «Администрирование» вашего сайта, проверяет пароль записи и сохраняет их в лист Google-таблицы, чтобы изменения увидели все пользователи сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает запрос от файла src/data/settingsSync.ts и работает напрямую с вашей Google-таблицей по её идентификатору SHEET_ID и номеру листа SHEET_GID.
 * КАК ИЗМЕНИТЬ:
 *   1. В Google-таблице откройте меню «Расширения» → «Apps Script» и вставьте весь код этого файла.
 *   2. Если захотите сменить пароль записи — поменяйте значение TOKEN ниже и укажите тот же пароль в админке сайта.
 *   3. Опубликуйте через «Начать развёртывание» → «Новое развёртывание» → «Веб-приложение» (доступ: «У всех») и вставьте полученный адрес «…/exec» на странице #/admin.
 * ========================================================================= */

/* БЛОК: Константы подключения к листу Google-таблицы и пароль записи (SHEET_ID, SHEET_GID, TOKEN, CHUNK_SIZE)
 * ЗА ЧТО ОТВЕЧАЕТ: Указывает, в какую именно таблицу и на какой лист записывать настройки, а также каким паролем защищена запись.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Идентификаторы взяты из ссылки на вашу таблицу настроек.
 * КАК ИЗМЕНИТЬ: Поменяйте SHEET_ID / SHEET_GID при переносе на другую таблицу или измените строку TOKEN для смены пароля. */
var SHEET_ID = '1vfnmGjg2_2KXQPcAfb4UKIwwi1FfewI1pwJ2hcTBaIg';
var SHEET_GID = 2035849366;

var TOKEN = 'ВАШ-НОВЫЙ-ПАРОЛЬ-ЗАПИСИ';

var CHUNK_SIZE = 40000;

/* БЛОК: Входные точки веб-приложения Google (doGet, doPost, handleRequest)
 * ЗА ЧТО ОТВЕЧАЕТ: Принимает GET и POST запросы от сайта: при action="save" проверяет пароль TOKEN и сохраняет настройки, иначе возвращает текущие настройки из таблицы.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из параметров HTTP-запроса e, отправленного браузером администратора.
 * КАК ИЗМЕНИТЬ: Менять не требуется. */
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var params = collectParams(e);
  var result;

  try {
    if (params.action === 'save') {
      if (String(params.token || '') !== TOKEN) {
        result = { ok: false, error: 'Неверный пароль записи' };
      } else {
        result = saveSettings(params);
      }
    } else {
      result = readSettings();
    }
  } catch (error) {
    result = { ok: false, error: String(error) };
  }

  return reply(result, params.callback);
}

/* БЛОК: Разбор параметров запроса и формирование ответа (collectParams, reply, getSheet)
 * ЗА ЧТО ОТВЕЧАЕТ: Извлекает данные из строки адреса и тела запроса, формирует ответ в формате JSON/JSONP и находит нужный лист таблицы по его номеру SHEET_GID.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из объекта запроса Google Apps Script и книги SpreadsheetApp.openById(SHEET_ID).
 * КАК ИЗМЕНИТЬ: Если лист с указанным SHEET_GID был удалён, скрипт сам создаст лист с названием «Настройки сайта». */
function collectParams(e) {
  var params = {};
  var key;

  if (e && e.parameter) {
    for (key in e.parameter) params[key] = e.parameter[key];
  }

  if (e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      for (key in body) params[key] = body[key];
    } catch (error) {}
  }

  return params;
}

function reply(data, callback) {
  var json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheets = book.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === SHEET_GID) return sheets[i];
  }

  return book.insertSheet('Настройки сайта');
}

/* БЛОК: Запись и чтение строк настроек на листе таблицы (saveSettings, readSettings, splitPayload, formatDate)
 * ЗА ЧТО ОТВЕЧАЕТ: Очищает лист настроек и аккуратно записывает туда версию (revision), дату сохранения (updatedAt), автора и сам JSON настроек (settings1, settings2…).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает JSON-строку payload и номер версии revision из админки сайта.
 * КАК ИЗМЕНИТЬ: Названия строк в массиве rows менять не нужно — по ним все открытые страницы сайта читают настройки. */
function saveSettings(params) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var sheet = getSheet();
    var payload = String(params.payload || '');
    var revision = Number(params.revision) || new Date().getTime();

    JSON.parse(payload);

    var rows = [
      ['Параметр', 'Значение', 'Комментарий'],
      ['revision', revision, 'Версия настроек, больше — значит новее'],
      ['updatedAt', formatDate(new Date()), 'Время последнего сохранения'],
      ['updatedBy', String(params.author || 'Администрирование'), 'Кто сохранил'],
    ];

    var chunks = splitPayload(payload);
    for (var i = 0; i < chunks.length; i++) {
      rows.push(['settings' + (i + 1), chunks[i], i === 0 ? 'Настройки блоков сайта (JSON)' : '']);
    }

    sheet.clearContents();
    sheet.getRange(1, 1, rows.length, 3).setValues(rows);
    SpreadsheetApp.flush();

    return { ok: true, revision: revision, chunks: chunks.length };
  } finally {
    lock.releaseLock();
  }
}

function readSettings() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  var revision = 0;
  var updatedAt = '';
  var updatedBy = '';
  var payload = '';

  for (var i = 0; i < values.length; i++) {
    var key = String(values[i][0] || '').toLowerCase();
    var value = values[i][1];

    if (key === 'revision') revision = Number(value) || 0;
    else if (key === 'updatedat') updatedAt = String(value || '');
    else if (key === 'updatedby') updatedBy = String(value || '');
    else if (key.indexOf('settings') === 0) payload += String(value || '');
  }

  var settings = null;
  if (payload) {
    try {
      settings = JSON.parse(payload);
    } catch (error) {
      settings = null;
    }
  }

  return { ok: true, revision: revision, updatedAt: updatedAt, updatedBy: updatedBy, settings: settings };
}

function splitPayload(text) {
  var chunks = [];
  for (var i = 0; i < text.length; i += CHUNK_SIZE) chunks.push(text.substring(i, i + CHUNK_SIZE));
  return chunks.length ? chunks : [''];
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');
}
