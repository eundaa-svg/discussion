console.log('[app] === LOADED v_fix1 ===');

// === 데모 시드 ===
var DEMO_SEED = {
  alice: { side: "con", summary: "축의금은 친밀도에 비례해야 한다", reasoning: "직장 선배라는 이유만으로 10만원을 강요받는 것은 사회 초년생에게 부담입니다.", createdAt: Date.now() - 18000000, rebuttals: [] },
  nemo:  { side: "con", summary: "20대 중반 경제 상황을 무시한 일률적 기준은 비합리적이다", reasoning: "학자금, 월세, 생활비로 여유 없는 시기입니다.", createdAt: Date.now() - 14400000, rebuttals: [] },
  kyo:   { side: "pro", summary: "회사 선배 결혼식 축의금 10만원은 최소한의 예의다", reasoning: "식대만 6~8만원이 드는 결혼식장이 많습니다.", createdAt: Date.now() - 7200000, rebuttals: [] },
  mira:  { side: "pro", summary: "사회적 관계 유지 비용으로 합리적이다", reasoning: "본인이 결혼할 때 돌려받는 상호부조입니다.", createdAt: Date.now() - 3600000, rebuttals: [] },
  yuna:  { side: "con", summary: "결혼식 참석 자체가 이미 큰 시간적 비용이다", reasoning: "주말 반나절을 결혼식 참석에 쓰는 것 자체가 이미 상당한 비용입니다. 거기에 10만원 이상의 축의금까지 강요한다면 사회 초년생에게는 이중 부담입니다. 시간을 내어 축하해주는 마음 자체를 인정해주는 문화가 필요합니다.", createdAt: Date.now() - 21600000, rebuttals: [] },
  hoon:  { side: "con", summary: "축의금 액수가 인간관계의 척도가 되어서는 안 된다", reasoning: "축의금의 액수로 친밀도를 평가하는 문화 자체가 잘못되었습니다. 5만원이든 10만원이든 진심을 담은 축하라면 동등하게 받아들여져야 합니다. 금액으로 사회적 관계를 정량화하는 것은 결혼식의 본질을 흐립니다.", createdAt: Date.now() - 25200000, rebuttals: [] }
};

function isDemoMode() {
  return new URLSearchParams(location.search).get('demo') === 'true';
}

function scanLocalStorageDemoPayloads() {
  var result = {};
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key) continue;
      try {
        var raw = localStorage.getItem(key);
        if (!raw || raw[0] !== '{') continue;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') continue;

        // { nickname: payload, ... } 맵 구조
        var isMap = false;
        for (var n in parsed) {
          var v = parsed[n];
          if (v && typeof v === 'object' && (v.side === 'pro' || v.side === 'con')) {
            isMap = true;
            if (!result[n]) result[n] = v;
          }
        }
        if (isMap) continue;

        // 단일 payload 구조 (side, summary 직접 보유)
        if ((parsed.side === 'pro' || parsed.side === 'con') && parsed.summary) {
          // 키 끝에서 닉네임 추출 시도: "debate_payload_dan" → "dan"
          var parts = key.split(/[_\-\.\/]+/);
          var nick = parts[parts.length - 1];
          if (nick && nick.length > 0 && nick !== key) {
            if (!result[nick]) result[nick] = parsed;
          }
        }
      } catch (e) { /* skip */ }
    }
  } catch (e) {
    console.warn('[app] localStorage scan 실패:', e);
  }
  console.log('[scan] localStorage demo payloads:', Object.keys(result));
  return result;
}

function loadPayloadsWithSeed(info) {
  return info.loadPayloads().then(function(payloads) {
    var result = {};

    if (isDemoMode()) {
      // 1. 하드코딩 시드
      for (var name in DEMO_SEED) result[name] = DEMO_SEED[name];
      // 2. localStorage 스캔으로 사용자 작성 데이터 보강
      var scanned = scanLocalStorageDemoPayloads();
      for (var s in scanned) {
        if (scanned[s] && scanned[s].summary) {
          if (!scanned[s].rebuttals) scanned[s].rebuttals = [];
          result[s] = scanned[s];
        }
      }
    }

    // 3. debate-core.js 반환값으로 최종 덮어쓰기
    if (payloads) {
      for (var k in payloads) {
        var p = payloads[k];
        if (!p) { result[k] = p; continue; }
        if (!p.rebuttals) p.rebuttals = [];
        // 데모 모드에서 DEMO_SEED에 있는 사람의 side는 SEED 기준으로 고정
        if (isDemoMode() && DEMO_SEED[k] && p.side !== DEMO_SEED[k].side) {
          console.log('[merge] demo side 고정:', k, p.side, '→', DEMO_SEED[k].side);
          p = Object.assign({}, p, { side: DEMO_SEED[k].side });
        }
        result[k] = p;
      }
    }

    console.log('[merge] final keys:', Object.keys(result));
    return result;
  }).catch(function(err) {
    console.warn('[app] loadPayloads 실패:', err);
    if (isDemoMode()) {
      var r = {};
      for (var name in DEMO_SEED) r[name] = DEMO_SEED[name];
      var scanned2 = scanLocalStorageDemoPayloads();
      for (var s2 in scanned2) {
        if (scanned2[s2] && scanned2[s2].summary) {
          if (!scanned2[s2].rebuttals) scanned2[s2].rebuttals = [];
          r[s2] = scanned2[s2];
        }
      }
      if (isDemoMode()) {
        for (var fixK in r) {
          if (DEMO_SEED[fixK] && r[fixK] && r[fixK].side !== DEMO_SEED[fixK].side) {
            r[fixK] = Object.assign({}, r[fixK], { side: DEMO_SEED[fixK].side });
          }
        }
      }
      return r;
    }
    return {};
  });
}

// === 유틸 ===
function $(id) {
  var el = document.getElementById(id);
  if (!el) console.warn('[app] el not found:', id);
  return el;
}
function showScreen(id) {
  console.log('[app] showScreen:', id);
  document.querySelectorAll('.screen').forEach(function(el) { el.classList.remove('active'); });
  var t = document.getElementById(id);
  if (t) t.classList.add('active');
  window.scrollTo(0, 0);
}
function showToast(msg) {
  var t = $('toast');
  if (!t) { console.log('[toast]', msg); return; }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}
function formatDate(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var yy = String(d.getFullYear()).slice(2);
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  var h = d.getHours();
  var m = String(d.getMinutes()).padStart(2, '0');
  var ampm = h >= 12 ? 'PM' : 'AM';
  var hh = h % 12 || 12;
  return yy + '.' + mm + '.' + dd + ' ' + hh + ':' + m + ampm;
}
function setSideBadge(el, side) {
  if (!el) return;
  el.textContent = side === 'pro' ? '찬성' : '반대';
  el.classList.remove('pro', 'con');
  el.classList.add(side);
}
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// === 전역 ===
var currentInfo = null;
var cachedPayloads = {};
var currentPersuadeOpponent = null;
var currentSideFilter = 'all';
var currentRebuttalSort = 'oldest';
var currentHomeView = 'all';
var arenaState = { opponents: [], currentTarget: null };

