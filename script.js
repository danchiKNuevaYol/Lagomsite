(function () {
  "use strict";

  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function isMobile() { return innerWidth <= 700; }

  // Детерминированный генератор: раскладка одинакова при каждой загрузке
  function rng(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  /* ==========================================================
     1. Макет текста: серые полосы вместо слов
     ========================================================== */
  $$(".tx").forEach(function (box, k) {
    var n = +box.getAttribute("data-words") || 30;
    var r = rng(11 + k * 7);
    var frag = document.createDocumentFragment();

    for (var i = 0; i < n; i++) {
      var w = document.createElement("i");
      w.style.width = (1.2 + r() * r() * 5.2 + r() * 1.6).toFixed(2) + "em";
      frag.appendChild(w);
    }

    box.appendChild(frag);
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", "Место под текст");
  });

  /* ==========================================================
     2. Иконки вещей (одинаковы в обоих наборах)
     ========================================================== */
  var ICONS = [
    ["Пальто",   "M24 6 L12 14 L14 60 H50 L52 14 L40 6 L32 20 Z M32 20 V60"],
    ["Свитер",   "M22 8 H42 L58 22 L52 32 L46 28 V58 H18 V28 L12 32 L6 22 Z M26 8 Q32 16 38 8"],
    ["Джинсы",   "M18 6 H46 L50 58 H35 L32 26 L29 58 H14 Z M18 12 H46"],
    ["Рубашка",  "M24 6 L32 14 L40 6 L58 16 L52 30 L46 27 V58 H18 V27 L12 30 L6 16 Z M32 14 V58"],
    ["Ботинки",  "M20 6 H36 V30 L56 40 Q58 54 50 54 H14 Q12 54 12 50 Z"],
    ["Куртка",   "M24 6 L10 14 V44 H18 V58 H46 V44 H54 V14 L40 6 L32 12 Z M32 12 V58"],
    ["Шарф",     "M14 10 H50 V26 H14 Z M20 26 V56 H30 V26 M36 26 V46 H46 V26"]
  ];

  $$("[data-icons]").forEach(function (ul) {
    ICONS.forEach(function (ic) {
      var li = document.createElement("li");
      li.innerHTML =
        '<svg class="ic" viewBox="0 0 64 64" aria-hidden="true"><path d="' + ic[1] + '"/></svg>' +
        '<span class="t-cap">' + ic[0] + "</span>";
      ul.appendChild(li);
    });
  });

  /* ==========================================================
     3. Шум: объёмная сцена из слоганов
     ========================================================== */

  // Фрагменты рекламы Volvo, 1966 (The Henry Ford, 2011.93.1).
  // Сверьте формулировки со страницей источника, прежде чем публиковать.
  var SLOGANS = [
    "Your car is obsolete. Again.", "eleven years in Sweden", "a “big new look”",
    "won’t become obsolete in ’68", "obsolete", "eleven years", "in Sweden",
    "no speed limits on the highways", "70,000 miles of unpaved roads", "Again.",
    "lasts an average of eleven years", "Volvo"
  ];

  var stage = $("#stage");
  var hero = $("#z0");
  var scene = $("#scene");
  var world = $("#world");
  var items = [];
  var cam = 0;
  var frozen = false;

  (function buildNoise() {
    var r = rng(5);
    var count = isMobile() ? 38 : 64;

    for (var i = 0; i < count; i++) {
      var big = r() < 0.3;
      // мелкие уходят вглубь, отдельные крупные приближаются
      var z = big ? -900 + r() * 1250 : -6000 + r() * 4800;
      var size = big ? 62 + r() * 72 : 20 + r() * 16;
      var el = document.createElement("p");
      var span = document.createElement("span");

      span.textContent = SLOGANS[i % SLOGANS.length];
      el.appendChild(span);
      el.className = "slog";
      el.style.left = (3 + r() * 66) + "%";
      el.style.top = (6 + r() * 84) + "%";
      el.style.fontSize = size.toFixed(0) + "px";
      el.style.fontFamily = big ? "var(--serif)" : "var(--sans)";
      el.style.fontWeight = big ? "300" : "500";
      el.style.setProperty("--z", z.toFixed(0) + "px");
      el.style.setProperty("--r0", ((r() - 0.5) * 2 * (big ? 7 : 9)).toFixed(1) + "deg");
      el.style.setProperty("--ry0", ((r() - 0.5) * 2 * 16).toFixed(1) + "deg");
      el.style.setProperty("--dl", (-r() * 6).toFixed(1) + "s");
      el.style.opacity = "0";

      world.appendChild(el);
      items.push({ el: el, z: z });
    }
  })();

  function updateNoise(p) {
    var t = clamp((p - 0.18) / (0.78 - 0.18), 0, 1);

    if (!frozen) {
      cam = (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) * 3200;
    }

    world.style.transform = "translateZ(" + cam.toFixed(1) + "px)";

    items.forEach(function (it) {
      var d = it.z + cam;
      var o;

      if (d < -3400) { o = 0; }
      else if (d < -1300) { o = (d + 3400) / 2100 * 0.5; }
      else if (d < 250) { o = 0.5 + (d + 1300) / 1550 * 0.5; }
      else if (d < 540) { o = 1 - (d - 250) / 290; }
      else { o = 0; }

      // в режиме паузы всё, что в зоне видимости, читается полностью
      if (frozen && d > -2300 && d < 500) { o = 1; }

      it.el.style.opacity = o.toFixed(3);
      it.el.style.visibility = o <= 0 ? "hidden" : "visible";
    });
  }

  /* ==========================================================
     4. Первая зона: титул → шум → обрыв
     ========================================================== */
  var beatTitle = $("#beatTitle");
  var pauseBtn = $("#pause");
  var hint = $("#hint");
  var srcCap = $("#srcCap");

  pauseBtn.addEventListener("click", function () {
    frozen = !frozen;
    stage.classList.toggle("paused", frozen);
    pauseBtn.setAttribute("aria-pressed", String(frozen));
    pauseBtn.textContent = frozen ? "Продолжить движение" : "Остановить движение";
    request();
  });

  function updateHero(S) {
    var H = hero.offsetHeight - innerHeight;
    var p = clamp(S / H, 0, 1);
    var cut = p >= 0.8;

    stage.classList.toggle("cut", cut);

    beatTitle.style.opacity = (1 - smooth(clamp((p - 0.08) / 0.1, 0, 1))).toFixed(3);
    beatTitle.style.transform = "translate3d(0," + (-smooth(clamp(p / 0.2, 0, 1)) * 8).toFixed(2) + "vh,0)";
    scene.style.opacity = cut ? 0 : smooth(clamp((p - 0.13) / 0.06, 0, 1)).toFixed(3);

    var inNoise = p > 0.2 && p < 0.8;
    pauseBtn.classList.toggle("on", inNoise);
    srcCap.style.opacity = inNoise ? 1 : 0;
    hint.style.opacity = p > 0.03 ? 0 : 0.7;

    if (!cut) { updateNoise(p); }
  }

  /* ==========================================================
     5. Диск «7»: один знак едет по всей странице
     ========================================================== */
  var disc = $("#disc");
  var anchors = $$("[data-disc]").map(function (el) { return { el: el, s: 0 }; });

  function recalc() {
    var vh = innerHeight;
    var heroH = hero.offsetHeight - vh;

    anchors.forEach(function (a) {
      if (hero.contains(a.el)) {
        a.s = parseFloat(a.el.getAttribute("data-at")) * heroH;
      } else {
        var r = a.el.getBoundingClientRect();
        a.s = r.top + scrollY + r.height / 2 - vh * 0.5;
      }
    });

    anchors.sort(function (a, b) { return a.s - b.s; });

    for (var i = 1; i < anchors.length; i++) {
      if (anchors[i].s <= anchors[i - 1].s) { anchors[i].s = anchors[i - 1].s + 1; }
    }
  }

  function updateDisc(S) {
    var i = 0;
    while (i < anchors.length - 1 && S >= anchors[i + 1].s) { i++; }

    var a = anchors[i];
    var b = anchors[Math.min(i + 1, anchors.length - 1)];
    var t = a === b ? 0 : clamp((S - a.s) / (b.s - a.s), 0, 1);

    // диск задерживается на якоре, потом перелетает к следующему
    var w = t < 0.2 ? 0 : t > 0.8 ? 1 : smooth((t - 0.2) / 0.6);

    var ra = a.el.getBoundingClientRect();
    var rb = b.el.getBoundingClientRect();
    var x = lerp(ra.left + ra.width / 2, rb.left + rb.width / 2, w);
    var y = lerp(ra.top + ra.height / 2, rb.top + rb.height / 2, w);
    var d = lerp(ra.width, rb.width, w);

    // монета переворачивается в полёте: полный оборот, цифра не зеркалится
    disc.style.transform =
      "translate3d(" + (x - 100).toFixed(1) + "px," + (y - 100).toFixed(1) + "px,0) " +
      "scale(" + (d / 200).toFixed(4) + ") perspective(900px) rotateY(" + (w * 360).toFixed(1) + "deg)";
  }

  /* ==========================================================
     6. Тонкая полоса прогресса
     ========================================================== */
  var pg = $("#pg");

  function updateProgress(S) {
    var max = document.documentElement.scrollHeight - innerHeight;
    pg.style.transform = "scaleX(" + (max > 0 ? clamp(S / max, 0, 1) : 0).toFixed(4) + ")";
  }

  /* ==========================================================
     7. Огромные слова чуть уходят в сторону при прокрутке
     ========================================================== */
  var drifters = $$(".drift");

  function updateDrift() {
    var vh = innerHeight;

    drifters.forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-speed")) || 0;
      var r = el.getBoundingClientRect();
      var dy = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(" + (dy * speed).toFixed(1) + "px,0,0)";
    });
  }

  /* ==========================================================
     8. Главный цикл
     ========================================================== */
  var ticking = false;

  function safe(fn, arg) {
    try { fn(arg); } catch (e) { if (window.console) { console.error(e); } }
  }

  function frame() {
    ticking = false;
    var S = window.scrollY;

    // каждый эффект защищён отдельно: сбой одного не останавливает остальные
    safe(updateProgress, S);

    if (RM) { return; }

    safe(updateHero, S);
    safe(updateDisc, S);
    safe(updateDrift, S);
  }

  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }

  function relayout() {
    recalc();
    request();
  }

  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", relayout);
  addEventListener("load", relayout);

  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(relayout); }
  if (window.ResizeObserver) { new ResizeObserver(relayout).observe(document.body); }

  /* ==========================================================
     9. «Кто определяет меру?»: открыть условия каждого набора
     ========================================================== */
  var why = $("#why");

  function syncFinding() {
    var open = $$(".open[aria-expanded='true']").length;
    why.classList.toggle("shown", open === 2);
  }

  $$(".open").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("data-target"));
      var show = !panel.classList.contains("shown");

      panel.classList.toggle("shown", show);
      btn.setAttribute("aria-expanded", String(show));
      btn.textContent = show ? "Скрыть условия" : "Открыть условия";
      syncFinding();
    });
  });

  /* ==========================================================
     10. Гардероб: число остаётся, условия меняются
     ========================================================== */
  var state = { count: null, budget: 1, canReplace: true };
  var budgets = ["5 000 ₽", "25 000 ₽", "100 000 ₽"];

  var budgetNotes = [
    "При 5 000 ₽ каждая покупка заметна в бюджете.",
    "При 25 000 ₽ можно заменить часть вещей и не выйти за рамки.",
    "При 100 000 ₽ денежного ограничения нет, число остаётся вопросом вкуса."
  ];

  var range = $("#rng");
  var result = $("#res");
  var value = $("#val");
  var bign = $("#bign");
  var steps = $("#st").children;
  var step2 = $("#step2");

  function things(n) { return n === 3 ? "вещи" : "вещей"; }

  // Группа кнопок: выбрана ровно одна
  function makeGroup(box, options, onPick) {
    options.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pick-btn";
      b.textContent = opt.label;
      b.setAttribute("aria-pressed", "false");

      b.addEventListener("click", function () {
        [].forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        onPick(opt.value);
      });

      box.appendChild(b);
    });
  }

  function render() {
    if (state.count === null) { return; }

    var n = state.count;
    var line = state.canReplace
      ? "Эти " + n + " " + things(n) + " вам подходят, а замена доступна. Можно сохранить набор по собственному решению."
      : "Эти " + n + " " + things(n) + " износились, но заменить их сейчас нельзя. Короткий список сам по себе ничего не сообщает о свободе выбора.";

    bign.textContent = n;
    value.textContent =
      "Выбрано: " + n + " " + things(n) + " · бюджет " + budgets[state.budget] +
      " · замена " + (state.canReplace ? "доступна" : "недоступна");

    result.innerHTML =
      '<p class="t-quote">' + line + "</p>" +
      '<p class="t-body">' + budgetNotes[state.budget] + "</p>" +
      '<p class="t-cap soft">Это условная ситуация. Реальная добровольность выбора зависит от обстоятельств, которые здесь не спрашиваются.</p>';

    for (var k = 0; k < steps.length; k++) {
      steps[k].classList.toggle("on", k === state.budget);
    }
  }

  makeGroup($("#counts"),
    [3, 5, 7, 12].map(function (n) { return { label: String(n), value: n }; }),
    function (n) {
      state.count = n;
      step2.hidden = false;
      render();
    });

  makeGroup($("#can"),
    [{ label: "Замена доступна", value: true }, { label: "Замена недоступна", value: false }],
    function (v) {
      state.canReplace = v;
      render();
    });

  $("#can").children[0].setAttribute("aria-pressed", "true");

  range.addEventListener("input", function () {
    state.budget = +range.value;
    render();
  });

  /* ---------- старт ---------- */
  recalc();
  frame();
})();
