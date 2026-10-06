(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var zones = Array.from(document.querySelectorAll('[data-name]'));
  var ruler = document.getElementById('ruler');
  var marker = document.getElementById('mk');
  var links = zones.map(function (zone, index) {
    var link = document.createElement('a');
    link.href = '#' + zone.id;
    link.setAttribute('aria-label', (index + 1) + '. ' + zone.dataset.name);
    link.title = (index + 1) + '. ' + zone.dataset.name;
    ruler.appendChild(link);
    return link;
  });
  // Иллюстративные авторские фразы, не цитаты из рекламы.
  var slogans = ['Живи проще','Только нужное','Меньше — это новое больше','Осознанное потребление','Купи меньше, купи лучше','Капсульный гардероб','Правильная мера','Скандинавский баланс','Лагом','Избавься от лишнего','Slow living','Тихая роскошь','Умный минимум','Хватит всего'];
  var seed = 7;
  function random() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  var noiseItems = [];
  for (var n = 0; n < (innerWidth < 700 ? 22 : 48); n++) {
    var span = document.createElement('span'); span.textContent = slogans[n % slogans.length];
    span.style.left = (random() * 78) + '%'; span.style.top = (random() * 92) + '%';
    span.style.setProperty('--s', (11 + random() * random() * 40) + 'px');
    document.getElementById('noise').appendChild(span);
    noiseItems.push({el:span, threshold:.04 + random() * .66});
  }
  function update() {
    var mobile = innerWidth <= 700;
    var index = 0;
    zones.forEach(function (zone, i) { if (zone.getBoundingClientRect().top <= innerHeight * .35) index = i; });
    links.forEach(function (link, i) {
      link.style.left = mobile ? (i / (zones.length - 1) * 100) + '%' : '';
      link.style.top = mobile ? '' : (i / (zones.length - 1) * 100) + '%';
      if (i === index) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    marker.style.left = mobile ? (index / (zones.length - 1) * 100) + '%' : '';
    marker.style.top = mobile ? '' : (index / (zones.length - 1) * 100) + '%';
    document.getElementById('rl').textContent = (index + 1) + ' / ' + zones[index].dataset.name;
    var hero = zones[0];
    var distance = hero.offsetHeight - innerHeight;
    var progress = reduced || distance <= 0 ? 1 : Math.min(1, Math.max(0, scrollY / distance));
    noiseItems.forEach(function(item) { item.el.classList.toggle('gone', progress > item.threshold); });
    var fade = Math.min(1, Math.max(0, (progress - .7) / .25));
    var word = document.getElementById('w');
    word.style.setProperty('--o', fade);
    word.style.setProperty('--w', 900 - fade * 700);
    word.style.setProperty('--rise', ((1-fade)*20) + 'px');
    document.getElementById('hint').style.opacity = progress > .05 ? 0 : 1;
  }
  var scheduled = false;
  addEventListener('scroll', function () { if (!scheduled) { scheduled = true; requestAnimationFrame(function () { scheduled = false; update(); }); } }, {passive:true});
  addEventListener('resize', update); update();
  var revealButton = document.getElementById('showWhy');
  revealButton.addEventListener('click', function () {
    document.querySelectorAll('#cases .reveal, #why').forEach(function (el) { el.classList.add('shown'); });
    revealButton.setAttribute('aria-expanded', 'true');
    revealButton.textContent = 'Условия раскрыты';
    revealButton.disabled = true;
  });
  var state = {count:null, needs:false, replace:true};
  function group(id, options, key) {
    var box = document.getElementById(id);
    options.forEach(function (option) {
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'pick-btn'; button.textContent = option[0];
      button.setAttribute('aria-pressed', String(state[key] === option[1]));
      button.addEventListener('click', function () {
        state[key] = option[1];
        Array.from(box.children).forEach(function (child) { child.setAttribute('aria-pressed', String(child === button)); });
        document.getElementById('step2').hidden = false; render();
      });
      box.appendChild(button);
    });
  }
  function render() {
    if (state.count === null) return;
    document.getElementById('val').textContent = state.count + ' вещей · ' + (state.needs ? 'часть требует замены' : 'вещи пригодны') + ' · ' + (state.replace ? 'замена доступна' : 'замена пока недоступна');
    var text;
    if (!state.needs && state.replace) text = 'Вещи закрывают потребность, замена доступна. Сохранить этот набор можно по собственному решению.';
    if (!state.needs && !state.replace) text = 'Вещи пока закрывают потребность. Ограниченная возможность замены не означает, что сейчас чего-то не хватает, но оставляет меньше свободы на будущее.';
    if (state.needs && state.replace) text = 'Количество можно сохранить, заменив изношенную вещь. Меньше вещей здесь не обязательно означает отказ от необходимых покупок.';
    if (state.needs && !state.replace) text = 'Количество осталось тем же, но часть вещей требует замены, которая пока недоступна. Это ограничение возможностей; по числу вещей его не увидеть.';
    var result = document.getElementById('res'); result.replaceChildren();
    var main = document.createElement('p'); main.className = 'big-line'; main.textContent = text; result.appendChild(main);
    var note = document.createElement('p'); note.textContent = 'Число осталось тем же. Изменились условия — и смысл этого числа.'; result.appendChild(note);
    var wardrobe = document.getElementById('wardrobe'); wardrobe.replaceChildren(); wardrobe.classList.toggle('needs', state.needs);
    for (var i=0;i<state.count;i++) { var item=document.createElement('span'); item.textContent=i+1; wardrobe.appendChild(item); }
  }
  group('counts', [3,5,7,12].map(function(n){return [String(n),n];}), 'count');
  group('condition', [['Вещи пригодны',false],['Часть требует замены',true]], 'needs');
  group('can', [['Могу заменить',true],['Пока не могу заменить',false]], 'replace');
})();
