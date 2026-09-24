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
      return '<span class="' + cls + '">' + map[0] + ':' + map[1] + '</span>';
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
    if (location.hash.indexOf('#team=') === 0) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
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

  /* --------------------------------------------------------------- Init */

  function renderAll() {
    renderStandings();
    renderMatches();
    renderTeams();
    renderFixtures();
    renderStats();
  }

  function initTabs() {
    $$('#tabs .tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('#tabs .tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        $$('.view').forEach(function (v) {
          v.classList.toggle('is-active', v.id === 'view-' + btn.dataset.tab);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
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
