/* =========================================================================
   ARMY ROYAL LEAGUE - league page

   Renders the tabbed overview. Everything shared with the single team pages
   (data access, standings, the team detail markup, theme) lives in js/core.js.
   ========================================================================= */

(function () {
  'use strict';

  var C = ARL;
  var $ = C.$, $$ = C.$$, esc = C.esc, sign = C.sign;
  var TEAM_BY_ID = C.TEAM_BY_ID;

  /* ---------------------------------------------------------- Standings */

  function renderStandings() {
    var list = C.computeStandings();
    var html = list.map(function (r) {
      var zone = r.rank <= 4 ? 'z-top' : (r.rank <= 8 ? 'z-mid' : 'z-low');
      var form = r.form.slice(-5);
      var badges = '';
      for (var i = 0; i < 5; i++) {
        var v = form[i];
        badges += v
          ? '<i class="fb fb-' + v.toLowerCase() + '">' + v + '</i>'
          : '<i class="fb fb-n">-</i>';
      }

      return '<tr class="' + zone + '" data-team="' + r.team.id + '">' +
        '<td class="c-rank">' + r.rank + '</td>' +
        '<td class="c-team"><span class="team-cell">' + C.teamLabel(r.team) + '</span></td>' +
        '<td class="num-dim">' + r.played + '</td>' +
        '<td class="num-dim">' + r.wins + '</td>' +
        '<td class="num-dim">' + r.losses + '</td>' +
        '<td class="num-dim">' + r.mapsW + ':' + r.mapsL + '</td>' +
        '<td class="' + C.diffClass(r.mapDiff) + '">' + sign(r.mapDiff) + '</td>' +
        '<td class="num-dim">' + r.roundsW + ':' + r.roundsL + '</td>' +
        '<td class="' + C.diffClass(r.roundDiff) + '">' + sign(r.roundDiff) + '</td>' +
        '<td class="c-form"><span class="form-row-badges">' + badges + '</span></td>' +
        '<td class="c-pts">' + r.points + '</td>' +
        '</tr>';
    }).join('');

    $('#standingsBody').innerHTML = html;
    $$('#standingsBody tr').forEach(function (tr) {
      tr.addEventListener('click', function () { openTeam(tr.dataset.team); });
    });
  }

  /* -------------------------------------------------------- Results */

  function matchHTML(m) {
    var h = TEAM_BY_ID[m.home], a = TEAM_BY_ID[m.away];
    var r = C.evalMatch(m);

    var maps = m.maps.map(function (map) {
      var cls = map[0] > map[1] ? 'mw' : 'ml';
      var name = C.mapName(map);
      return '<span class="' + cls + '">' +
        (name ? '<i class="mn">' + esc(name) + '</i>' : '') +
        map[0] + ':' + map[1] + '</span>';
    }).join('');

    return '<article class="match">' +
      '<div class="side home ' + (r.homeWon ? 'win' : 'lose') + '" data-team="' + h.id + '">' +
        C.teamLabel(h) +
      '</div>' +
      '<div class="center">' +
        '<div class="score">' +
          '<span class="' + (r.homeWon ? 'w' : 'l') + '">' + r.mapsHome + '</span>' +
          '<span class="sep">:</span>' +
          '<span class="' + (r.awayWon ? 'w' : 'l') + '">' + r.mapsAway + '</span>' +
        '</div>' +
        '<div class="maps">' + maps + '</div>' +
      '</div>' +
      '<div class="side away ' + (r.awayWon ? 'win' : 'lose') + '" data-team="' + a.id + '">' +
        C.teamLabel(a) +
      '</div>' +
      '</article>';
  }

  function renderMatches() {
    var filter = $('#matchFilter').value;
    var desc = $('#matchOrder').dataset.order === 'desc';
    var list = C.getMatches().filter(function (m) {
      return filter === 'all' || m.home === filter || m.away === filter;
    });
    if (desc) list = list.slice().reverse();

    var box = $('#matchList');
    box.innerHTML = list.length
      ? list.map(matchHTML).join('')
      : '<p class="empty">No results for this selection.</p>';

    $$('#matchList .side').forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function () { openTeam(el.dataset.team); });
    });
  }

  /* ------------------------------------------------------------- Teams */

  function renderTeams() {
    var st = C.standingsById();
    $('#teamGrid').innerHTML = C.teamsAlphabetical().map(function (t) {
      var r = st[t.id];
      var roster = t.players.map(function (p) {
        return '<li class="' + (p.c ? 'cap' : '') + '">' +
          (p.c ? '<span class="cap-badge">C</span>' : '<span class="cap-badge" style="opacity:0;">C</span>') +
          esc(p.n) + '</li>';
      }).join('');

      return '<article class="team-card" data-team="' + t.id + '">' +
        '<div class="tc-head">' + C.ccChip(t) +
          '<h3>' + esc(t.name) + '</h3>' +
          '<span class="tc-rank">#' + r.rank + '</span>' +
        '</div>' +
        '<ul class="roster">' + roster + '</ul>' +
        '<div class="tc-foot">' +
          '<span><b>' + r.points + '</b> PTS</span>' +
          '<span><b>' + r.wins + '</b>W / <b>' + r.losses + '</b>L</span>' +
          '<span><b>' + r.mapsW + ':' + r.mapsL + '</b> Maps</span>' +
        '</div>' +
        '</article>';
    }).join('');

    $$('#teamGrid .team-card').forEach(function (el) {
      el.addEventListener('click', function () { openTeam(el.dataset.team); });
    });
  }

  /* --------------------------------------------------------- Schedule */

  function matrixHTML(order, idx) {
    var head = '<thead><tr><th class="rowhead corner">Team</th>' +
      order.map(function (t) { return '<th class="colhead">' + esc(t.name) + '</th>'; }).join('') +
      '</tr></thead>';

    var body = '<tbody>' + order.map(function (row) {
      var cells = order.map(function (col) {
        if (row.id === col.id) return '<td><div class="cellwrap cell-x">/</div></td>';

        var res = idx[row.id + '|' + col.id];
        if (!res) {
          return '<td><div class="cellwrap cell-o" title="' +
            esc(row.name + ' vs ' + col.name + ' - not played yet') + '">-</div></td>';
        }

        var venue = res.atHome ? row.name : col.name;
        var title = row.name + ' ' + res.maps + ' ' + col.name + ' | ' + venue + ' at home';
        return '<td><div class="cellwrap ' + (res.won ? 'cell-w' : 'cell-l') +
          '" title="' + esc(title) + '">' + res.maps + '</div></td>';
      }).join('');
      return '<tr><th class="rowhead">' + esc(row.name) + '</th>' + cells + '</tr>';
    }).join('') + '</tbody>';

    return head + body;
  }

  function renderFixtures() {
    var order = C.teamsAlphabetical();

    var played = C.getMatches().length;
    $('#fixtureHint').textContent =
      'Double round robin · ' + played + ' of ' + C.totalFixtures() + ' fixtures played';

    var legs = (LEAGUE.legs && LEAGUE.legs.length) ? LEAGUE.legs : [
      { name: 'First leg', maps: [] },
      { name: 'Return leg', maps: [] }
    ];

    var venue = [
      'Alphabetically first team at home',
      'Sides reversed - alphabetically second team at home'
    ];

    [1, 2].forEach(function (leg) {
      var cfg = legs[leg - 1] || { name: 'Leg ' + leg, maps: [] };
      var idx = C.legIndex(leg);
      var done = Object.keys(idx).length / 2;

      $('#legTitle' + leg).textContent =
        cfg.name + ' (' + done + ' of ' + (C.totalFixtures() / 2) + ')';
      $('#legVenue' + leg).textContent = venue[leg - 1];
      $('#legMaps' + leg).innerHTML = (cfg.maps || []).map(function (m) {
        return '<span>' + esc(m) + '</span>';
      }).join('');

      $('#matrixLeg' + leg).innerHTML = matrixHTML(order, idx);
    });
  }

  /* -------------------------------------------------------- Stats */

  function renderStats() {
    var matches = C.getMatches();
    var st = C.computeStandings();

    var totalMaps = 0, totalRounds = 0, deciders = 0, sweeps = 0;
    matches.forEach(function (m) {
      totalMaps += m.maps.length;
      if (m.maps.length === 3) deciders++; else sweeps++;
      m.maps.forEach(function (map) { totalRounds += map[0] + map[1]; });
    });

    var playedTeams = st.filter(function (r) { return r.played > 0; }).length;

    var cards = [
      [matches.length + ' / ' + C.totalFixtures(), 'Matches played'],
      [totalMaps, 'Maps'],
      [totalRounds, 'Rounds total'],
      [deciders, 'Decider maps'],
      [sweeps, '2:0 sweeps'],
      [playedTeams + ' / ' + TEAMS.length, 'Teams in action']
    ];

    $('#statCards').innerHTML = cards.map(function (c) {
      return '<div class="stat-card"><b>' + c[0] + '</b><span>' + c[1] + '</span></div>';
    }).join('');

    /* Round differential as centred bars, best to worst (not table order) */
    var byRoundDiff = st.slice().sort(function (a, b) {
      return b.roundDiff - a.roundDiff ||
             b.mapDiff - a.mapDiff ||
             a.team.name.localeCompare(b.team.name);
    });

    var maxAbs = Math.max.apply(null, st.map(function (r) { return Math.abs(r.roundDiff); }).concat([1]));
    $('#roundChart').innerHTML = byRoundDiff.map(function (r) {
      var pct = Math.abs(r.roundDiff) / maxAbs * 50;
      var style = r.roundDiff >= 0
        ? 'left:50%;width:' + pct + '%;'
        : 'right:50%;width:' + pct + '%;';
      return '<div class="bar-row">' +
        '<span class="bn">' + esc(r.team.name) + '</span>' +
        '<span class="bar-track"><span class="bar-mid"></span><span class="bar-fill" style="' + style + '"></span></span>' +
        '<span class="bar-val">' + r.roundsW + ':' + r.roundsL + ' (' + sign(r.roundDiff) + ')</span>' +
        '</div>';
    }).join('');

    /* Records */
    var best = null, longest = null, closest = null;
    matches.forEach(function (m) {
      m.maps.forEach(function (map) {
        var d = Math.abs(map[0] - map[1]);
        var tot = map[0] + map[1];
        var winner = map[0] > map[1] ? m.home : m.away;
        var loser = map[0] > map[1] ? m.away : m.home;
        var entry = { d: d, tot: tot, score: Math.max(map[0], map[1]) + ':' + Math.min(map[0], map[1]), w: winner, l: loser };
        if (!best || d > best.d) best = entry;
        if (!longest || tot > longest.tot) longest = entry;
        if (!closest || d < closest.d || (d === closest.d && tot > closest.tot)) closest = entry;
      });
    });

    var played = st.filter(function (r) { return r.played > 0; });
    var bestRate = played.slice().sort(function (a, b) {
      return (b.roundsW / (b.roundsW + b.roundsL)) - (a.roundsW / (a.roundsW + a.roundsL));
    })[0];
    var mostMaps = played.slice().sort(function (a, b) { return b.mapsW - a.mapsW; })[0];
    var mostRounds = played.slice().sort(function (a, b) { return b.roundsW - a.roundsW; })[0];

    function nm(id) { return esc(TEAM_BY_ID[id].name); }

    var recs = [];
    if (best) recs.push(['Biggest map win', nm(best.w) + ' <b>' + best.score + '</b> ' + nm(best.l)]);
    if (closest) recs.push(['Closest map', nm(closest.w) + ' <b>' + closest.score + '</b> ' + nm(closest.l)]);
    if (longest) recs.push(['Longest map', nm(longest.w) + ' <b>' + longest.score + '</b> ' + nm(longest.l) + ' (' + longest.tot + ' rounds)']);
    if (bestRate) recs.push(['Best round ratio', esc(bestRate.team.name) + ' <b>' + Math.round(bestRate.roundsW / (bestRate.roundsW + bestRate.roundsL) * 100) + '%</b>']);
    if (mostMaps) recs.push(['Most map wins', esc(mostMaps.team.name) + ' <b>' + mostMaps.mapsW + '</b>']);
    if (mostRounds) recs.push(['Most rounds won', esc(mostRounds.team.name) + ' <b>' + mostRounds.roundsW + '</b>']);

    $('#records').innerHTML = recs.length
      ? recs.map(function (r) {
          return '<div class="record"><span class="rl">' + r[0] + '</span><span class="rv">' + r[1] + '</span></div>';
        }).join('')
      : '<p class="empty">No data yet.</p>';
  }

  /* -------------------------------------------------------------- Modal */

  function absoluteTeamURL(team) {
    return new URL(C.teamPageURL(team), location.href).href;
  }

  function actionsHTML(team) {
    return '<div class="m-actions">' +
      '<a class="btn btn-ghost" href="' + esc(C.teamPageURL(team)) + '">Open team page</a>' +
      '<button type="button" class="btn btn-ghost" id="copyTeamLink">Copy link</button>' +
      '<span class="m-actions-msg" id="copyMsg"></span>' +
      '</div>';
  }


  function showModal(id) {
    var team = TEAM_BY_ID[id];
    if (!team) return;

    $('#modalContent').innerHTML = C.teamDetailHTML(id);
    C.enableSorting($('#modalContent'));

    /* placed right below the stat tiles rather than appended: at the very end
       they would sit behind every collapsible map and be easy to miss */
    var anchor = $('#modalContent .m-stats');
    if (anchor) anchor.insertAdjacentHTML('afterend', actionsHTML(team));
    else $('#modalContent').insertAdjacentHTML('beforeend', actionsHTML(team));

    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal-box').scrollTop = 0;

    $('#copyTeamLink').addEventListener('click', function () {
      var url = absoluteTeamURL(team);
      C.copyText(url).then(function () {
        C.setText('#copyMsg', 'Link copied');
      }, function () {
        C.setText('#copyMsg', url);
      });
    });
  }

  function hideModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
  }

  /* Tracks whether the current history entry is one we pushed ourselves. A page
     opened directly on index.html#team=... has no entry of ours, so closing
     must not call back() - that would leave the site altogether. */
  var pushedEntry = false;

  /* A hash entry is pushed so the browser's back button closes the popup and a
     copied index.html#team=... link reopens it. */
  function openTeam(id) {
    var team = TEAM_BY_ID[id];
    if (!team) return;
    showModal(id);
    try {
      history.pushState({ arlTeam: id }, '', '#team=' + C.teamSlug(team));
      pushedEntry = true;
    } catch (e) { /* history unavailable - popup still works */ }
  }

  /* Hides first and only then touches history: if back() were to produce no
     popstate (a restricted context, or our entry being the first of the
     session) the popup would otherwise stay stuck on screen. */
  function closeModal() {
    hideModal();

    if (pushedEntry) {
      pushedEntry = false;
      try { history.back(); return; } catch (e) { /* fall through */ }
    }
    /* back to the tab the popup was opened from, not to a bare index.html */
    if (location.hash.indexOf('#team=') === 0) {
      try { history.replaceState(null, '', tabURL()); } catch (e) {}
    }
  }

  function openFromHash() {
    var m = /^#team=(.+)$/.exec(location.hash);
    if (!m) return;
    var team = C.teamBySlug(decodeURIComponent(m[1]));
    if (!team) return;
    showModal(team.id);
    pushedEntry = false;
    try { history.replaceState({ arlTeam: team.id }, '', location.hash); } catch (e) {}
  }

  /* ------------------------------------------------------ Filter select */

  function fillSelects() {
    var opts = C.teamsAlphabetical()
      .map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('');

    $('#matchFilter').innerHTML = '<option value="all">All teams</option>' + opts;
  }

  /* --------------------------------------------------------------- Maps */

  /* five steps, symmetric around 50 %: <20 | 20-49 | 50 | 51-80 | >80 */
  function heatClass(p) {
    if (p === null || p === undefined) return 'heat-na';
    if (p < 20) return 'heat-0';
    if (p < 50) return 'heat-1';
    if (p === 50) return 'heat-2';
    if (p <= 80) return 'heat-3';
    return 'heat-4';
  }

  function legOf(name) {
    var legs = (LEAGUE.legs || []);
    for (var i = 0; i < legs.length; i++) {
      if ((legs[i].maps || []).indexOf(name) > -1) return legs[i].name;
    }
    return '';
  }

  function teamMapLink(team) {
    return esc(C.teamPageURL(team)) + '#mapstats';
  }

  function renderMaps() {
    var maps = C.mapOrder();
    var teams = C.teamsAlphabetical();
    var min = C.MIN_MAPS_RANKED;

    $('#mapsHint').textContent =
      maps.length + ' maps · ' + maps.reduce(function (n, m) { return n + C.mapTimesPlayed(m); }, 0) + ' played in total';

    $('#mapCards').innerHTML = maps.map(function (name) {
      var top = C.mapLeader(name);
      var topHTML = top
        ? '<a href="' + teamMapLink(top.team) + '">' + esc(top.team.name) + '</a>' +
          '<span class="mc-rec">' + top.w + '&ndash;' + top.l + ' &middot; ' + C.pct(top.winPct) + '</span>'
        : '<span class="mc-none">no team with ' + min + '+ maps yet</span>';
      return '<div class="map-card">' +
        '<div class="mc-head"><h4>' + esc(name) + '</h4><span class="mc-leg">' + esc(legOf(name)) + '</span></div>' +
        '<p class="mc-played"><b>' + C.mapTimesPlayed(name) + '</b> times played</p>' +
        '<p class="mc-top"><span class="mc-label">Top team</span>' + topHTML + '</p>' +
        '</div>';
    }).join('') || '<p class="empty">No map names entered yet.</p>';

    var head = '<thead><tr><th class="rowhead corner">Team</th>' +
      maps.map(function (n) { return '<th>' + esc(n) + '</th>'; }).join('') + '</tr></thead>';

    var body = '<tbody>' + teams.map(function (t) {
      var cells = maps.map(function (n) {
        var r = C.teamMapRecord(t.id, n);
        if (!r) return '<td><div class="mcell heat-na" title="' + esc(t.name + ' has not played ' + n) + '">&ndash;</div></td>';
        var title = t.name + ' on ' + n + ': ' + r.w + ' W, ' + (r.d ? r.d + ' D, ' : '') + r.l + ' L' +
                    ' of ' + r.played + ' played | rounds ' + r.rw + ':' + r.rl;
        return '<td><div class="mcell ' + heatClass(r.winPct) + '" title="' + esc(title) + '">' +
          '<b>' + C.pct(r.winPct) + '</b><small>' + r.played + ' played</small></div></td>';
      }).join('');
      return '<tr><th class="rowhead"><a href="' + teamMapLink(t) + '">' + esc(t.name) + '</a></th>' + cells + '</tr>';
    }).join('') + '</tbody>';

    $('#mapMatrix').innerHTML = head + body;
  }

  /* --------------------------------------------------------------- Init */

  function renderAll() {
    renderStandings();
    renderMatches();
    renderTeams();
    renderFixtures();
    renderStats();
    renderMaps();
  }

  /* Tabs are addressable: index.html#maps opens the Maps tab. The popup owns
     #team=..., every other fragment is read as a tab name. The URL names follow
     the visible labels, which differ from two internal view ids. */
  var TAB_HASH = { standings: 'standings', matches: 'results', teams: 'teams',
                   fixtures: 'schedule', stats: 'stats', maps: 'maps' };
  var currentTab = 'standings';

  function tabFromHash(hash) {
    var h = String(hash || '').replace(/^#/, '').toLowerCase();
    for (var k in TAB_HASH) {
      if (TAB_HASH.hasOwnProperty(k) && TAB_HASH[k] === h) return k;
    }
    return null;
  }

  /* the address of the current tab - also where a closed popup returns to */
  function tabURL() {
    return location.pathname + location.search +
      (currentTab === 'standings' ? '' : '#' + TAB_HASH[currentTab]);
  }

  function activateTab(tab) {
    var btn = $('#tabs .tab[data-tab="' + tab + '"]');
    if (!btn) return;
    currentTab = tab;
    $$('#tabs .tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
    $$('.view').forEach(function (v) {
      v.classList.toggle('is-active', v.id === 'view-' + tab);
    });
  }

  function initTabs() {
    $$('#tabs .tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activateTab(btn.dataset.tab);
        /* replace rather than push: flicking through tabs should not fill the
           back button, but the address bar always shows a shareable link */
        try { history.replaceState(null, '', tabURL()); } catch (e) {}
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    var fromHash = tabFromHash(location.hash);
    if (fromHash) activateTab(fromHash);

    /* someone typing #maps into the address bar of an open page */
    window.addEventListener('hashchange', function () {
      var t = tabFromHash(location.hash);
      if (t) activateTab(t);
    });
  }

  function init() {
    C.initTheme();
    C.renderHeader();          /* header needs no scoreboards - show it at once */
    fillSelects();
    initTabs();

    document.body.classList.add('is-loading');

    /* Scoreboards arrive over the network, so everything that can show their
       extra columns is rendered only once the fetches have settled. */
    C.loadScoreboards().then(function () {
      document.body.classList.remove('is-loading');
      renderAll();
      openFromHash();
    });

    $('#matchFilter').addEventListener('change', renderMatches);
    $('#matchOrder').addEventListener('click', function () {
      var el = $('#matchOrder');
      var desc = el.dataset.order === 'desc';
      el.dataset.order = desc ? 'asc' : 'desc';
      el.textContent = desc ? 'Oldest first' : 'Newest first';
      renderMatches();
    });

    $$('#modal [data-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
    });

    window.addEventListener('popstate', function (e) {
      var id = e.state && e.state.arlTeam;
      if (id && TEAM_BY_ID[id]) {
        showModal(id);
        pushedEntry = true;
      } else {
        hideModal();
        pushedEntry = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
