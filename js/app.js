/* =========================================================================
   ARMY ROYAL LEAGUE - application logic
   Standings, results, schedule and stats are derived entirely from
   js/data.js - that is where teams and results are maintained.
   ========================================================================= */

(function () {
  'use strict';

  var TEAM_BY_ID = {};
  TEAMS.forEach(function (t) { TEAM_BY_ID[t.id] = t; });

  /* ---------------------------------------------------------------- Utils */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function diffClass(n) { return n > 0 ? 'pos' : (n < 0 ? 'neg' : 'zero'); }
  function sign(n) { return (n > 0 ? '+' : '') + n; }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* 'YYYY-MM-DD' -> '14 Sep 2026'. Formatted by hand so the output does not
     depend on the visitor's locale; anything unexpected is passed through. */
  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
    if (!m) return String(iso);
    var month = MONTHS[parseInt(m[2], 10) - 1];
    if (!month) return String(iso);
    return parseInt(m[3], 10) + ' ' + month + ' ' + m[1];
  }

  function ccChip(team) {
    return '<span class="cc cc-' + team.cc + '" title="' + esc(COUNTRIES[team.cc] || team.cc) + '">' + team.cc + '</span>';
  }

  function teamLabel(team) {
    return ccChip(team) + '<span class="tname">' + esc(team.name) + '</span>';
  }

  /* ------------------------------------------------------- Data access */

  function validMatch(m) {
    return m && TEAM_BY_ID[m.home] && TEAM_BY_ID[m.away] &&
           Array.isArray(m.maps) && m.maps.length >= 2 &&
           m.maps.every(function (x) { return Array.isArray(x) && x.length === 2; });
  }

  function getMatches() {
    return MATCHES.filter(validMatch);
  }

  /* ----------------------------------------------- Match evaluation */

  function evalMatch(m) {
    var mh = 0, ma = 0, rh = 0, ra = 0;
    m.maps.forEach(function (map) {
      rh += map[0];
      ra += map[1];
      if (map[0] > map[1]) mh++;
      else if (map[1] > map[0]) ma++;
    });
    return {
      mapsHome: mh,
      mapsAway: ma,
      roundsHome: rh,
      roundsAway: ra,
      homeWon: mh > ma,
      awayWon: ma > mh,
      decider: m.maps.length === 3
    };
  }

  /* ---------------------------------------------------------- Standings */

  function computeStandings() {
    var rows = {};
    TEAMS.forEach(function (t) {
      rows[t.id] = {
        team: t, played: 0, wins: 0, losses: 0,
        mapsW: 0, mapsL: 0, roundsW: 0, roundsL: 0,
        points: 0, form: [], opponents: {}
      };
    });

    getMatches().forEach(function (m) {
      var h = rows[m.home], a = rows[m.away];
      if (!h || !a) return;
      var r = evalMatch(m);

      h.played++; a.played++;
      h.mapsW += r.mapsHome; h.mapsL += r.mapsAway;
      a.mapsW += r.mapsAway; a.mapsL += r.mapsHome;
      h.roundsW += r.roundsHome; h.roundsL += r.roundsAway;
      a.roundsW += r.roundsAway; a.roundsL += r.roundsHome;

      if (r.homeWon) {
        h.wins++; a.losses++;
        h.points += LEAGUE.pointsWin; a.points += LEAGUE.pointsLoss;
        h.form.push('W'); a.form.push('L');
      } else {
        a.wins++; h.losses++;
        a.points += LEAGUE.pointsWin; h.points += LEAGUE.pointsLoss;
        a.form.push('W'); h.form.push('L');
      }

      h.opponents[m.away] = true;
      a.opponents[m.home] = true;
    });

    var list = TEAMS.map(function (t) {
      var r = rows[t.id];
      r.mapDiff = r.mapsW - r.mapsL;
      r.roundDiff = r.roundsW - r.roundsL;
      return r;
    });

    list.sort(function (a, b) {
      return b.points - a.points ||
             b.mapDiff - a.mapDiff ||
             b.roundDiff - a.roundDiff ||
             b.mapsW - a.mapsW ||
             a.team.name.localeCompare(b.team.name);
    });

    list.forEach(function (r, i) { r.rank = i + 1; });
    return list;
  }

  function standingsById() {
    var map = {};
    computeStandings().forEach(function (r) { map[r.team.id] = r; });
    return map;
  }

  function renderStandings() {
    var list = computeStandings();
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
        '<td class="c-team"><span class="team-cell">' + teamLabel(r.team) + '</span></td>' +
        '<td class="num-dim">' + r.played + '</td>' +
        '<td class="num-dim">' + r.wins + '</td>' +
        '<td class="num-dim">' + r.losses + '</td>' +
        '<td class="num-dim">' + r.mapsW + ':' + r.mapsL + '</td>' +
        '<td class="' + diffClass(r.mapDiff) + '">' + sign(r.mapDiff) + '</td>' +
        '<td class="num-dim">' + r.roundsW + ':' + r.roundsL + '</td>' +
        '<td class="' + diffClass(r.roundDiff) + '">' + sign(r.roundDiff) + '</td>' +
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
    var r = evalMatch(m);

    var maps = m.maps.map(function (map) {
      var cls = map[0] > map[1] ? 'mw' : 'ml';
      return '<span class="' + cls + '">' + map[0] + ':' + map[1] + '</span>';
    }).join('');

    return '<article class="match">' +
      '<div class="side home ' + (r.homeWon ? 'win' : 'lose') + '" data-team="' + h.id + '">' +
        teamLabel(h) +
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
        teamLabel(a) +
      '</div>' +
      '</article>';
  }

  function renderMatches() {
    var filter = $('#matchFilter').value;
    var desc = $('#matchOrder').dataset.order === 'desc';
    var list = getMatches().filter(function (m) {
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
    var st = standingsById();
    $('#teamGrid').innerHTML = TEAMS.map(function (t) {
      var r = st[t.id];
      var roster = t.players.map(function (p) {
        return '<li class="' + (p.c ? 'cap' : '') + '">' +
          (p.c ? '<span class="cap-badge">C</span>' : '<span class="cap-badge" style="opacity:0;">C</span>') +
          esc(p.n) + '</li>';
      }).join('');

      return '<article class="team-card" data-team="' + t.id + '">' +
        '<div class="tc-head">' + ccChip(t) +
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

  function matchupIndex() {
    var idx = {};
    getMatches().forEach(function (m) {
      var r = evalMatch(m);
      idx[m.home + '|' + m.away] = { maps: r.mapsHome + ':' + r.mapsAway, won: r.homeWon };
      idx[m.away + '|' + m.home] = { maps: r.mapsAway + ':' + r.mapsHome, won: r.awayWon };
    });
    return idx;
  }

  function renderFixtures() {
    var order = computeStandings().map(function (r) { return r.team; });
    var idx = matchupIndex();

    var head = '<thead><tr><th class="rowhead">Team</th>' +
      order.map(function (t) { return '<th class="colhead">' + esc(t.name) + '</th>'; }).join('') +
      '</tr></thead>';

    var body = '<tbody>' + order.map(function (row) {
      var cells = order.map(function (col) {
        if (row.id === col.id) return '<td><div class="cellwrap cell-x">/</div></td>';
        var res = idx[row.id + '|' + col.id];
        if (!res) return '<td><div class="cellwrap cell-o">-</div></td>';
        return '<td><div class="cellwrap ' + (res.won ? 'cell-w' : 'cell-l') + '">' + res.maps + '</div></td>';
      }).join('');
      return '<tr><th class="rowhead">' + esc(row.name) + '</th>' + cells + '</tr>';
    }).join('') + '</tbody>';

    $('#matrix').innerHTML = head + body;

    var open = [];
    for (var i = 0; i < TEAMS.length; i++) {
      for (var j = i + 1; j < TEAMS.length; j++) {
        if (!idx[TEAMS[i].id + '|' + TEAMS[j].id]) {
          open.push([TEAMS[i], TEAMS[j]]);
        }
      }
    }

    $('#openList').innerHTML = open.length
      ? open.map(function (p) {
          return '<div class="open-item">' + esc(p[0].name) + ' <em>vs</em> ' + esc(p[1].name) + '</div>';
        }).join('')
      : '<p class="empty">All fixtures have been played.</p>';
  }

  /* -------------------------------------------------------- Stats */

  function renderStats() {
    var matches = getMatches();
    var st = computeStandings();

    var totalMaps = 0, totalRounds = 0, deciders = 0, sweeps = 0;
    matches.forEach(function (m) {
      totalMaps += m.maps.length;
      if (m.maps.length === 3) deciders++; else sweeps++;
      m.maps.forEach(function (map) { totalRounds += map[0] + map[1]; });
    });

    var playedTeams = st.filter(function (r) { return r.played > 0; }).length;
    var totalPairs = TEAMS.length * (TEAMS.length - 1) / 2;

    var cards = [
      [matches.length + ' / ' + totalPairs, 'Matches played'],
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

  /* ------------------------------------------------------------- Header */

  function renderHeader() {
    var matches = getMatches();
    var maps = matches.reduce(function (n, m) { return n + m.maps.length; }, 0);
    $('#headerStats').innerHTML =
      '<div class="hstat"><b>' + TEAMS.length + '</b><span>Teams</span></div>' +
      '<div class="hstat"><b>' + TEAMS.length * 7 + '</b><span>Players</span></div>' +
      '<div class="hstat"><b>' + matches.length + '</b><span>Matches</span></div>' +
      '<div class="hstat"><b>' + maps + '</b><span>Maps</span></div>';
    $('#headerUpdated').textContent = LEAGUE.updated
      ? 'Last updated ' + formatDate(LEAGUE.updated)
      : '';

    $('#brandSeason').textContent = LEAGUE.season;
    $('#footNote').textContent = matches.length + ' of 66 fixtures played';
  }

  /* -------------------------------------------------------------- Modal */

  function openTeam(id) {
    var t = TEAM_BY_ID[id];
    if (!t) return;
    var r = standingsById()[id];

    var roster = t.players.map(function (p) {
      return '<li class="' + (p.c ? 'cap' : '') + '">' +
        (p.c ? '<span class="cap-badge">C</span>' : '<span class="cap-badge" style="opacity:0;">C</span>') +
        esc(p.n) + '</li>';
    }).join('');

    var own = getMatches().filter(function (m) { return m.home === id || m.away === id; });
    var matchRows = own.map(function (m) {
      var isHome = m.home === id;
      var opp = TEAM_BY_ID[isHome ? m.away : m.home];
      var e = evalMatch(m);
      var won = isHome ? e.homeWon : e.awayWon;
      var mine = isHome ? e.mapsHome : e.mapsAway;
      var theirs = isHome ? e.mapsAway : e.mapsHome;
      return '<div class="m-match"><span>' + esc(opp.name) + '</span>' +
        '<span class="res ' + (won ? 'w' : 'l') + '">' + mine + ':' + theirs + '</span></div>';
    }).join('') || '<p class="m-open">No matches played yet.</p>';

    var playedIds = {};
    own.forEach(function (m) { playedIds[m.home === id ? m.away : m.home] = true; });
    var openOpp = TEAMS.filter(function (x) { return x.id !== id && !playedIds[x.id]; });
    var openHTML = openOpp.length
      ? '<div class="m-open">' + openOpp.map(function (x) { return esc(x.name); }).join('<br>') + '</div>'
      : '<p class="m-open">All opponents faced.</p>';

    $('#modalContent').innerHTML =
      '<div class="m-head">' + ccChip(t) + '<h2>' + esc(t.name) + '</h2></div>' +
      '<p class="m-sub">Rank ' + r.rank + ' &middot; ' + esc(COUNTRIES[t.cc] || t.cc) + '</p>' +
      '<div class="m-stats">' +
        '<div class="m-stat"><b>' + r.points + '</b><span>Points</span></div>' +
        '<div class="m-stat"><b>' + r.played + '</b><span>Matches</span></div>' +
        '<div class="m-stat"><b>' + r.wins + '</b><span>Wins</span></div>' +
        '<div class="m-stat"><b>' + r.losses + '</b><span>Losses</span></div>' +
        '<div class="m-stat"><b>' + r.mapsW + ':' + r.mapsL + '</b><span>Maps</span></div>' +
        '<div class="m-stat"><b>' + sign(r.roundDiff) + '</b><span>Rounds +/-</span></div>' +
      '</div>' +
      '<div class="m-cols">' +
        '<div><h4>Roster</h4><ul class="roster">' + roster + '</ul></div>' +
        '<div><h4>Results</h4>' + matchRows +
          '<h4 style="margin-top:16px;">Pending opponents</h4>' + openHTML + '</div>' +
      '</div>';

    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
  }


  /* --------------------------------------------------------------- Theme */

  var THEME_KEY = 'arl_theme';

  function storedTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      return (t === 'light' || t === 'dark') ? t : null;
    } catch (e) {
      return null;
    }
  }

  function systemTheme() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark' : 'light';
  }

  /* The data-theme attribute is the source of truth for an explicit choice:
     localStorage may be unwritable (private mode, file://), in which case the
     attribute is still set and the UI must stay in sync with it. */
  function explicitTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return (t === 'light' || t === 'dark') ? t : null;
  }

  function effectiveTheme() {
    return explicitTheme() || storedTheme() || systemTheme();
  }

  function applyTheme() {
    var eff = effectiveTheme();
    document.documentElement.setAttribute('data-effective', eff);

    var btn = $('#themeToggle');
    if (btn) {
      var label = 'Switch to ' + (eff === 'dark' ? 'light' : 'dark') + ' mode';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
  }

  function initTheme() {
    applyTheme();

    $('#themeToggle').addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
      document.documentElement.setAttribute('data-theme', next);
      applyTheme();
    });

    /* follow the OS while no manual choice has been made */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (!explicitTheme()) applyTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ------------------------------------------------------ Filter select */

  function fillSelects() {
    var opts = TEAMS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); })
      .map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('');

    $('#matchFilter').innerHTML = '<option value="all">All teams</option>' + opts;
  }

  /* --------------------------------------------------------------- Init */

  function renderAll() {
    renderHeader();
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
    initTheme();
    fillSelects();
    initTabs();
    renderAll();

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
      if (e.key === 'Escape') closeModal();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
