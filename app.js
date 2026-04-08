console.log('[app] === LOADED v_copy1 ===');

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
        if (p && !p.rebuttals) p.rebuttals = [];
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

  // 찬반 필터 버튼
  var sideFilter = $('side-filter');
  if (sideFilter) {
    sideFilter.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.onclick = function() {
        currentSideFilter = btn.getAttribute('data-filter') || 'all';
        sideFilter.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderHomeList();
      };
    });
  }

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
  var persuadeSkip = $('persuade-skip');
  if (persuadeInp && persuadeSubmit) {
    persuadeInp.oninput = function() {
      persuadeSubmit.disabled = persuadeInp.value.trim().length === 0;
    };
  }
  if (persuadeSubmit) persuadeSubmit.onclick = handleSubmitPersuade;
  if (persuadeSkip) persuadeSkip.onclick = function() {
    showToast('설득 미션을 건너뛰었습니다.');
    loadAndShowHome();
  };

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

  // 도움말 모달
  var infoBtn = $('info-btn');
  var helpModal = $('help-modal');
  var helpClose = $('help-close');
  var helpBackdrop = $('help-backdrop');
  var helpGotIt = $('help-got-it');
  function openHelp() { if (helpModal) helpModal.classList.add('show'); }
  function closeHelp() { if (helpModal) helpModal.classList.remove('show'); }
  if (infoBtn) infoBtn.onclick = openHelp;
  if (helpClose) helpClose.onclick = closeHelp;
  if (helpBackdrop) helpBackdrop.onclick = closeHelp;
  if (helpGotIt) helpGotIt.onclick = closeHelp;
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
  el.style.display = '';
  el.innerHTML =
    '<div class="hot-banner-label">🔥 가장 뜨거운 의견</div>' +
    '<p class="hot-banner-summary">' + escapeHtml(p.summary) + '</p>' +
    '<div class="hot-banner-meta">' + escapeHtml(hotAuthor) + ' · 반론 ' + hotCount + '건</div>';
  el.onclick = function() {
    var entry = document.querySelector('.opinion-entry[data-author="' + hotAuthor + '"]');
    if (entry) toggleEntryExpansion(entry, hotAuthor);
  };
}

function getRebuttalCount(author) {
  return collectRebuttalsFor(author, author, 'opinion').length;
}

var currentExpandedEntry = null;

