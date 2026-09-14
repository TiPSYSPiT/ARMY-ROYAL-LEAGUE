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

  /* Alphabetical, case-insensitive. Names that do not begin with a letter or
     digit - "[SaG]" for instance - are pushed to the end instead of sorting
     first, which is where raw code-point order would put them. */
  function startsWithSymbol(name) {
    return !/^[\p{L}\p{N}]/u.test(String(name));
  }

  function byTeamName(a, b) {
    var as = startsWithSymbol(a.name) ? 1 : 0;
    var bs = startsWithSymbol(b.name) ? 1 : 0;
    if (as !== bs) return as - bs;
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  }

  function teamsAlphabetical() {
    return TEAMS.slice().sort(byTeamName);
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
    $('#teamGrid').innerHTML = teamsAlphabetical().map(function (t) {
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

  /* Keyed by "home|away" only. Every pairing is played twice, so each ordered
     pair is its own fixture: the matrix cell at (row = home, col = away)
     shows that leg, and the mirrored cell shows the return leg. */
  function matchupIndex() {
    var idx = {};
    getMatches().forEach(function (m) {
      var r = evalMatch(m);
      idx[m.home + '|' + m.away] = {
        maps: r.mapsHome + ':' + r.mapsAway,
        won: r.homeWon,
        h: r.mapsHome,
        a: r.mapsAway
      };
    });
    return idx;
  }

  /* double round robin: every ordered pair is a fixture */
  function totalFixtures() {
    return TEAMS.length * (TEAMS.length - 1);
  }

  /* The first leg puts the alphabetically first team at home; the return leg
     reverses that. Which leg a match belongs to therefore follows from the
     sides, without needing a flag in the data. */
  function isFirstLeg(m) {
    return byTeamName(TEAM_BY_ID[m.home], TEAM_BY_ID[m.away]) < 0;
  }

  /* Mirrored index for one leg: both cells of a pairing carry the result seen
     from the row team, so a row can be read straight across. */
  function legIndex(leg) {
    var idx = {};
    getMatches().forEach(function (m) {
      if ((isFirstLeg(m) ? 1 : 2) !== leg) return;
      var r = evalMatch(m);
      idx[m.home + '|' + m.away] = { maps: r.mapsHome + ':' + r.mapsAway, won: r.homeWon, atHome: true };
      idx[m.away + '|' + m.home] = { maps: r.mapsAway + ':' + r.mapsHome, won: r.awayWon, atHome: false };
    });
    return idx;
  }

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
    var order = teamsAlphabetical();

    var played = getMatches().length;
    $('#fixtureHint').textContent =
      'Double round robin · ' + played + ' of ' + totalFixtures() + ' fixtures played';

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
      var idx = legIndex(leg);
      var done = Object.keys(idx).length / 2;

      $('#legTitle' + leg).textContent =
        cfg.name + ' (' + done + ' of ' + (totalFixtures() / 2) + ')';
      $('#legVenue' + leg).textContent = venue[leg - 1];
      $('#legMaps' + leg).innerHTML = (cfg.maps || []).map(function (m) {
        return '<span>' + esc(m) + '</span>';
      }).join('');

      $('#matrixLeg' + leg).innerHTML = matrixHTML(order, idx);
    });
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
    var totalPairs = totalFixtures();

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
    $('#footNote').textContent = matches.length + ' of ' + totalFixtures() + ' fixtures played';
  }

  /* ------------------------------------------------- Player statistics */

  function allPlayerStats() {
    return (typeof PLAYER_STATS !== 'undefined' && PLAYER_STATS) ? PLAYER_STATS : {};
  }

  /* every recorded match for one team, paired with its match entry */
  function statsForTeam(teamId) {
    var store = allPlayerStats();
    return getMatches().filter(function (m) {
      var e = store[m.id];
      return e && e.team === teamId && e.maps && e.maps.length;
    }).map(function (m) {
      return { match: m, entry: store[m.id] };
    });
  }

  /* map score seen from the team's side */
  function mapScoreFor(match, teamId, i) {
    var map = match.maps[i];
    if (!map) return null;
    var isHome = match.home === teamId;
    var own = isHome ? map[0] : map[1];
    var opp = isHome ? map[1] : map[0];
    return { own: own, opp: opp, won: own > opp };
  }

  function aggregatePlayers(records) {
    var byName = {};
    var order = [];

    records.forEach(function (rec) {
      rec.entry.maps.forEach(function (map) {
        map.players.forEach(function (p) {
          if (!byName[p.n]) {
            byName[p.n] = { n: p.n, maps: 0, s: 0, k: 0, a: 0, d: 0 };
            order.push(p.n);
          }
          var t = byName[p.n];
          t.maps++; t.s += p.s; t.k += p.k; t.a += p.a; t.d += p.d;
        });
      });
    });

    return order.map(function (n) { return byName[n]; })
      .sort(function (a, b) { return b.s - a.s || b.k - a.k || a.n.localeCompare(b.n); });
  }

  function kd(k, d) {
    return d > 0 ? (k / d).toFixed(2) : k.toFixed(2);
  }

  /* mapsCount is only passed for the aggregate table */
  function playerRow(p, mapsCount) {
    return '<tr>' +
      '<td class="c-player">' + esc(p.n) + '</td>' +
      (mapsCount != null ? '<td class="num-dim">' + mapsCount + '</td>' : '') +
      '<td>' + p.s + '</td>' +
      '<td>' + p.k + '</td>' +
      '<td>' + p.a + '</td>' +
      '<td>' + p.d + '</td>' +
      '<td class="num-dim">' + kd(p.k, p.d) + '</td>' +
      '</tr>';
  }

  function playerStatsHTML(teamId) {
    var records = statsForTeam(teamId);
    if (!records.length) return '';

    var totals = aggregatePlayers(records);

    var summary =
      '<div class="table-scroll"><table class="tbl pstats">' +
      '<thead><tr>' +
        '<th class="c-player">Player</th>' +
        '<th title="Maps played">MAPS</th>' +
        '<th title="Score">SCORE</th>' +
        '<th title="Kills">K</th>' +
        '<th title="Assists">A</th>' +
        '<th title="Deaths">D</th>' +
        '<th title="Kill / death ratio">K/D</th>' +
      '</tr></thead><tbody>' +
      totals.map(function (p) { return playerRow(p, p.maps); }).join('') +
      '</tbody></table></div>';

    var detail = records.map(function (rec) {
      var opp = TEAM_BY_ID[rec.match.home === teamId ? rec.match.away : rec.match.home];
      var e = evalMatch(rec.match);
      var isHome = rec.match.home === teamId;
      var ownMaps = isHome ? e.mapsHome : e.mapsAway;
      var oppMaps = isHome ? e.mapsAway : e.mapsHome;
      var won = ownMaps > oppMaps;

      var maps = rec.entry.maps.map(function (map, i) {
        var sc = mapScoreFor(rec.match, teamId, i);
        var scoreTxt = sc
          ? '<span class="' + (sc.won ? 'pos' : 'neg') + '">' + sc.own + ':' + sc.opp + '</span>'
          : '';

        var rows = map.players.slice().sort(function (a, b) { return b.s - a.s; })
          .map(function (p) { return playerRow(p); }).join('');

        return '<details class="pstat-map">' +
          '<summary><span class="pm-name">Map ' + (i + 1) + ': ' + esc(map.name) + '</span>' +
          '<span class="pm-score">' + scoreTxt + '</span></summary>' +
          '<div class="table-scroll"><table class="tbl pstats">' +
          '<thead><tr>' +
            '<th class="c-player">Player</th><th>SCORE</th><th>K</th><th>A</th><th>D</th><th>K/D</th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '</details>';
      }).join('');

      return '<div class="pstat-group">' +
        '<h5>vs ' + esc(opp.name) +
          ' <span class="' + (won ? 'pos' : 'neg') + '">' + ownMaps + ':' + oppMaps + '</span></h5>' +
        maps +
        '</div>';
    }).join('');

    return '<div class="pstat-block">' +
      '<h4 class="pstat-head">Player statistics' +
        '<span class="pstat-note">' + records.length + ' of ' +
        getMatches().filter(function (m) { return m.home === teamId || m.away === teamId; }).length +
        ' matches recorded</span></h4>' +
      summary +
      '<h4 class="pstat-head pstat-head-sub">Per map</h4>' +
      detail +
      '</div>';
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

    /* each pairing has two legs, so list the missing legs rather than the
       opponents - a team can owe only the home or only the away fixture */
    var idx = matchupIndex();
    var pending = [];
    teamsAlphabetical().forEach(function (x) {
      if (x.id === id) return;
      if (!idx[id + '|' + x.id]) pending.push(esc(x.name) + ' <em>(home)</em>');
      if (!idx[x.id + '|' + id]) pending.push(esc(x.name) + ' <em>(away)</em>');
    });

    var openHTML = pending.length
      ? '<div class="m-open">' + pending.join('<br>') + '</div>'
      : '<p class="m-open">All fixtures played.</p>';

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
          '<h4 style="margin-top:16px;">Pending fixtures</h4>' + openHTML + '</div>' +
      '</div>' +
      playerStatsHTML(id);

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
    var opts = teamsAlphabetical()
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