function getActionType(authorSide, targetSide) {
  return authorSide === targetSide ? 'reply' : 'rebut';
}
function getActionLabel(type) {
  return type === 'reply' ? '답글' : '반론';
}
function createFlameBadge(count, side) {
  if (!count || count <= 0) return null;
  var color = side === 'pro' ? '#3b82f6' : '#dc2626';
  var displayCount = count > 99 ? '99+' : String(count);
  var wrapper = document.createElement('span');
  wrapper.className = 'flame-badge';
  wrapper.title = '받은 응답 ' + count + '개';
  wrapper.innerHTML =
    '<svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 1 C13 5, 17 6, 17 11 C17 13, 16 14, 15 15 C16 14, 18 13, 19 11 C20 14, 21 16, 21 19 C21 24, 17 27, 12 27 C7 27, 3 24, 3 19 C3 14, 7 11, 9 7 C10 9, 11 11, 12 11 C12 7, 11 4, 12 1 Z" ' +
      'fill="' + color + '"/>' +
    '</svg>' +
    '<span class="flame-count">' + displayCount + '</span>';
  return wrapper;
}

function collectAllResponsesFor(targetAuthor) {
  var count = 0;
  for (var name in cachedPayloads) {
    var p = cachedPayloads[name];
    if (!p || !p.rebuttals) continue;
    p.rebuttals.forEach(function(r) {
      if (r.targetType === 'opinion' && r.targetAuthor === targetAuthor) count++;
    });
  }
  return count;
}

// === 진입 ===
window.DebateCore.onReady(function(info) {
  console.log('[app] onReady', info);
  currentInfo = info;

  if (!info.nickname) {
    var s = $('screen-status');
    if (s) s.innerHTML = '<div class="status-screen">토론 플랫폼을 통해 접속하세요.</div>';
    showScreen('screen-status');
    return;
  }

  if (!isDemoMode() && info.status !== 'active') {
    var s2 = $('screen-status');
    if (s2) s2.innerHTML = '<div class="status-screen">토론이 진행 중이 아닙니다.</div>';
    showScreen('screen-status');
    return;
  }

  var titleEl = $('home-title');
  if (titleEl) titleEl.textContent = info.title || '오늘의 토론';

  bindGlobalEvents();
  loadAndShowHome();
});

// === 글로벌 이벤트 ===
function bindGlobalEvents() {
  document.querySelectorAll('[data-back]').forEach(function(btn) {
    btn.onclick = function() {
      if (btn.getAttribute('data-back') === 'home') loadAndShowHome();
    };
  });

  var writeBtn = $('write-btn');
  if (writeBtn) writeBtn.onclick = openWriteScreen;

  var sortSel = $('sort-select');
  if (sortSel) sortSel.onchange = renderHomeList;
  var searchInp = $('search-input');
  if (searchInp) searchInp.oninput = renderHomeList;

  var summaryInp = $('summary-input');
  var reasoningInp = $('reasoning-input');
  var submitBtn = $('submit-btn');
  function checkForm() {
    if (!summaryInp || !reasoningInp || !submitBtn) return;
    submitBtn.disabled = !(summaryInp.value.trim() && reasoningInp.value.trim());
  }
  if (summaryInp) summaryInp.oninput = checkForm;
  if (reasoningInp) reasoningInp.oninput = checkForm;
  if (submitBtn) submitBtn.onclick = handleSubmitOpinion;

  // 설득 미션
  var persuadeInp = $('persuade-input');
  var persuadeSubmit = $('persuade-submit');
  if (persuadeInp && persuadeSubmit) {
    persuadeInp.oninput = function() {
      persuadeSubmit.disabled = persuadeInp.value.trim().length === 0;
    };
  }
  if (persuadeSubmit) persuadeSubmit.onclick = handleSubmitPersuade;

  // (정렬 토글 제거됨 — 오래된 순 고정)

  // 뷰 전환 칩
  document.querySelectorAll('.view-chip').forEach(function(chip) {
    chip.onclick = function() { switchHomeView(chip.getAttribute('data-view')); };
  });

  // 아레나 모달 닫기
  var amClose = $('arena-modal-close');
  var amCancel = $('arena-modal-cancel');
  if (amClose) amClose.onclick = closeArenaModal;
  if (amCancel) amCancel.onclick = closeArenaModal;
  var amBackdrop = document.querySelector('.arena-modal-backdrop');
  if (amBackdrop) amBackdrop.onclick = closeArenaModal;

  // 아레나 가드 버튼
  var agBtn = $('arena-guard-btn');
  if (agBtn) agBtn.onclick = openWriteScreen;

}

// === 홈 ===
function loadAndShowHome() {
  if (!currentInfo) return;
  loadPayloadsWithSeed(currentInfo).then(function(payloads) {
    cachedPayloads = payloads || {};
    var myPayload = cachedPayloads[currentInfo.nickname];
    var writeBtn = $('write-btn');
    if (writeBtn) {
      if (myPayload && myPayload.summary) {
        writeBtn.disabled = true;
        writeBtn.textContent = '이미 작성함';
      } else {
        writeBtn.disabled = false;
        writeBtn.textContent = '내 의견 쓰기';
      }
    }
    switchHomeView(currentHomeView || 'all');
    showScreen('screen-home');
  }).catch(function(err) {
    console.error('[app] loadAndShowHome 실패:', err);
    cachedPayloads = {};
    switchHomeView(currentHomeView || 'all');
    showScreen('screen-home');
  });
}

function switchHomeView(view) {
  currentHomeView = view;
  document.querySelectorAll('.view-chip').forEach(function(c) {
    c.classList.toggle('active', c.getAttribute('data-view') === view);
  });

  var descEl = document.getElementById('home-desc');
  if (descEl) {
    if (view === 'arena') {
      descEl.innerHTML = '당신을 둘러싼 상대 진영.<br>하나씩 선택해 반박하고, 토론의 흐름을 뒤집어보세요.';
    } else {
      descEl.innerHTML = '이 사이트는 두 가지 모드로 토론할 수 있습니다.<br><strong>전체 보기</strong>에서 다양한 의견을 살펴보고, <strong>토론 아레나</strong>에서 상대 입장과 반론을 펼쳐보세요!';
    }
  }

  var viewAll = document.getElementById('view-all');
  var viewArena = document.getElementById('view-arena');
  if (!viewAll || !viewArena) return;
  if (view === 'all') {
    viewAll.style.display = '';
    viewArena.style.display = 'none';
    renderHomeStats();
    renderHotBanner();
    renderHomeList();
  } else {
    viewAll.style.display = 'none';
    viewArena.style.display = '';
    renderArenaView();
  }
}

