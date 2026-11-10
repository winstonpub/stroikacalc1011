/* ============================================================================
 * ФАЙЛ: src/hooks/useChelyabinskDelivery.ts — Автообновление срока доставки («Сегодня» / «Завтра»)
 * ЗА ЧТО ОТВЕЧАЕТ: Выдаёт компонентам актуальное слово «Сегодня» (до 16:00 по Челябинску) или «Завтра» (с 16:00 до полуночи) и сам обновляет надпись на открытой странице ровно на границе каждой минуты и при возвращении на вкладку.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Вызывает функцию getChelyabinskDeliveryDay() из файла src/utils/delivery.ts и следит за системными часами и событиями вкладки браузера.
 * КАК ИЗМЕНИТЬ: Если нужно изменить час смены «Сегодня» → «Завтра» (сейчас 16:00) или текст надписей, редактируйте файл src/utils/delivery.ts.
 * ========================================================================= */

import { useEffect, useState } from "react";
import { getChelyabinskDeliveryDay } from "../utils/delivery";

/* БЛОК: React-хук живого срока доставки (useChelyabinskDelivery)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит текущий день доставки в состоянии экрана и ставит минутный таймер, чтобы в 16:00 и в 00:00 текст сменился без перезагрузки страницы.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Текущее время new Date(), проверенное по часовому поясу Челябинска в getChelyabinskDeliveryDay().
 * КАК ИЗМЕНИТЬ: Частота проверки привязана к началу каждой минуты (60_000 мс); менять её обычно не требуется. */
export function useChelyabinskDelivery() {
  const [day, setDay] = useState(() => getChelyabinskDeliveryDay());

  useEffect(() => {
    let timer: number;
    const refresh = () => {
      window.clearTimeout(timer);
      const now = new Date();
      setDay(getChelyabinskDeliveryDay(now));
      timer = window.setTimeout(refresh, 60_000 - (now.getTime() % 60_000));
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);

  return day;
}
