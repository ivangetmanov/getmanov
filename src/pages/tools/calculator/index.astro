---
import BaseLayout from "../../../layouts/BaseLayout.astro";

const title = "Калькулятор";
const description = "ROI калькулятор для SEO";
---

<BaseLayout title={title} description={description} canonical="https://getmanov.com/tools/calculator/">
  <div class="container markdown">
    <h1>Калькулятор ROI для SEO</h1>

    <div class="card" style="padding:16px;">
      <label style="display:block; margin-bottom:12px;">
        Текущий общий трафик на сайт (в месяц):
        <input id="traffic" type="number" min="0" step="1" value="1000" style="width:140px; margin-left:8px;" />
        <div style="opacity:.75; font-size:14px; margin-top:4px;">
          Обычно трафик варьируется от 100 до 10,000 посетителей в месяц.
        </div>
      </label>

      <label style="display:block; margin-bottom:12px;">
        Процент трафика из органического поиска (%):
        <input id="organicPct" type="number" min="0" max="100" step="1" value="50" style="width:90px; margin-left:8px;" />
        <div style="opacity:.75; font-size:14px; margin-top:4px;">
          Обычно органический трафик составляет от 0% до 100%.
        </div>
      </label>

      <label style="display:block; margin-bottom:12px;">
        Средняя конверсия сайта (%):
        <input id="convPct" type="number" min="0" max="100" step="0.1" value="2" style="width:90px; margin-left:8px;" />
        <div style="opacity:.75; font-size:14px; margin-top:4px;">
          Средняя конверсия варьируется от 0% до 15%.
        </div>
      </label>

      <label style="display:block; margin-bottom:12px;">
        Средний доход на лид/сделку:
        <input id="revPerLead" type="number" min="0" step="1" value="100" style="width:140px; margin-left:8px;" />
        <div style="opacity:.75; font-size:14px; margin-top:4px;">
          Средний доход на лид может быть от 10 до 1000 единиц валюты.
        </div>
      </label>

      <label style="display:block; margin-bottom:12px;">
        Ежемесячный бюджет на SEO:
        <input id="seoBudget" type="number" min="0" step="1" value="500" style="width:140px; margin-left:8px;" />
        <div style="opacity:.75; font-size:14px; margin-top:4px;">
          Бюджет на SEO варьируется от 100 до 10,000 единиц валюты в месяц.
        </div>
      </label>

      <label style="display:block; margin-bottom:16px;">
        Продолжительность кампании (в месяцах):
        <input id="months" type="number" min="1" step="1" value="6" style="width:90px; margin-left:8px;" />
        <div style="opacity:.75; font-size:14px; margin-top:4px;">
          Продолжительность SEO кампании может варьироваться от 1 до 24 месяцев.
        </div>
      </label>

      <button id="calcBtn" class="btn primary" type="button">Рассчитать ROI</button>

      <hr style="margin:16px 0;" />

      <h3 style="margin:0 0 8px;">Результаты</h3>

      <div id="results" style="display:grid; gap:6px;">
        <div><strong>Органический трафик:</strong> <span id="organicTraffic">—</span> / мес</div>
        <div><strong>Лиды:</strong> <span id="leads">—</span> / мес</div>
        <div><strong>Доход:</strong> <span id="revenue">—</span> / мес</div>
        <div><strong>Прибыль (доход − SEO бюджет):</strong> <span id="profit">—</span> / мес</div>
        <div><strong>ROI:</strong> <span id="roi">—</span></div>
        <div><strong>Итог за период:</strong> <span id="total">—</span></div>
      </div>
    </div>
  </div>

  <script is:inline>
    const fmt = (n) => {
      if (!Number.isFinite(n)) return "—";
      return new Intl.NumberFormat("ru-RU").format(Math.round(n));
    };

    function getNum(id) {
      const el = document.getElementById(id);
      return Number(String(el.value).replace(",", ".")) || 0;
    }

    function calc() {
      const traffic = getNum("traffic");
      const organicPct = Math.min(100, Math.max(0, getNum("organicPct")));
      const convPct = Math.min(100, Math.max(0, getNum("convPct")));
      const revPerLead = getNum("revPerLead");
      const seoBudget = getNum("seoBudget");
      const months = Math.max(1, Math.floor(getNum("months")));

      const organicTraffic = traffic * (organicPct / 100);
      const leads = organicTraffic * (convPct / 100);
      const revenue = leads * revPerLead;

      const profit = revenue - seoBudget;
      const roi = seoBudget > 0 ? ((profit / seoBudget) * 100) : NaN;

      const totalRevenue = revenue * months;
      const totalCost = seoBudget * months;
      const totalProfit = totalRevenue - totalCost;
      const totalRoi = totalCost > 0 ? ((totalProfit / totalCost) * 100) : NaN;

      document.getElementById("organicTraffic").textContent = fmt(organicTraffic);
      document.getElementById("leads").textContent = fmt(leads);
      document.getElementById("revenue").textContent = fmt(revenue);

      document.getElementById("profit").textContent = fmt(profit);
      document.getElementById("roi").textContent = Number.isFinite(roi) ? `${roi.toFixed(1)}%` : "—";

      document.getElementById("total").textContent =
        `Доход: ${fmt(totalRevenue)} • Затраты: ${fmt(totalCost)} • Прибыль: ${fmt(totalProfit)} • ROI: ${
          Number.isFinite(totalRoi) ? totalRoi.toFixed(1) + "%" : "—"
        }`;
    }

    document.getElementById("calcBtn").addEventListener("click", calc);
    // опционально: авто-пересчёт при вводе
    ["traffic","organicPct","convPct","revPerLead","seoBudget","months"].forEach((id) => {
      document.getElementById(id).addEventListener("input", calc);
    });
    calc();
  </script>
</BaseLayout>