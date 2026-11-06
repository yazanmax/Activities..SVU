
$(document).ready(function () {
  'use strict';
  function store(area) {
    return {
      get: function (k, d) {
        try { var v = window[area].getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
      },
      set: function (k, v) { try { window[area].setItem(k, JSON.stringify(v)); } catch (e) {} },
      del: function (k)    { try { window[area].removeItem(k); } catch (e) {} }
    };
  }
  var LS = store('localStorage');     
  var SS = store('sessionStorage');  

  function getEvent(id) { return $.grep(EVENTS, function (e) { return e.id === id; })[0]; }

  function fmtDate(d) {
    try { return d.toLocaleDateString('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return d.toDateString(); }
  }
  function dayKey(d) {     
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function status(ev) { return ev.offset < 0 ? 'past' : (ev.offset === 0 ? 'today' : (ev.offset <= 7 ? 'week' : 'later')); }

  function toast(msg) {     
    var $t = $('#vsToast');
    if (!$t.length) { alert(msg); return; }
    $('#vsToastBody').text(msg);
    bootstrap.Toast.getOrCreateInstance($t[0]).show();
  }

  
  function badgeHTML(ev) {
    var st = status(ev), h = '';
    if (st === 'today') h += '<span class="badge text-bg-danger status-badge"><i class="bi bi-broadcast"></i> اليوم</span>';
    if (st === 'past')  h += '<span class="badge text-bg-secondary status-badge">انتهت</span>';
    if (st === 'week')  h += '<span class="badge text-bg-warning status-badge">هذا الأسبوع</span>';
    return h;
  }

  function cardHTML(ev, colClass) {
    var c = CATEGORIES[ev.cat];
    return '' +
    '<div class="' + (colClass || 'col-sm-6 col-lg-4') + ' event-item" data-cat="' + ev.cat + '">' +
      '<article class="card event-card h-100 shadow-sm cat-' + ev.cat + (status(ev) === 'past' ? ' is-past' : '') + '">' +
        '<div class="card-media position-relative">' +
          '<img src="' + ev.img + '" class="card-img-top" alt="صورة فعالية: ' + ev.title + '" loading="lazy">' +
          '<span class="badge cat-badge"><i class="bi ' + c.icon + '"></i> ' + c.name + '</span>' +
          badgeHTML(ev) +
        '</div>' +
        '<div class="card-body d-flex flex-column">' +
          '<h3 class="h5 card-title">' + ev.title + '</h3>' +
          '<ul class="list-unstyled event-meta small text-body-secondary mb-2">' +
            '<li><i class="bi bi-calendar-event"></i> ' + fmtDate(ev.when) + ' — ' + ev.time + '</li>' +
            '<li><i class="bi bi-geo-alt"></i> ' + ev.place + '</li>' +
          '</ul>' +
          '<p class="card-text flex-grow-1">' + ev.short + '</p>' +
          '<a href="event.html?id=' + ev.id + '" class="btn btn-primary mt-2">التفاصيل <i class="bi bi-arrow-left"></i></a>' +
        '</div>' +
      '</article>' +
    '</div>';
  }

 
  function renderCards(selector, list, colClass) {
    var html = '';
    $.each(list, function (i, ev) { html += cardHTML(ev, colClass); });
    if (!html) {
      html = '<div class="col-12"><div class="alert alert-info text-center mb-0" role="alert">' +
             '<i class="bi bi-search"></i> لا توجد فعاليات مطابقة لخيارات البحث الحالية.</div></div>';
    }
    $(selector).html(html);
    $(selector + ' .event-item:first .event-card').addClass('first-result');
  }

 
  var file = location.pathname.split('/').pop() || 'index.html';
  var navTarget = (file === 'event.html') ? 'events.html' : file;
  $('.navbar-nav a[href="' + navTarget + '"]').addClass('active').attr('aria-current', 'page');

 
  $('a[href^="http"]').attr({ target: '_blank', rel: 'noopener noreferrer' });


  function syncThemeIcon() {
    var dark = $('html').attr('data-bs-theme') === 'dark';
    $('#themeToggle i').toggleClass('bi-moon-stars-fill', !dark).toggleClass('bi-sun-fill', dark);
  }
  $('#themeToggle').on('click', function () {
    var next = $('html').attr('data-bs-theme') === 'dark' ? 'light' : 'dark';
    $('html').attr('data-bs-theme', next);
    LS.set('vsu_theme', next);
    syncThemeIcon();
  });
  syncThemeIcon();


  $(window).on('scroll', function () { $('#toTop').toggleClass('show', $(this).scrollTop() > 300); });
  $('#toTop').on('click', function () { $('html, body').animate({ scrollTop: 0 }, 500); });

  $('#year').text(new Date().getFullYear());

  
  function buildSlider(list) {
    var $s = $('#heroSlider'), $track = $s.find('.vs-track'), $dots = $s.find('.vs-dots');
    var html = '', dots = '', idx = 0, n = list.length, timer = null;

    $.each(list, function (i, ev) {
      var c = CATEGORIES[ev.cat];
      html += '<div class="vs-slide' + (i === 0 ? ' active' : '') + '" style="background-image:url(\'' + ev.img + '\')" ' +
              'role="group" aria-label="شريحة ' + (i + 1) + ' من ' + n + '">' +
              '<div class="vs-caption">' +
                '<span class="badge cat-' + ev.cat + ' cat-badge-solid mb-2"><i class="bi ' + c.icon + '"></i> ' + c.name + '</span>' +
                '<h2 class="h2 fw-bold">' + ev.title + '</h2>' +
                '<p class="mb-2"><i class="bi bi-calendar-event"></i> ' + fmtDate(ev.when) + ' — ' + ev.time +
                ' &nbsp; <i class="bi bi-geo-alt"></i> ' + ev.place + '</p>' +
                '<a class="btn btn-warning" href="event.html?id=' + ev.id + '">تفاصيل الفعالية</a>' +
              '</div></div>';
      dots += '<button type="button" class="vs-dot' + (i === 0 ? ' active' : '') + '" aria-label="انتقل إلى الشريحة ' + (i + 1) + '"></button>';
    });
    $track.html(html);
    $dots.html(dots);

    function go(i) {
      idx = (i + n) % n;
      $track.children().removeClass('active').eq(idx).addClass('active');   
      $dots.children().removeClass('active').eq(idx).addClass('active');
    }
    function stop()  { clearInterval(timer); }
    function start() { stop(); if (n > 1) timer = setInterval(function () { go(idx + 1); }, 5000); }

    $s.find('.vs-next').on('click', function () { go(idx + 1); start(); });
    $s.find('.vs-prev').on('click', function () { go(idx - 1); start(); });
    $dots.on('click', '.vs-dot', function () { go($(this).index()); start(); });
    $s.on('mouseenter focusin', stop).on('mouseleave focusout', start);
    $s.attr('tabindex', 0).on('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(idx + 1); start(); }
      if (e.key === 'ArrowRight') { go(idx - 1); start(); }
    });
   
    var x0 = null;
    $s.on('touchstart', function (e) { x0 = e.originalEvent.touches[0].clientX; })
      .on('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.originalEvent.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) { go(dx < 0 ? idx + 1 : idx - 1); start(); }
        x0 = null;
      });
    if (n <= 1) $s.find('.vs-next, .vs-prev, .vs-dots').hide();
    start();
  }

  
  function buildTodayCard() {
    var upcoming = $.grep(EVENTS, function (e) { return e.offset >= 0; })
                    .sort(function (a, b) { return a.when - b.when; });
    var ev = upcoming[0];
    if (!ev) { $('#todayCard').remove(); return; }
    var isToday = ev.offset === 0;
    $('#todayLabel').text(isToday ? 'الحدث اليوم' : 'الحدث القادم')
                    .addClass(isToday ? 'text-bg-danger' : 'text-bg-warning');
    $('#todayImg').attr({ src: ev.img, alt: ev.title });
    $('#todayTitle').text(ev.title);
    $('#todayMeta').html('<i class="bi bi-calendar-event"></i> ' + fmtDate(ev.when) + ' — ' + ev.time +
                         '<br><i class="bi bi-geo-alt"></i> ' + ev.place);
    $('#todayLink').attr('href', 'event.html?id=' + ev.id);

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    var timer;
    function tick() {
      var ms = ev.when - new Date();
      if (ms <= 0) {
        $('#cdD, #cdH, #cdM, #cdS').text('00');
        $('#cdMsg').text('بدأت الفعالية — يمكنك الانضمام الآن').removeClass('d-none');
        clearInterval(timer);
        return;
      }
      var s = Math.floor(ms / 1000);
      $('#cdD').text(pad(Math.floor(s / 86400)));
      $('#cdH').text(pad(Math.floor(s % 86400 / 3600)));
      $('#cdM').text(pad(Math.floor(s % 3600 / 60)));
      $('#cdS').text(pad(s % 60));
    }
    tick();
    timer = setInterval(tick, 1000);
  }

 
  function buildCategories() {
    var html = '';
    $.each(CATEGORIES, function (key, c) {
      var n = $.grep(EVENTS, function (e) { return e.cat === key; }).length;
      html += '<a class="cat-pill cat-' + key + '" href="events.html?cat=' + key + '" data-cat="' + key + '">' +
              '<i class="bi ' + c.icon + '"></i><span>' + c.name + '</span>' +
              '<span class="badge rounded-pill text-bg-light">' + n + '</span></a>';
    });
    
    $('#catList').html(html).on('click', 'a', function () { LS.set('vsu_cat', $(this).data('cat')); });
  }

  function buildRecent() {
    var ids = LS.get('vsu_recent', []);
    var list = $.map(ids, function (id) { return getEvent(id) || null; });
    if (!list.length) return;
    renderCards('#recentGrid', list.slice(0, 3), 'col-md-4');
    $('#recentSection').removeClass('d-none');
    $('#clearRecent').on('click', function () { LS.del('vsu_recent'); $('#recentSection').addClass('d-none'); });
  }

  function initHome() {
    var feat = $.grep(EVENTS, function (e) { return e.featured && e.offset >= 0 && e.offset <= 7; });
    if (!feat.length) feat = $.grep(EVENTS, function (e) { return e.featured; });
    feat.sort(function (a, b) { return a.when - b.when; });
    buildSlider(feat);
    buildTodayCard();
    buildCategories();
    var latest = EVENTS.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 6);  
    renderCards('#latestGrid', latest);
    buildRecent();
  }

  function initEvents() {
   
    $.each(CATEGORIES, function (key, c) { $('#fCat').append($('<option>').val(key).text(c.name)); });
    $.each(PLACES, function (name) { $('#fPlace').append($('<option>').val(name).text(name)); });

    var qs = new URLSearchParams(location.search);
    var saved = SS.get('vsu_filters', null);     
    var pref = LS.get('vsu_cat', '');            

    if (qs.has('cat') || qs.has('q')) {
      $('#fCat').val(qs.get('cat') || '');
      $('#q').val(qs.get('q') || '');
    } else {
      if (saved) {
        $('#q').val(saved.q); $('#fDate').val(saved.date); $('#fPlace').val(saved.place);
        $('#fFrom').val(saved.from); $('#fSort').val(saved.sort);
      }
      if (pref && CATEGORIES[pref]) {
        $('#fCat').val(pref);
        $('#prefName').text(CATEGORIES[pref].name);
        $('#prefNote').removeClass('d-none');
      }
    }

    function apply() {
      var q = $.trim($('#q').val()).toLowerCase(), cat = $('#fCat').val(), dt = $('#fDate').val(),
          pl = $('#fPlace').val(), from = $('#fFrom').val(), sort = $('#fSort').val();

      var res = $.grep(EVENTS, function (e) {
        if (cat && e.cat !== cat) return false;
        if (pl && e.place !== pl) return false;
        if (q && (e.title + ' ' + e.short + ' ' + e.place + ' ' + CATEGORIES[e.cat].name).toLowerCase().indexOf(q) === -1) return false;
        switch (dt) {
          case 'today':    if (e.offset !== 0) return false; break;
          case 'week':     if (e.offset < 0 || e.offset > 7) return false; break;
          case 'month':    if (e.offset < 0 || e.offset > 30) return false; break;
          case 'upcoming': if (e.offset < 0) return false; break;
          case 'past':     if (e.offset >= 0) return false; break;
        }
        if (from && dayKey(e.when) < from) return false;
        return true;
      });
      res.sort(function (a, b) { return sort === 'desc' ? b.when - a.when : a.when - b.when; });

      $('#count').text(res.length);
      renderCards('#eventsGrid', res);
      $('#quickCats .btn').removeClass('active').filter('[data-cat="' + cat + '"]').addClass('active');
      SS.set('vsu_filters', { q: $('#q').val(), date: dt, place: pl, from: from, sort: sort });
    }

    
    var qc = '<button type="button" class="btn btn-outline-primary btn-sm" data-cat="">الكل</button>';
    $.each(CATEGORIES, function (k, c) { qc += '<button type="button" class="btn btn-outline-primary btn-sm" data-cat="' + k + '"><i class="bi ' + c.icon + '"></i> ' + c.name + '</button>'; });
    $('#quickCats').html(qc).on('click', '.btn', function () {
      $('#fCat').val($(this).attr('data-cat')).trigger('change');
    });

    $('#filters').on('input change', 'input, select', apply);
    $('#fCat').on('change', function () { LS.set('vsu_cat', $(this).val()); $('#prefNote').addClass('d-none'); });
    $('#filters').on('submit', function (e) { e.preventDefault(); apply(); });
    $('#resetBtn').on('click', function () {
      $('#filters')[0].reset();
      LS.del('vsu_cat'); SS.del('vsu_filters'); $('#prefNote').addClass('d-none');
      apply();
    });
    $('#clearPref').on('click', function () { $('#fCat').val('').trigger('change'); });
    apply();
  }

    
  function initEvent() {
    var id = parseInt(new URLSearchParams(location.search).get('id'), 10);
    var ev = getEvent(id);
    if (!ev) { $('#evContent').addClass('d-none'); $('#notFound').removeClass('d-none'); return; }
    var c = CATEGORIES[ev.cat], past = status(ev) === 'past';

    document.title = ev.title + ' | دليل فعاليات الجامعة الافتراضية';
    $('#evTitle').text(ev.title);
    $('#crumbTitle').text(ev.title);
    $('#infoCard').addClass('cat-' + ev.cat);
    $('#evCat').html('<i class="bi ' + c.icon + '"></i> ' + c.name).addClass('cat-' + ev.cat);
    $('#evStatus').html(badgeHTML(ev));
    $('#evImg').attr({ src: ev.img, alt: 'صورة فعالية: ' + ev.title });
    $('#evDesc').html(ev.long);                     
    $('#evShort').text(ev.short);
    $('#evDate').text(fmtDate(ev.when));
    $('#evTime').text(ev.time);
    $('#evPlace').text(ev.place);
    $('#evPrice').text(ev.price);
    $('#evOrg').text(ev.org);
    $('#mapCap').text(ev.place);

    
    var p = PLACES[ev.place] || { x: 50, y: 50 };
    $('#mapPin').css({ left: p.x + '%', top: p.y + '%' });

   
    var bookings = LS.get('vsu_bookings', {});
    function seatsLeft() { return Math.max(0, ev.seats - ev.taken - (bookings[ev.id] ? bookings[ev.id].tickets : 0)); }
    function refreshSeats() {
      var left = seatsLeft();
      $('#evSeats').text(left > 0 ? left + ' مقعداً متبقياً من ' + ev.seats : 'اكتملت المقاعد');
      var pct = Math.min(100, Math.round((ev.seats - left) / ev.seats * 100));
      $('#seatBar').css('width', pct + '%').attr('aria-valuenow', pct);    
      var $b = $('#bookBtn');
      if (past) { $b.prop('disabled', true).text('انتهت الفعالية'); }
      else if (bookings[ev.id]) { $b.removeClass('btn-primary').addClass('btn-success').html('<i class="bi bi-check-circle"></i> تم الحجز (' + bookings[ev.id].tickets + ')'); }
      else if (left === 0) { $b.prop('disabled', true).text('اكتمل الحجز'); }
      else { $b.removeAttr('disabled'); }         
    }
    refreshSeats();

    
    var g = '';
    $.each(ev.gallery, function (i, src) {
      g += '<div class="col-4"><button type="button" class="gal-thumb" data-src="' + src + '" aria-label="تكبير الصورة ' + (i + 1) + '"><img src="' + src + '" alt="لقطة ' + (i + 1) + ' من الفعالية" class="img-fluid rounded"></button></div>';
    });
    $('#gallery').html(g).on('click', '.gal-thumb', function () {
      $('#lightImg').attr('src', $(this).attr('data-src'));
      bootstrap.Modal.getOrCreateInstance($('#galModal')[0]).show();
    });

    
    var others = $.grep(EVENTS, function (e) { return e.id !== ev.id; });
    var related = $.grep(others, function (e) { return e.cat === ev.cat; })
      .concat($.grep(others, function (e) { return e.cat !== ev.cat; }).sort(function (a, b) { return Math.abs(a.offset - ev.offset) - Math.abs(b.offset - ev.offset); }))
      .slice(0, 3);
    renderCards('#relatedGrid', related, 'col-md-4');

   
    $('#calBtn').on('click', function () {
      function f(d) { return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + 'T' + ('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2) + '00'; }
      var end = new Date(ev.when.getTime() + 2 * 3600 * 1000);
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VSU Events Guide//AR', 'BEGIN:VEVENT',
        'UID:event-' + ev.id + '@vsu-guide', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(ev.when), 'DTEND:' + f(end),
        'SUMMARY:' + ev.title, 'LOCATION:' + ev.place, 'DESCRIPTION:' + ev.short, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      var a = $('<a>').attr({ href: url, download: 'event-' + ev.id + '.ics' }).appendTo('body');
      a[0].click(); a.remove(); URL.revokeObjectURL(url);
      toast('تم تنزيل ملف التقويم — افتحه لإضافة الفعالية');
    });

    
    $('#shareBtn').on('click', function () {
      var url = location.href;
      if (navigator.share) { navigator.share({ title: ev.title, text: ev.short, url: url }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function () { toast('تم نسخ رابط الفعالية'); }); }
      else { window.prompt('انسخ الرابط:', url); }
    });

    
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    $('#bookEvName').text(ev.title);
    $('#bookModal').on('show.bs.modal', function () {
      $('#bookAlert').addClass('d-none');
      if ($('#bookBtn').hasClass('btn-success')) {   
        $('#bookAlert').removeClass('d-none alert-success alert-danger').addClass('alert-info')
          .text('لديك حجز سابق لهذه الفعالية؛ سيُضاف الحجز الجديد إليه.');
      }
      $('#bookForm .form-control, #bookForm .form-select').removeClass('is-invalid');
      var max = Math.min(5, seatsLeft()), opts = '';
      for (var i = 1; i <= max; i++) opts += '<option value="' + i + '">' + i + '</option>';
      $('#bTickets').html(opts);
    });
    $('#bookForm').on('submit', function (e) {
      e.preventDefault();
      var name = $.trim($('#bName').val()), mail = $.trim($('#bEmail').val()), n = parseInt($('#bTickets').val(), 10) || 1;
      var okName = name.length >= 3, okMail = re.test(mail);
      $('#bName').toggleClass('is-invalid', !okName);
      $('#bEmail').toggleClass('is-invalid', !okMail);
      var $al = $('#bookAlert').removeClass('d-none alert-success alert-danger');
      if (!okName || !okMail) { $al.addClass('alert-danger').text('تحقق من الاسم (3 أحرف على الأقل) وصيغة البريد الإلكتروني.'); return; }
      bookings[ev.id] = { name: name, tickets: n + (bookings[ev.id] ? bookings[ev.id].tickets : 0) };
      LS.set('vsu_bookings', bookings);
      $al.addClass('alert-success').text('تم الحجز بنجاح يا ' + name + ' — عدد التذاكر: ' + n + ' (حجز تجريبي).');
      refreshSeats();
      $('#bookForm')[0].reset();
    });

    
    var rec = $.grep(LS.get('vsu_recent', []), function (x) { return x !== ev.id; });
    rec.unshift(ev.id);
    LS.set('vsu_recent', rec.slice(0, 6));
  }


   

  function initAbout() {
    $('#cntEvents').attr('data-to', EVENTS.length);
    function run() {
      $('.counter').each(function () {
        var $c = $(this), to = parseInt($c.attr('data-to'), 10);
        $({ n: 0 }).animate({ n: to }, {
          duration: 1500,
          step: function (now) { $c.text(Math.floor(now)); },
          complete: function () { $c.text(to); }
        });
      });
    }
    if ('IntersectionObserver' in window) {
      var done = false;
      new IntersectionObserver(function (en, ob) {
        if (!done && en[0].isIntersecting) { done = true; run(); ob.disconnect(); }
      }, { threshold: 0.3 }).observe($('#stats')[0]);
    } else { run(); }
  }

 
   
   
  function initContact() {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
   
    var rules = {
      cName:    { test: function (v) { return v.length >= 3; },           msg: 'الاسم مطلوب (3 أحرف على الأقل).' },
      cEmail:   { test: function (v) { return v.length > 0 && re.test(v); }, msg: 'أدخل بريداً إلكترونياً صحيحاً مثل name@example.com' },
      cSubject: { test: function (v) { return v !== ''; },                msg: 'اختر موضوع الرسالة.' },
      cMsg:     { test: function (v) { return v.length >= 10; },          msg: 'الرسالة مطلوبة (10 أحرف على الأقل).' }
    };
    function validate($f) {
      var r = rules[$f.attr('id')];
      if (!r) return true;
      var ok = r.test($.trim($f.val()));
      $f.toggleClass('is-invalid', !ok).toggleClass('is-valid', ok);
      $f.siblings('.invalid-feedback').text(r.msg);
      return ok;
    }
    function showAlert(type, html) {
      $('#formAlert').html('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' + html +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button></div>');
    }

  
    $('#contactForm').on('blur', '.form-control, .form-select', function () { validate($(this)); });
    $('#contactForm').on('input change', '.is-invalid', function () { validate($(this)); });
    $('#cMsg').on('input', function () { $('#msgCount').text($(this).val().length + ' / 500'); });

    $('#contactForm').on('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $('#contactForm .form-control, #contactForm .form-select').each(function () { if (!validate($(this))) ok = false; });
      if (!ok) {
        showAlert('danger', '<i class="bi bi-exclamation-triangle"></i> تعذّر الإرسال: يرجى تصحيح الحقول المظلّلة بالأحمر.');
        $('#contactForm .is-invalid:first').trigger('focus');             
        return;
      }
      var name = $('<div>').text($.trim($('#cName').val())).html();          
      showAlert('success', '<i class="bi bi-check-circle"></i> شكراً <strong>' + name + '</strong>، وصلت رسالتك وسنردّ عليك خلال 48 ساعة (إرسال تجريبي).');
      this.reset();
      $('#contactForm .form-control, #contactForm .form-select').removeClass('is-valid is-invalid');
      $('#msgCount').text('0 / 500');
    });
  }

  
  switch ($('body').attr('data-page')) {
    case 'home':    initHome();    break;
    case 'events':  initEvents();  break;
    case 'event':   initEvent();   break;
    case 'about':   initAbout();   break;
    case 'contact': initContact(); break;
  }
});