function renderHomeStats() {
  var el = $('home-stats');
  if (!el) return;

  var totalOpinions = 0, totalRebuttals = 0, proCount = 0, conCount = 0;
  for (var name in cachedPayloads) {
    var p = cachedPayloads[name];
    if (!p || !p.summary) continue;
    totalOpinions++;
    if (p.side === 'pro') proCount++;
    else conCount++;
    if (p.rebuttals) totalRebuttals += p.rebuttals.length;
  }

  el.innerHTML =
    '<div class="stat-item"><span class="stat-value">' + totalOpinions + '</span> 명 참여</div>' +
    '<div class="stat-item"><span class="stat-value">' + totalRebuttals + '</span> 건 반론</div>' +
    '<div class="stat-item" style="color:#1d4ed8"><span class="stat-value" style="color:#1d4ed8">' + proCount + '</span> 찬성</div>' +
    '<div class="stat-item" style="color:#b91c1c"><span class="stat-value" style="color:#b91c1c">' + conCount + '</span> 반대</div>';
}

function renderHotBanner() {
  var el = $('hot-banner');
  if (!el) return;

  var hotAuthor = null, hotCount = 0;
  for (var name in cachedPayloads) {
    var p = cachedPayloads[name];
    if (!p || !p.summary) continue;
    var cnt = collectRebuttalsFor(name, name, 'opinion').length;
    if (cnt > hotCount) { hotCount = cnt; hotAuthor = name; }
  }

  if (!hotAuthor || hotCount === 0) {
    el.style.display = 'none';
    return;
  }

  var p = cachedPayloads[hotAuthor];
  var isPro = p.side === 'pro';

  // 배너 배경: 찬성이면 파란 계열, 반대이면 빨간 계열
  el.style.background = isPro
    ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
    : 'linear-gradient(135deg, #fee2e2, #fecaca)';
  el.style.borderColor = isPro ? '#93c5fd' : '#fca5a5';
  el.style.display = '';

  el.innerHTML =
    '<div class="hot-banner-label" style="color:' + (isPro ? '#1d4ed8' : '#b91c1c') + '">댓글창 지금 불타는 중🔥</div>' +
    '<p class="hot-banner-summary">' + escapeHtml(p.summary) + '</p>' +
    '<div class="hot-banner-meta">' + escapeHtml(hotAuthor) + ' · 반론 ' + hotCount + '건</div>';

  el.onclick = function() {
    var card = document.querySelector('.opinion-card[data-author="' + hotAuthor + '"]');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
}

function getRebuttalCount(author) {
  return collectRebuttalsFor(author, author, 'opinion').length;
}

function splitReasons(text) {
  if (!text) return [];
  var parts = text.split(/\n\s*\n/).map(function(s) { return s.trim(); }).filter(Boolean);
  if (parts.length <= 1) {
    parts = text.split(/\n/).map(function(s) { return s.trim(); }).filter(Boolean);
  }
  if (parts.length === 0) return [text.trim()];
  return parts;
}

function countAllResponsesInTree(targetAuthor) {
  var tree = buildThreadForOpinion(targetAuthor);
  var total = 0;
  function walk(nodes) { nodes.forEach(function(n) { total++; walk(n.children); }); }
  walk(tree);
  return total;
}

function renderHomeList() {
  var proListEl = $('pro-list');
  var conListEl = $('con-list');
  var proCountEl = $('pro-count');
  var conCountEl = $('con-count');
  if (!proListEl || !conListEl) return;

  var items = [];
  for (var name in cachedPayloads) {
    var p = cachedPayloads[name];
    if (!p || !p.summary) continue;
    items.push({ author: name, side: p.side, summary: p.summary, reasoning: p.reasoning, createdAt: p.createdAt || 0 });
  }
  console.log('[app] render items count:', items.length);

  var searchInp = $('search-input');
  var q = searchInp ? searchInp.value.trim().toLowerCase() : '';
  if (q) {
    items = items.filter(function(it) {
      return (it.summary && it.summary.toLowerCase().indexOf(q) >= 0) ||
             (it.reasoning && it.reasoning.toLowerCase().indexOf(q) >= 0);
    });
  }

  var sortSel = $('sort-select');
  var sort = sortSel ? sortSel.value : 'latest';
  items.sort(function(a, b) {
    if (sort === 'hot') return countAllResponsesInTree(b.author) - countAllResponsesInTree(a.author);
    return sort === 'oldest' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
  });

  var proItems = items.filter(function(it) { return it.side === 'pro'; });
  var conItems = items.filter(function(it) { return it.side === 'con'; });

  if (proCountEl) proCountEl.textContent = proItems.length;
  if (conCountEl) conCountEl.textContent = conItems.length;

  renderColumn(proListEl, proItems, '아직 찬성 의견이 없습니다.');
  renderColumn(conListEl, conItems, '아직 반대 의견이 없습니다.');
}

function renderColumn(listEl, items, emptyText) {
  listEl.innerHTML = '';
  if (items.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = emptyText;
    listEl.appendChild(empty);
    return;
  }
  items.forEach(function(it) { listEl.appendChild(buildOpinionCard(it)); });
}

function buildOpinionCard(it) {
  var card = document.createElement('article');
  card.className = 'opinion-card';
  card.setAttribute('data-author', it.author);
  if (it.author === currentInfo.nickname) card.classList.add('is-mine');

  // 헤더
  var header = document.createElement('div');
  header.className = 'card-header';
  var authorEl = document.createElement('span');
  authorEl.className = 'card-author';
  authorEl.textContent = it.author;
  header.appendChild(authorEl);
  if (it.author === currentInfo.nickname) {
    var meBadge = document.createElement('span');
    meBadge.className = 'me-badge';
    meBadge.textContent = '나';
    header.appendChild(meBadge);
  }
  var metaRight = document.createElement('div');
  metaRight.className = 'card-meta-right';
  var totalResp = countAllResponsesInTree(it.author);
  if (totalResp > 0) {
    var color = it.side === 'pro' ? '#3b82f6' : '#ef4444';
    var flame = document.createElement('span');
    flame.className = 'card-flame';
    flame.innerHTML =
      '<svg width="12" height="14" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 1 C13 5, 17 6, 17 11 C17 13, 16 14, 15 15 C16 14, 18 13, 19 11 C20 14, 21 16, 21 19 C21 24, 17 27, 12 27 C7 27, 3 24, 3 19 C3 14, 7 11, 9 7 C10 9, 11 11, 12 11 C12 7, 11 4, 12 1 Z" fill="' + color + '"/>' +
      '</svg>' +
      '<span>' + totalResp + '</span>';
    metaRight.appendChild(flame);
  }
  header.appendChild(metaRight);
  card.appendChild(header);

  // 요약
  var summary = document.createElement('h3');
  summary.className = 'card-summary';
  summary.textContent = it.summary;
  card.appendChild(summary);

  // 근거 블록
  var reasons = splitReasons(it.reasoning);
  reasons.forEach(function(r) {
    var block = document.createElement('div');
    block.className = 'reason-block';
    var text = document.createElement('p');
    text.className = 'reason-text';
    text.textContent = r;
    block.appendChild(text);
    card.appendChild(block);
  });

  // 스레드
  var threadWrap = document.createElement('div');
  threadWrap.className = 'card-thread';
  var tree = buildThreadForOpinion(it.author);
  if (tree.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'card-thread-empty';
    emptyEl.textContent = '아직 반론이 없습니다.';
    threadWrap.appendChild(emptyEl);
  } else {
    tree.forEach(function(node) { threadWrap.appendChild(buildThreadNode(node, it.side, 1)); });
  }
  card.appendChild(threadWrap);

  // 반론 달기 (본인 제외)
  if (it.author !== currentInfo.nickname) {
    var actions = document.createElement('div');
    actions.className = 'card-actions';
    var replyBtn = document.createElement('button');
    replyBtn.className = 'action-btn';
    replyBtn.textContent = '반론 달기';
    (function(cardEl, author) {
      replyBtn.onclick = function(e) { e.stopPropagation(); toggleCardReplyForm(cardEl, author); };
    })(card, it.author);
    actions.appendChild(replyBtn);
    card.appendChild(actions);
  }

  return card;
}

function toggleCardReplyForm(cardEl, targetAuthor) {
  var existing = cardEl.querySelector(':scope > .inline-reply-form');
  if (existing) { existing.remove(); return; }
  var form = document.createElement('div');
  form.className = 'inline-reply-form';
  form.innerHTML =
    '<textarea class="inline-reply-textarea" placeholder="이 의견, 동의하시나요? 아니면 반박해보세요"></textarea>' +
    '<div class="inline-reply-actions">' +
      '<button class="cancel-btn">취소</button>' +
      '<button class="submit-btn" disabled>등록</button>' +
    '</div>';
  cardEl.appendChild(form);
  var ta = form.querySelector('.inline-reply-textarea');
  var sub = form.querySelector('.submit-btn');

  // @멘션 자동 삽입
  var prefix = '@' + targetAuthor + ' ';
  ta.value = prefix;
  ta.setSelectionRange(prefix.length, prefix.length);
  sub.disabled = ta.value.trim().length === 0;

  ta.oninput = function() { sub.disabled = ta.value.trim().length === 0; };
  form.querySelector('.cancel-btn').onclick = function(e) { e.stopPropagation(); form.remove(); };
  sub.onclick = function(e) {
    e.stopPropagation();
    var text = ta.value.trim();
    if (!text) return;
    sub.disabled = true;
    submitRebuttal({ targetType: 'opinion', targetAuthor: targetAuthor, targetId: targetAuthor, content: text });
  };
  ta.focus();
}

// === 작성 ===
function openWriteScreen() {
  var myPayload = cachedPayloads[currentInfo.nickname];
  if (myPayload && myPayload.summary) {
    showToast('이미 의견을 작성하셨습니다.');
    return;
  }
  var sumEl = $('summary-input');
  var reaEl = $('reasoning-input');
  if (sumEl) sumEl.value = '';
  if (reaEl) reaEl.value = '';
  var sub = $('submit-btn');
  if (sub) sub.disabled = true;
  showScreen('screen-write');
}

function handleSubmitOpinion() {
  var sumEl = $('summary-input');
  var reaEl = $('reasoning-input');
  if (!sumEl || !reaEl) return;
  var summary = sumEl.value.trim();
  var reasoning = reaEl.value.trim();
  if (!summary || !reasoning) return;
  var sub = $('submit-btn');
  if (sub) sub.disabled = true;

  currentInfo.savePayload({
    side: getMyNormalizedSide() || currentInfo.side,
    summary: summary,
    reasoning: reasoning,
    createdAt: Date.now(),
    rebuttals: []
  }).then(function() {
    return loadPayloadsWithSeed(currentInfo);
  }).then(function(payloads) {
    cachedPayloads = payloads || {};

    var mySide2 = getMyNormalizedSide();
    var candidates = [];
    for (var name in cachedPayloads) {
      if (name === currentInfo.nickname) continue;
      var p = cachedPayloads[name];
      if (!p || !p.summary) continue;
      var theirSide2 = typeof p.side === 'string' ? p.side.trim().toLowerCase() : '';
      if (theirSide2 !== 'pro' && theirSide2 !== 'con') continue;
      if (theirSide2 === mySide2) continue;
      candidates.push({ nickname: name, side: theirSide2, summary: p.summary, reasoning: p.reasoning });
    }

    if (candidates.length === 0) {
      loadAndShowHome();
      return;
    }

    // 최종 선택
    var chosen = candidates[Math.floor(Math.random() * candidates.length)];

    // 연출용 후보 배열: 최대 5명 랜덤 추출 (chosen 포함 보장)
    var pool = candidates.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var displayList = pool.slice(0, Math.min(5, pool.length));
    var hasChosen = displayList.some(function(c) { return c.nickname === chosen.nickname; });
    if (!hasChosen) displayList[displayList.length - 1] = chosen;

    runDrawAnimation(displayList, chosen, function() {
      enterPersuadeScreen(chosen);
    });
  }).catch(function(err) {
    console.error('[app] 저장 실패:', err);
    showToast('저장 실패: ' + (err.message || err));
    if (sub) sub.disabled = false;
  });
}

function runDrawAnimation(displayList, chosen, onDone) {
  var container = $('draw-candidates');
  var hint = $('draw-hint');
  if (!container) { onDone(); return; }

  container.innerHTML = '';
  displayList.forEach(function(c, idx) {
    var card = document.createElement('div');
    card.className = 'draw-card';
    card.setAttribute('data-idx', idx);
    var name = document.createElement('div');
    name.className = 'draw-card-name';
    name.textContent = c.nickname;
    var side = document.createElement('div');
    side.className = 'draw-card-side';
    side.textContent = c.side === 'pro' ? '찬성' : '반대';
    card.appendChild(name);
    card.appendChild(side);
    container.appendChild(card);
  });
  if (hint) hint.textContent = '잠시만 기다려주세요';

  showScreen('screen-draw');

  // 후보 1명: 짧은 강조만
  if (displayList.length === 1) {
    setTimeout(function() {
      var only = container.querySelector('.draw-card');
      if (only) only.classList.add('selected');
      if (hint) hint.textContent = '매칭되었습니다';
      setTimeout(onDone, 700);
    }, 300);
    return;
  }

  var chosenIdx = 0;
  displayList.forEach(function(c, idx) {
    if (c.nickname === chosen.nickname) chosenIdx = idx;
  });

  // 스캔 시퀀스: 왕복하며 점점 느려짐, 마지막은 chosenIdx
  var sequence = [];
  var delays = [90, 90, 90, 110, 130, 160, 200, 260, 340, 440];
  var pos = 0, dir = 1;
  for (var k = 0; k < delays.length; k++) {
    sequence.push({ idx: pos, delay: delays[k] });
    pos += dir;
    if (pos >= displayList.length) { pos = displayList.length - 2; dir = -1; }
    if (pos < 0) { pos = 1; dir = 1; }
  }
  sequence.push({ idx: chosenIdx, delay: 500 });

  var cards = container.querySelectorAll('.draw-card');

  function step(i) {
    cards.forEach(function(el) { el.classList.remove('scanning'); });
    var cur = sequence[i];
    if (cards[cur.idx]) cards[cur.idx].classList.add('scanning');

    if (i < sequence.length - 1) {
      setTimeout(function() { step(i + 1); }, cur.delay);
    } else {
      setTimeout(function() {
        cards.forEach(function(el) {
          el.classList.remove('scanning');
          el.classList.add('faded');
        });
        if (cards[chosenIdx]) {
          cards[chosenIdx].classList.remove('faded');
          cards[chosenIdx].classList.add('selected');
        }
        if (hint) hint.textContent = chosen.nickname + '님이 배정되었습니다';
        setTimeout(onDone, 700);
      }, 100);
    }
  }

  step(0);
}

// === 설득 미션 ===
function enterPersuadeScreen(opp) {
  console.log('[persuade] enterPersuadeScreen 호출됨, opp:', opp);
  if (!opp) {
    console.error('[persuade] opp 없음, 홈으로 복귀');
    loadAndShowHome();
    return;
  }
  currentPersuadeOpponent = opp;

  var authEl = document.getElementById('persuade-author');
  var sideEl = document.getElementById('persuade-side');
  var sumEl = document.getElementById('persuade-summary');
  var reaEl = document.getElementById('persuade-reasoning');
  var inp = document.getElementById('persuade-input');
  var subBtn = document.getElementById('persuade-submit');
  if (authEl) authEl.textContent = opp.nickname;
  if (sideEl) setSideBadge(sideEl, opp.side);
  if (sumEl) sumEl.textContent = opp.summary || '';
  if (reaEl) reaEl.textContent = opp.reasoning || '';
  if (inp) {
    var prefix = '@' + opp.nickname + ' ';
    inp.value = prefix;
    inp.oninput = function() { if (subBtn) subBtn.disabled = inp.value.trim().length === 0; };
    if (subBtn) subBtn.disabled = inp.value.trim().length === 0;
    setTimeout(function() { inp.setSelectionRange(prefix.length, prefix.length); }, 0);
  }
  if (subBtn) { subBtn.onclick = handleSubmitPersuade; }

  console.log('[persuade] showScreen(screen-persuade) 호출');
  showScreen('screen-persuade');
  console.log('[persuade] showScreen 완료');
}

function handleSubmitPersuade() {
  var inp = $('persuade-input');
  var subBtn = $('persuade-submit');
  if (!inp || !currentPersuadeOpponent) return;
  var text = inp.value.trim();
  if (!text) return;
  if (subBtn) subBtn.disabled = true;

  var opp = currentPersuadeOpponent;
  loadPayloadsWithSeed(currentInfo).then(function(payloads) {
    var mine = (payloads && payloads[currentInfo.nickname]) || {
      side: getMyNormalizedSide() || currentInfo.side,
      summary: '',
      reasoning: '',
      createdAt: Date.now(),
      rebuttals: []
    };
    if (!mine.rebuttals) mine.rebuttals = [];
    mine.rebuttals.push({
      id: 'reb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      targetType: 'opinion',
      targetAuthor: opp.nickname,
      targetId: opp.nickname,
      content: text,
      timestamp: Date.now()
    });
    return currentInfo.savePayload(mine);
  }).then(function() {
    showToast('설득 반론이 등록되었습니다!');
    currentPersuadeOpponent = null;
    loadAndShowHome();
  }).catch(function(err) {
    console.error('[app] 설득 반박 저장 실패:', err);
    showToast('저장 실패: ' + (err.message || err));
    if (subBtn) subBtn.disabled = false;
  });
}

// === 반박 수집 (홈 통계/아레나용) ===
function collectRebuttalsFor(targetAuthor, targetId, targetType) {
  var result = [];
  for (var name in cachedPayloads) {
    var p = cachedPayloads[name];
    if (!p || !p.rebuttals) continue;
    for (var i = 0; i < p.rebuttals.length; i++) {
      var r = p.rebuttals[i];
      if (r.targetType === targetType && r.targetAuthor === targetAuthor && r.targetId === targetId) {
        result.push({ id: r.id, author: name, side: p.side, content: r.content, timestamp: r.timestamp });
      }
    }
  }
  result.sort(function(a, b) { return (a.timestamp || 0) - (b.timestamp || 0); });
  return result;
}

// === 스레드 트리 빌드 ===
function buildAllRebuttals() {
  var all = [];
  for (var name in cachedPayloads) {
    var p = cachedPayloads[name];
    if (!p || !p.rebuttals) continue;
    p.rebuttals.forEach(function(r) {
      all.push({ id: r.id, author: name, side: p.side, targetType: r.targetType, targetAuthor: r.targetAuthor, targetId: r.targetId, content: r.content, timestamp: r.timestamp });
    });
  }
  all.sort(function(a, b) { return (a.timestamp || 0) - (b.timestamp || 0); });
  return all;
}

function buildThreadForOpinion(targetAuthor) {
  var all = buildAllRebuttals();
  function buildChildren(parentId, isOpinion, depth) {
    if (depth > 50) return []; // 무한루프 안전장치
    return all.filter(function(r) {
      return isOpinion
        ? (r.targetType === 'opinion' && r.targetAuthor === parentId)
        : (r.targetType === 'rebuttal' && r.targetId === parentId);
    }).map(function(r) {
      return { node: r, depth: depth, children: buildChildren(r.id, false, depth + 1) };
    });
  }
  return buildChildren(targetAuthor, true, 1);
}

function findRebuttalById(id) {
  for (var name in cachedPayloads) {
    var p = cachedPayloads[name];
    if (!p || !p.rebuttals) continue;
    for (var i = 0; i < p.rebuttals.length; i++) {
      if (p.rebuttals[i].id === id) return { author: name, side: p.side };
    }
  }
  return null;
}

// === 스레드 렌더 ===
function renderThread(targetAuthor) {
  var listEl = $('rebuttals-list');
  var titleEl = document.querySelector('#screen-detail .rebuttals-title');
  if (!listEl) return;

  var targetPayload = cachedPayloads[targetAuthor];
  var targetSide = targetPayload ? targetPayload.side : null;
  var tree = buildThreadForOpinion(targetAuthor);

  var totalCount = 0;
  (function countTree(nodes) {
    nodes.forEach(function(n) { totalCount++; countTree(n.children); });
  })(tree);
  if (titleEl) titleEl.textContent = '응답 ' + totalCount;

  listEl.innerHTML = '';
  if (tree.length === 0) {
    listEl.innerHTML = '<div class="empty-state" style="padding:20px 0;">아직 반응이 없습니다. 첫 의견을 남겨보세요.</div>';
    return;
  }
  tree.forEach(function(entry) {
    listEl.appendChild(buildThreadNode(entry, targetSide));
  });
}

function renderContentWithMentions(container, text) {
  // @닉네임 패턴을 찾아 .mention span으로 렌더링
  var parts = text.split(/(@\S+)/g);
  parts.forEach(function(part) {
    if (/^@\S+$/.test(part)) {
      var mention = document.createElement('span');
      mention.className = 'mention';
      mention.textContent = part + ' ';
      container.appendChild(mention);
    } else if (part.length > 0) {
      container.appendChild(document.createTextNode(part));
    }
  });
}

function buildThreadNode(entry, rootTargetSide, visualDepth) {
  if (typeof visualDepth !== 'number') visualDepth = Math.min(entry.depth, 2);
  var clampedVisual = Math.min(visualDepth, 2);

  var r = entry.node;
  var wrapper = document.createElement('div');
  wrapper.className = 'thread-node depth-' + clampedVisual;
  if (r.author === currentInfo.nickname) wrapper.classList.add('is-mine');

  // 헤더
  var head = document.createElement('div');
  head.className = 'thread-head';
  var authorSpan = document.createElement('span');
  authorSpan.className = 'author';
  authorSpan.textContent = r.author;
  head.appendChild(authorSpan);
  if (r.author === currentInfo.nickname) {
    var meBadge = document.createElement('span');
    meBadge.className = 'me-badge';
    meBadge.textContent = '나';
    head.appendChild(meBadge);
  }
  var sideBadge = document.createElement('span');
  sideBadge.className = 'side-badge';
  setSideBadge(sideBadge, r.side);
  head.appendChild(sideBadge);
  var timeSpan = document.createElement('span');
  timeSpan.className = 'time';
  timeSpan.textContent = formatDate(r.timestamp);
  head.appendChild(timeSpan);
  wrapper.appendChild(head);

  // 본문: depth 2 이상 rebuttal → 부모 작성자 @멘션 자동 prepend + content 내 @멘션 파싱
  var body = document.createElement('p');
  body.className = 'thread-body';

  // depth 2 이상 rebuttal → 부모 작성자 @멘션 자동 prepend
  // 단, content가 이미 "@부모닉네임"으로 시작하면 중복 방지를 위해 스킵
  if (entry.depth >= 2 && r.targetType === 'rebuttal') {
    var parent = findRebuttalById(r.targetId);
    if (parent && parent.author && parent.author !== r.author) {
      var alreadyMentioned = r.content.trimStart().toLowerCase()
        .indexOf('@' + parent.author.toLowerCase()) === 0;
      if (!alreadyMentioned) {
        var autoMention = document.createElement('span');
        autoMention.className = 'mention';
        autoMention.textContent = '@' + parent.author + ' ';
        body.appendChild(autoMention);
      }
    }
  }

  renderContentWithMentions(body, r.content);
  wrapper.appendChild(body);

  // 답글 버튼 (본인 아닐 때, 깊이 제한 없음)
  var actions = document.createElement('div');
  actions.className = 'thread-actions';
  if (r.author !== currentInfo.nickname) {
    var replyBtn = document.createElement('button');
    replyBtn.className = 'reply-toggle-btn';
    replyBtn.textContent = '답글';
    (function(w, rr) { replyBtn.onclick = function() { toggleInlineReply(w, rr); }; })(wrapper, r);
    actions.appendChild(replyBtn);
  }
  wrapper.appendChild(actions);

  // 자식 노드 (시각 깊이는 2에서 고정)
  if (entry.children.length > 0) {
    var childrenWrap = document.createElement('div');
    var nextVisual = Math.min(clampedVisual + 1, 2);
    childrenWrap.className = clampedVisual >= 2 ? 'thread-children thread-children-flat' : 'thread-children';
    entry.children.forEach(function(child) {
      childrenWrap.appendChild(buildThreadNode(child, rootTargetSide, nextVisual));
    });
    wrapper.appendChild(childrenWrap);
  }
  return wrapper;
}

function toggleInlineReply(parentEl, parentRebuttal) {
  var existing = parentEl.querySelector(':scope > .inline-reply-form');
  if (existing) { existing.remove(); return; }
  var form = document.createElement('div');
  form.className = 'inline-reply-form';
  form.innerHTML =
    '<textarea class="inline-reply-textarea" placeholder="이 의견, 동의하시나요? 아니면 반박해보세요"></textarea>' +
    '<div class="inline-reply-actions">' +
      '<button class="secondary-btn cancel-btn">취소</button>' +
      '<button class="primary-btn submit-btn" disabled>등록</button>' +
    '</div>';
  parentEl.appendChild(form);
  var ta = form.querySelector('.inline-reply-textarea');
  var sub = form.querySelector('.submit-btn');

  // @멘션 자동 삽입
  var prefix = '@' + parentRebuttal.author + ' ';
  ta.value = prefix;
  ta.setSelectionRange(prefix.length, prefix.length);
  sub.disabled = ta.value.trim().length === 0;

  ta.oninput = function() { sub.disabled = ta.value.trim().length === 0; };
  form.querySelector('.cancel-btn').onclick = function() { form.remove(); };
  sub.onclick = function() {
    var text = ta.value.trim();
    if (!text) return;
    sub.disabled = true;
    submitRebuttal({ targetType: 'rebuttal', targetAuthor: parentRebuttal.author, targetId: parentRebuttal.id, content: text });
  };
  ta.focus();
}

// === 구형 renderRebuttalsList (하위 호환 — 사용처 없음, 제거 가능) ===
function renderRebuttalsList(targetAuthor) {
  var listEl = $('rebuttals-list');
  var titleEl = document.querySelector('#screen-detail .rebuttals-title');
  if (!listEl) return;

  var targetPayload = cachedPayloads[targetAuthor];
  var targetSide = targetPayload ? targetPayload.side : null;

  var rebuttals = collectRebuttalsFor(targetAuthor, targetAuthor, 'opinion');

  // 답글/반박 개수 분리 집계
  var replyCount = 0, rebutCount = 0;
  rebuttals.forEach(function(r) {
    if (targetSide && r.side === targetSide) replyCount++;
    else rebutCount++;
  });
  if (titleEl) titleEl.textContent = '답글 ' + replyCount + ' · 반박 ' + rebutCount;

  if (rebuttals.length === 0) {
    listEl.innerHTML = '<div class="empty-state" style="padding:20px 0;">아직 반응이 없습니다.</div>';
    return;
  }

  listEl.innerHTML = '';
  rebuttals.forEach(function(r) {
    var item = document.createElement('div');
    item.className = 'rebuttal-item';
    if (r.author === currentInfo.nickname) item.classList.add('is-mine');

    var head = document.createElement('div');
    head.className = 'rebuttal-head';

    var authorSpan = document.createElement('span');
    authorSpan.className = 'author';
    authorSpan.textContent = r.author;
    if (r.author === currentInfo.nickname) {
      var meBadgeReb = document.createElement('span');
      meBadgeReb.className = 'me-badge';
      meBadgeReb.textContent = '내 반응';
      authorSpan.appendChild(meBadgeReb);
    }
    head.appendChild(authorSpan);

    var sideBadge = document.createElement('span');
    sideBadge.className = 'side-badge';
    setSideBadge(sideBadge, r.side);
    head.appendChild(sideBadge);

    // 답글/반박 라벨
    var aType = getActionType(r.side, targetSide || (r.side === 'pro' ? 'con' : 'pro'));
    var aLabel = document.createElement('span');
    aLabel.className = 'action-label ' + aType;
    aLabel.textContent = getActionLabel(aType);
    head.appendChild(aLabel);

    var timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = formatDate(r.timestamp);
    head.appendChild(timeSpan);
    item.appendChild(head);

    var body = document.createElement('p');
    body.className = 'rebuttal-body';
    body.textContent = r.content;
    item.appendChild(body);

    // 답글/재반박 버튼 (본인이 작성한 반박이 아닐 때)
    if (r.author !== currentInfo.nickname) {
      var actions = document.createElement('div');
      actions.className = 'rebuttal-actions';
      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'reply-toggle-btn';
      var myToRType = getActionType(currentInfo.side, r.side);
      toggleBtn.textContent = myToRType === 'reply' ? '답글' : '재반박';
      (function(capturedItem, capturedR) {
        toggleBtn.onclick = function() { toggleReplyForm(capturedItem, capturedR); };
      })(item, r);
      actions.appendChild(toggleBtn);
      item.appendChild(actions);
    }

    // 이 반박에 달린 재반박
    var replies = collectRebuttalsFor(r.author, r.id, 'rebuttal');
    if (replies.length > 0) {
      var repliesList = document.createElement('div');
      repliesList.className = 'replies-list';
      replies.forEach(function(rep) {
        var repItem = document.createElement('div');
        repItem.className = 'reply-item';
        var repHead = document.createElement('div');
        repHead.className = 'reply-head';

        var repAuthor = document.createElement('span');
        repAuthor.className = 'author';
        repAuthor.textContent = rep.author;
        repHead.appendChild(repAuthor);

        // 재반박: 재반박 대상(r) side와 비교
        var repAType = getActionType(rep.side, r.side);
        var repLabel = document.createElement('span');
        repLabel.className = 'action-label ' + repAType;
        repLabel.textContent = getActionLabel(repAType);
        repHead.appendChild(repLabel);

        var repTime = document.createElement('span');
        repTime.className = 'time';
        repTime.textContent = formatDate(rep.timestamp);
        repHead.appendChild(repTime);

        var repBody = document.createElement('p');
        repBody.className = 'reply-body';
        repBody.textContent = rep.content;
        repItem.appendChild(repHead);
        repItem.appendChild(repBody);
        repliesList.appendChild(repItem);
      });
      item.appendChild(repliesList);
    }

    listEl.appendChild(item);
  });
}

// === 재반박 토글 ===
function toggleReplyForm(itemEl, parentRebuttal) {
  var existing = itemEl.querySelector('.reply-form');
  if (existing) { existing.remove(); return; }

  var myActionType = getActionType(currentInfo.side, parentRebuttal.side);
  var placeholderText = myActionType === 'reply' ? '답글 내용...' : '재반박 내용...';
  var submitText = myActionType === 'reply' ? '답글 등록' : '재반박 등록';

  var form = document.createElement('div');
  form.className = 'reply-form';

  var ta = document.createElement('textarea');
  ta.className = 'reply-textarea';
  ta.placeholder = placeholderText;

  var formActions = document.createElement('div');
  formActions.className = 'reply-form-actions';

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'secondary-btn';
  cancelBtn.textContent = '취소';
  cancelBtn.onclick = function() { form.remove(); };

  var submitBtn = document.createElement('button');
  submitBtn.className = 'primary-btn';
  submitBtn.textContent = submitText;
  submitBtn.disabled = true;

  ta.oninput = function() { submitBtn.disabled = ta.value.trim().length === 0; };
  submitBtn.onclick = function() {
    var text = ta.value.trim();
    if (!text) return;
    submitBtn.disabled = true;
    submitRebuttal({
      targetType: 'rebuttal',
      targetAuthor: parentRebuttal.author,
      targetId: parentRebuttal.id,
      content: text,
      actionType: myActionType
    });
  };

  formActions.appendChild(cancelBtn);
  formActions.appendChild(submitBtn);
  form.appendChild(ta);
  form.appendChild(formActions);
  itemEl.appendChild(form);
}

// === 반박 제출 (상세 화면 직접) ===
// === 반박 저장 공통 ===
function submitRebuttal(data) {
  loadPayloadsWithSeed(currentInfo).then(function(payloads) {
    var mine = (payloads && payloads[currentInfo.nickname]) || {
      side: getMyNormalizedSide() || currentInfo.side,
      summary: '',
      reasoning: '',
      createdAt: Date.now(),
      rebuttals: []
    };
    if (!mine.rebuttals) mine.rebuttals = [];
    mine.rebuttals.push({
      id: 'reb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      targetType: data.targetType,
      targetAuthor: data.targetAuthor,
      targetId: data.targetId,
      content: data.content,
      timestamp: Date.now()
    });
    return currentInfo.savePayload(mine);
  }).then(function() {
    return loadPayloadsWithSeed(currentInfo);
  }).then(function(payloads) {
    cachedPayloads = payloads || {};
    showToast('반론이 등록되었습니다.');
    renderHomeList();
    renderHomeStats();
    renderHotBanner();
  }).catch(function(err) {
    console.error('[app] 반박 저장 실패:', err);
    showToast('저장 실패: ' + (err.message || err));
  });
}

// === 토론 아레나 ===
// URL 파라미터 또는 currentInfo.side를 정규화하여 반환 (아레나/설득미션 공용)
function getMyNormalizedSide() {
  // 1순위: cachedPayloads에 저장된 본인의 실제 side (고유 입장, 변경 불가)
  var myPayload = currentInfo && cachedPayloads[currentInfo.nickname];
  if (myPayload && (myPayload.side === 'pro' || myPayload.side === 'con')) {
    return myPayload.side;
  }
  // 2순위: currentInfo.side (debate-core.js가 서버에서 읽어온 값)
  var infoSide = currentInfo && typeof currentInfo.side === 'string'
    ? currentInfo.side.trim().toLowerCase() : '';
  if (infoSide === 'pro' || infoSide === 'con') return infoSide;
  // 3순위: URL 파라미터 (최후 fallback)
  var urlSide = new URLSearchParams(location.search).get('side');
  return (urlSide === 'pro' || urlSide === 'con') ? urlSide : '';
}

function renderArenaView() {
  var guard = $('arena-guard');
  var guardText = $('arena-guard-text');
  var guardBtn = $('arena-guard-btn');
  var stage = $('arena-stage');
  if (!guard || !stage) return;

  var myPayload = cachedPayloads[currentInfo.nickname];
  var hasMyOpinion = !!(myPayload && myPayload.summary);

  // URL 파라미터 우선, 정규화
  var mySide = getMyNormalizedSide();
  console.log('[arena] mySide:', mySide, '(url:', new URLSearchParams(location.search).get('side'), ', info:', currentInfo.side, ')');

  if (mySide !== 'pro' && mySide !== 'con') {
    guard.style.display = 'block';
    stage.style.display = 'none';
    if (guardText) guardText.textContent = '진영 정보를 확인할 수 없습니다.';
    if (guardBtn) guardBtn.style.display = 'none';
    return;
  }

  // 반대 진영 수집 (side 정규화 + 엄격 필터)
  var opponents = [];
  for (var name in cachedPayloads) {
    if (name === currentInfo.nickname) continue;
    var p = cachedPayloads[name];
    if (!p || !p.summary) continue;
    var theirSide = typeof p.side === 'string' ? p.side.trim().toLowerCase() : '';
    if (theirSide !== 'pro' && theirSide !== 'con') {
      console.warn('[arena] 잘못된 side 값:', name, p.side);
      continue;
    }
    if (theirSide === mySide) {
      console.log('[arena] 같은 진영 제외:', name, theirSide);
      continue;
    }
    console.log('[arena] 반대 진영 포함:', name, theirSide);
    opponents.push({ nickname: name, side: theirSide, summary: p.summary, reasoning: p.reasoning });
  }
  console.log('[arena] 최종 opponents:', opponents.length, '명');

  if (!hasMyOpinion) {
    guard.style.display = 'block';
    stage.style.display = 'none';
    if (guardText) guardText.innerHTML = '먼저 본인의 입장을 작성해주세요.<br>작성 후 상대 입장과 반론을 이어갈 수 있습니다.';
    if (guardBtn) guardBtn.style.display = 'inline-block';
    return;
  }
  if (opponents.length === 0) {
    guard.style.display = 'block';
    stage.style.display = 'none';
    if (guardText) guardText.textContent = '상대 입장의 의견이 아직 없습니다. 조금 기다렸다가 다시 오세요.';
    if (guardBtn) guardBtn.style.display = 'none';
    return;
  }

  guard.style.display = 'none';
  stage.style.display = 'block';

  var myCard = $('arena-my-card');
  var myNick = $('arena-my-nickname');
  var mySum = $('arena-my-summary');
  if (myCard) myCard.classList.toggle('con-side', mySide === 'con');
  if (myNick) myNick.textContent = currentInfo.nickname;
  if (mySum) mySum.textContent = myPayload.summary;

  arenaState.opponents = opponents;
  renderArenaCards();
}

function hasRebuttedInArena(targetAuthor) {
  var myPayload = cachedPayloads[currentInfo.nickname];
  if (!myPayload || !myPayload.rebuttals) return false;
  return myPayload.rebuttals.some(function(r) {
    return r.targetType === 'opinion' && r.targetAuthor === targetAuthor;
  });
}

function renderArenaCards() {
  var container = $('arena-opponents');
  var progressEl = $('arena-progress');
  var emptyEl = $('arena-empty');
  if (!container) return;

  var total = arenaState.opponents.length;
  var rebuttedCount = 0;
  arenaState.opponents.forEach(function(opp) {
    if (hasRebuttedInArena(opp.nickname)) rebuttedCount++;
  });
  if (progressEl) progressEl.textContent = '반론 ' + rebuttedCount + ' / ' + total;

  container.innerHTML = '';
  arenaState.opponents.forEach(function(opp) {
    var rebutted = hasRebuttedInArena(opp.nickname);
    var card = document.createElement('div');
    card.className = 'arena-card' + (rebutted ? ' rebutted' : '');

    var meta = document.createElement('div');
    meta.className = 'arena-card-meta';
    var author = document.createElement('span');
    author.className = 'arena-card-author';
    author.textContent = opp.nickname;
    var badge = document.createElement('span');
    badge.className = 'side-badge';
    setSideBadge(badge, opp.side);
    meta.appendChild(author);
    meta.appendChild(badge);

    var summary = document.createElement('p');
    summary.className = 'arena-card-summary';
    summary.textContent = opp.summary;

    var rebLabel = document.createElement('span');
    rebLabel.className = 'rebutted-label';
    rebLabel.textContent = '반론 완료';

    card.appendChild(meta);
    card.appendChild(summary);
    card.appendChild(rebLabel);

    if (!rebutted) {
      (function(o) {
        card.onclick = function() { triggerObjection(o); };
      })(opp);
    }
    container.appendChild(card);
  });

  if (emptyEl) emptyEl.style.display = (rebuttedCount === total && total > 0) ? 'block' : 'none';
}

function triggerObjection(opp) {
  arenaState.currentTarget = opp;
  var overlay = $('objection-overlay');
  if (!overlay) { openArenaModal(opp); return; }

  overlay.classList.remove('hide');
  overlay.classList.add('show');
  setTimeout(function() { overlay.classList.add('hide'); }, 1400);
  setTimeout(function() {
    overlay.classList.remove('show', 'hide');
    openArenaModal(opp);
  }, 1700);
}

function openArenaModal(opp) {
  var modal = $('arena-modal');
  var authorEl = $('arena-modal-author');
  var sideEl = $('arena-modal-side');
  var sumEl = $('arena-modal-summary');
  var reaEl = $('arena-modal-reasoning');
  var inp = $('arena-modal-input');
  var sub = $('arena-modal-submit');

  if (authorEl) authorEl.textContent = opp.nickname;
  if (sideEl) setSideBadge(sideEl, opp.side);
  if (sumEl) sumEl.textContent = opp.summary;
  if (reaEl) reaEl.textContent = opp.reasoning || '';
  if (inp) {
    inp.value = '';
    inp.oninput = function() { if (sub) sub.disabled = inp.value.trim().length === 0; };
  }
  if (sub) {
    sub.disabled = true;
    sub.onclick = (function(o) { return function() { submitArenaRebuttal(o); }; })(opp);
  }
  if (modal) modal.classList.add('show');
}

function closeArenaModal() {
  var modal = $('arena-modal');
  if (modal) modal.classList.remove('show');
  arenaState.currentTarget = null;
}

function submitArenaRebuttal(opp) {
  var inp = $('arena-modal-input');
  var sub = $('arena-modal-submit');
  if (!inp) return;
  var text = inp.value.trim();
  if (!text) return;
  if (sub) sub.disabled = true;

  loadPayloadsWithSeed(currentInfo).then(function(payloads) {
    var mine = (payloads && payloads[currentInfo.nickname]) || {
      side: getMyNormalizedSide() || currentInfo.side, summary: '', reasoning: '', createdAt: Date.now(), rebuttals: []
    };
    if (!mine.rebuttals) mine.rebuttals = [];
    mine.rebuttals.push({
      id: 'reb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      targetType: 'opinion',
      targetAuthor: opp.nickname,
      targetId: opp.nickname,
      content: text,
      timestamp: Date.now()
    });
    return currentInfo.savePayload(mine);
  }).then(function() {
    return loadPayloadsWithSeed(currentInfo);
  }).then(function(payloads) {
    cachedPayloads = payloads || {};
    showToast('반론이 등록되었습니다.');
    closeArenaModal();
    renderArenaCards();
  }).catch(function(err) {
    console.error('[arena] 저장 실패:', err);
    showToast('저장 실패: ' + (err.message || err));
    if (sub) sub.disabled = false;
  });
}