function renderHomeList() {
  var listEl = $('opinion-list');
  if (!listEl) return;

  var items = [];
  for (var name in cachedPayloads) {
    var p = cachedPayloads[name];
    if (!p || !p.summary) continue;
    if (currentSideFilter !== 'all' && p.side !== currentSideFilter) continue;
    items.push({
      author: name,
      side: p.side,
      summary: p.summary,
      reasoning: p.reasoning,
      createdAt: p.createdAt || 0
    });
  }
  console.log('[app] render items count:', items.length, 'filter:', currentSideFilter);

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
    if (sort === 'oldest') return a.createdAt - b.createdAt;
    if (sort === 'hot') return countAllResponsesInTree(b.author) - countAllResponsesInTree(a.author);
    return b.createdAt - a.createdAt;
  });

  currentExpandedEntry = null;
  listEl.innerHTML = '';

  if (items.length === 0) {
    listEl.innerHTML = '<div class="empty-state">아직 의견이 없습니다.</div>';
    return;
  }

  items.forEach(function(it) {
    var entry = document.createElement('div');
    entry.className = 'opinion-entry ' + (it.side === 'pro' ? 'pro-entry' : 'con-entry');
    entry.setAttribute('data-author', it.author);

    // === Row ===
    var row = document.createElement('div');
    row.className = 'opinion-row';
    if (it.author === currentInfo.nickname) {
      row.classList.add('is-mine');
      var receivedCount = countAllResponsesInTree(it.author);
      if (receivedCount > 0) {
        var flame = createFlameBadge(receivedCount, it.side);
        if (flame) row.appendChild(flame);
      }
    }

    var authorEl = document.createElement('div');
    authorEl.className = 'opinion-author';
    authorEl.textContent = it.author;
    if (it.author === currentInfo.nickname) {
      var meBadgeHome = document.createElement('span');
      meBadgeHome.className = 'me-badge';
      meBadgeHome.textContent = '내 의견';
      authorEl.appendChild(meBadgeHome);
    }

    var summaryEl = document.createElement('div');
    summaryEl.className = 'opinion-summary';
    summaryEl.textContent = it.summary;

    var metaEl = document.createElement('div');
    metaEl.className = 'opinion-meta';
    metaEl.textContent = formatDate(it.createdAt);

    var rebEl = document.createElement('span');
    rebEl.className = 'opinion-rebcount';
    rebEl.textContent = '응답 ' + countAllResponsesInTree(it.author);

    var badge = document.createElement('span');
    badge.className = 'side-badge';
    setSideBadge(badge, it.side);

    row.appendChild(authorEl);
    row.appendChild(summaryEl);
    row.appendChild(metaEl);
    row.appendChild(rebEl);
    row.appendChild(badge);

    // === Expanded ===
    var expanded = document.createElement('div');
    expanded.className = 'opinion-expanded';
    expanded.onclick = function(e) { e.stopPropagation(); };

    var inner = document.createElement('div');
    inner.className = 'opinion-expanded-inner';
    expanded.appendChild(inner);

    entry.appendChild(row);
    entry.appendChild(expanded);

    row.onclick = (function(e_, it_) {
      return function(e) {
        e.stopPropagation();
        toggleEntryExpansion(e_.parentElement, it_.author);
      };
    })(row, it);

    listEl.appendChild(entry);
  });
}

function toggleEntryExpansion(entry, author) {
  var isOpen = entry.classList.contains('expanded');
  if (currentExpandedEntry && currentExpandedEntry !== entry) {
    currentExpandedEntry.classList.remove('expanded');
  }
  if (isOpen) {
    entry.classList.remove('expanded');
    currentExpandedEntry = null;
  } else {
    renderExpandedContent(entry, author);
    entry.classList.add('expanded');
    currentExpandedEntry = entry;
    setTimeout(function() {
      entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}

function renderExpandedContent(entry, author) {
  var inner = entry.querySelector('.opinion-expanded-inner');
  if (!inner) return;
  var p = cachedPayloads[author];
  if (!p) { inner.innerHTML = ''; return; }
  inner.innerHTML = '';

  // 1. 논거 본문
  var reasoningBlock = document.createElement('div');
  reasoningBlock.className = 'expanded-reasoning';
  reasoningBlock.textContent = p.reasoning || '';
  inner.appendChild(reasoningBlock);

  // 2. 응답 제목
  var totalResp = countAllResponsesInTree(author);
  var respTitle = document.createElement('h3');
  respTitle.className = 'expanded-resp-title';
  respTitle.textContent = '응답 ' + totalResp;
  inner.appendChild(respTitle);

  // 3. 스레드
  var threadContainer = document.createElement('div');
  threadContainer.className = 'expanded-thread';
  var tree = buildThreadForOpinion(author);
  if (tree.length === 0) {
    threadContainer.innerHTML = '<div class="empty-state" style="padding:16px 0;font-size:13px;">아직 응답이 없습니다.</div>';
  } else {
    tree.forEach(function(node) {
      threadContainer.appendChild(buildThreadNode(node, p.side));
    });
  }
  inner.appendChild(threadContainer);

  // 4. 입력창 (본인 아닐 때)
  if (author !== currentInfo.nickname) {
    var inputBlock = document.createElement('div');
    inputBlock.className = 'expanded-input';
    inputBlock.innerHTML =
      '<div class="expanded-input-divider">의견 남기기</div>' +
      '<textarea class="expanded-textarea" placeholder="당신의 생각을 자유롭게 남겨보세요..."></textarea>' +
      '<div class="form-actions"><button class="primary-btn expanded-submit" disabled>등록</button></div>';
    inner.appendChild(inputBlock);
    var ta = inputBlock.querySelector('.expanded-textarea');
    var sub = inputBlock.querySelector('.expanded-submit');
    ta.oninput = function() { sub.disabled = ta.value.trim().length === 0; };
    sub.onclick = function(e) {
      e.stopPropagation();
      var text = ta.value.trim();
      if (!text) return;
      sub.disabled = true;
      submitRebuttalInline(author, text, entry);
    };
    inputBlock.onclick = function(e) { e.stopPropagation(); };
  } else {
    var mineNotice = document.createElement('div');
    mineNotice.className = 'expanded-mine-notice';
    mineNotice.textContent = totalResp > 0
      ? '이 의견에 ' + totalResp + '개의 응답이 달렸습니다.'
      : '본인의 의견에는 직접 응답할 수 없습니다.';
    inner.appendChild(mineNotice);
  }
}

function countAllResponsesInTree(targetAuthor) {
  var tree = buildThreadForOpinion(targetAuthor);
  var total = 0;
  function walk(nodes) { nodes.forEach(function(n) { total++; walk(n.children); }); }
  walk(tree);
  return total;
}

function submitRebuttalInline(targetAuthor, text, entry) {
  loadPayloadsWithSeed(currentInfo).then(function(payloads) {
    var mine = (payloads && payloads[currentInfo.nickname]) || {
      side: currentInfo.side, summary: '', reasoning: '', createdAt: Date.now(), rebuttals: []
    };
    if (!mine.rebuttals) mine.rebuttals = [];
    mine.rebuttals.push({
      id: 'reb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      targetType: 'opinion',
      targetAuthor: targetAuthor,
      targetId: targetAuthor,
      content: text,
      timestamp: Date.now()
    });
    return currentInfo.savePayload(mine);
  }).then(function() {
    return loadPayloadsWithSeed(currentInfo);
  }).then(function(payloads) {
    cachedPayloads = payloads || {};
    showToast('의견이 등록되었습니다.');
    renderExpandedContent(entry, targetAuthor);
    updateRowResponseCount(entry, targetAuthor);
  }).catch(function(err) {
    console.error('[app] 저장 실패:', err);
    showToast('저장 실패: ' + (err.message || err));
  });
}

function updateRowResponseCount(entry, author) {
  var rebEl = entry.querySelector('.opinion-row .opinion-rebcount');
  if (rebEl) rebEl.textContent = '응답 ' + countAllResponsesInTree(author);
  if (author === currentInfo.nickname) {
    var row = entry.querySelector('.opinion-row');
    var existingFlame = row.querySelector('.flame-badge');
    if (existingFlame) existingFlame.remove();
    var newCount = countAllResponsesInTree(author);
    if (newCount > 0) {
      var p = cachedPayloads[author];
      var flame = createFlameBadge(newCount, p ? p.side : currentInfo.side);
      if (flame) row.appendChild(flame);
    }
  }
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
    side: currentInfo.side,
    summary: summary,
    reasoning: reasoning,
    createdAt: Date.now(),
    rebuttals: []
  }).then(function() {
    return loadPayloadsWithSeed(currentInfo);
  }).then(function(payloads) {
    cachedPayloads = payloads || {};

    var oppSide = currentInfo.side === 'pro' ? 'con' : 'pro';
    var candidates = [];
    for (var name in cachedPayloads) {
      if (name === currentInfo.nickname) continue;
      var p = cachedPayloads[name];
      if (!p || !p.summary) continue;
      if (p.side !== oppSide) continue;
      candidates.push({ nickname: name, side: p.side, summary: p.summary, reasoning: p.reasoning });
    }

    if (candidates.length === 0) {
      showToast('반대편 의견이 아직 없습니다. 홈에서 다른 의견에 자유롭게 반론해보세요.');
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
  var skip = document.getElementById('persuade-skip');

  if (authEl) authEl.textContent = opp.nickname;
  if (sideEl) setSideBadge(sideEl, opp.side);
  if (sumEl) sumEl.textContent = opp.summary || '';
  if (reaEl) reaEl.textContent = opp.reasoning || '';
  if (inp) { inp.value = ''; inp.oninput = function() { if (subBtn) subBtn.disabled = inp.value.trim().length === 0; }; }
  if (subBtn) { subBtn.disabled = true; subBtn.onclick = handleSubmitPersuade; }
  if (skip) skip.onclick = function() {
    showToast('건너뛰셨습니다. 홈에서 다른 의견에 반론할 수 있습니다.');
    loadAndShowHome();
  };

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
      side: currentInfo.side,
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
    if (depth > 3) return [];
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

function buildThreadNode(entry, rootTargetSide) {
  var r = entry.node;
  var wrapper = document.createElement('div');
  wrapper.className = 'thread-node depth-' + entry.depth;
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

  // 본문
  var body = document.createElement('p');
  body.className = 'thread-body';
  body.textContent = r.content;
  wrapper.appendChild(body);

  // 액션 버튼
  var actions = document.createElement('div');
  actions.className = 'thread-actions';
  if (r.author !== currentInfo.nickname && entry.depth < 3) {
    var replyBtn = document.createElement('button');
    replyBtn.className = 'reply-toggle-btn';
    replyBtn.textContent = '답글 달기';
    (function(w, rr) { replyBtn.onclick = function() { toggleInlineReply(w, rr); }; })(wrapper, r);
    actions.appendChild(replyBtn);
  } else if (entry.depth >= 3) {
    var noMore = document.createElement('span');
    noMore.className = 'no-more-reply';
    noMore.textContent = '더 이상 답글을 달 수 없습니다';
    actions.appendChild(noMore);
  }
  wrapper.appendChild(actions);

  // 자식 노드
  if (entry.children.length > 0) {
    var childrenWrap = document.createElement('div');
    childrenWrap.className = 'thread-children';
    entry.children.forEach(function(child) {
      childrenWrap.appendChild(buildThreadNode(child, rootTargetSide));
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
    '<textarea class="inline-reply-textarea" placeholder="답글을 남겨보세요..."></textarea>' +
    '<div class="inline-reply-actions">' +
      '<button class="secondary-btn cancel-btn">취소</button>' +
      '<button class="primary-btn submit-btn" disabled>등록</button>' +
    '</div>';
  parentEl.appendChild(form);
  var ta = form.querySelector('.inline-reply-textarea');
  var sub = form.querySelector('.submit-btn');
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
      side: currentInfo.side,
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
    showToast('의견이 등록되었습니다.');
    if (currentExpandedEntry) {
      var author = currentExpandedEntry.getAttribute('data-author');
      renderExpandedContent(currentExpandedEntry, author);
      updateRowResponseCount(currentExpandedEntry, author);
    }
  }).catch(function(err) {
    console.error('[app] 반박 저장 실패:', err);
    showToast('저장 실패: ' + (err.message || err));
  });
}

// === 토론 아레나 ===
function renderArenaView() {
  var guard = $('arena-guard');
  var guardText = $('arena-guard-text');
  var guardBtn = $('arena-guard-btn');
  var stage = $('arena-stage');
  if (!guard || !stage) return;

  var myPayload = cachedPayloads[currentInfo.nickname];
  var hasMyOpinion = !!(myPayload && myPayload.summary);

  var opponents = [];
  for (var name in cachedPayloads) {
    if (name === currentInfo.nickname) continue;
    var p = cachedPayloads[name];
    if (!p || !p.summary) continue;
    if (p.side === currentInfo.side) continue;
    opponents.push({ nickname: name, side: p.side, summary: p.summary, reasoning: p.reasoning });
  }

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
  if (myCard) myCard.classList.toggle('con-side', currentInfo.side === 'con');
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
      side: currentInfo.side, summary: '', reasoning: '', createdAt: Date.now(), rebuttals: []
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
