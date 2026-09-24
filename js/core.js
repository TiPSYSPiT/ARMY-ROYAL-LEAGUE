/* =========================================================================
   ARMY ROYAL LEAGUE - shared core

   Everything both the league page (js/app.js) and a single team page
   (js/team.js) need: data access, standings, the team detail renderer and the
   theme switch. Exposed as one global object so the files can be loaded with
   plain <script> tags - ES modules would be blocked by CORS when the site is
   opened straight from disk via file://.
   ========================================================================= */

var ARL = (function () {
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

  /* both pages share this module but not every element, so writes are guarded */
  function setText(sel, text) {
    var el = $(sel);
    if (el) el.textContent = text;
  }

  function setHTML(sel, html) {
    var el = $(sel);
    if (el) el.innerHTML = html;
  }

  function diffClass(n) { return n > 0 ? 'pos' : (n < 0 ? 'neg' : 'zero'); }
  function sign(n) { return (n > 0 ? '+' : '') + n; }

  /* navigator.clipboard needs a secure context, which file:// is not, so fall
     back to a throwaway textarea */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }

  /* ------------------------------------------------------ Section anchors */

  /* Deep-linkable sections of the team page. The popup renders the same markup
     without anchors, so index.html never grows these ids. */
  var SECTIONS = [
    { id: 'overview',    label: 'Overview' },
    { id: 'roster',      label: 'Roster' },
    { id: 'results',     label: 'Results' },
    { id: 'fixtures',    label: 'Pending fixtures' },
    { id: 'playerstats', label: 'Player statistics' },
    { id: 'permap',      label: 'Per map' }
  ];

  var LINK_ICON =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M10.3 13.7a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7l-1.4 1.4"/>' +
    '<path d="M13.7 10.3a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.4-1.4"/>' +
    '</svg>';

  function anchorButton(id, label) {
    return '<button type="button" class="anchor-link" data-anchor="' + id + '"' +
      ' aria-label="Copy link to ' + esc(label) + '"' +
      ' title="Copy link to this section">' + LINK_ICON + '</button>';
  }

  /* Builds a heading; without `anchors` the output is byte-for-byte what the
     popup rendered before section links existed.

     With anchors the title and its icon are wrapped in one span: .pstat-head is
     a flex row with space-between, and a loose button would otherwise become a
     third flex item and drift into the middle. */
  function heading(tag, cls, style, id, label, text, trail, anchors) {
    if (!anchors) {
      return '<' + tag + (cls ? ' class="' + cls + '"' : '') +
             (style ? ' style="' + style + '"' : '') + '>' +
             text + (trail || '') + '</' + tag + '>';
    }
    return '<' + tag + ' class="' + (cls ? cls + ' ' : '') + 'has-anchor"' +
           (style ? ' style="' + style + '"' : '') + ' id="' + id + '">' +
           '<span class="h-title">' + text + anchorButton(id, label) + '</span>' +
           (trail || '') + '</' + tag + '>';
  }

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

  /* ------------------------------------------------------------- Slugs */

  /* Symbols are dropped rather than turned into separators, so "[SaG]" becomes
     "sag". Leetspeak cannot be guessed ("W@rZ" would give "wrz"), so a team may
     set an explicit `slug` in js/data.js to override this. */
  function teamSlug(team) {
    if (team.slug) return team.slug;
    return String(team.name)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]+/g, '')
      .trim()
      .replace(/[\s-]+/g, '-');
  }

  function teamBySlug(slug) {
    var want = String(slug || '').toLowerCase();
    var hit = TEAMS.filter(function (t) { return teamSlug(t) === want; });
    return hit.length ? hit[0] : null;
  }

  function teamPageURL(team) {
    return 'team.html?team=' + encodeURIComponent(teamSlug(team));
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

  /* --------------------------------------------------------- Schedule */

  /* Keyed by "home|away" only. Every pairing is played twice, so each ordered
     pair is its own fixture. */
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

  /* --------------------------------------------------------- Scoreboards */

  function allPlayerStats() {
    return (typeof PLAYER_STATS !== 'undefined' && PLAYER_STATS) ? PLAYER_STATS : {};
  }

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }

  var scoreboardCache = null;

  /* Raw scoreboards keyed by path, filled in by loadScoreboards(). */
  var loadedBoards = {};
  var loadPromise = null;

  /* Fetches every file listed in STATS_FILES in parallel. A file that is
     missing or malformed is reported by name and skipped - the remaining
     matches still render, and the page works without any of them. */
  function loadScoreboards() {
    if (loadPromise) return loadPromise;

    var paths = (typeof STATS_FILES !== 'undefined' && STATS_FILES) ? Object.keys(STATS_FILES) : [];

    if (location.protocol === 'file:' && paths.length) {
      console.warn('[ARL] Opened via file:// - the browser blocks fetch() for local ' +
                   'files, so scoreboards will be skipped. Serve the folder over HTTP ' +
                   'instead (see README).');
    }

    loadPromise = Promise.all(paths.map(function (path) {
      return fetch(path)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
          return res.json();
        })
        .then(function (data) {
          if (!data || !Array.isArray(data.teams)) throw new Error('no "teams" array');
          loadedBoards[path] = data;
        })
        .catch(function (err) {
          console.warn('[ARL] skipping scoreboard "' + path + '": ' + err.message);
        });
    })).then(function () {
      scoreboardCache = null;   /* rebuilt on next access */
      return loadedBoards;
    });

    return loadPromise;
  }

  /* Resolves the fetched scoreboards onto match + map + roster name. Player
     names carry clan tags and in-game spellings, so they go through
     PLAYER_ALIASES; only names belonging to the roster of the team that
     PLAYER_STATS records for that match are kept, which keeps two teams with a
     same-named player apart. */
  function scoreboardIndex() {
    if (scoreboardCache) return scoreboardCache;
    scoreboardCache = {};

    if (typeof STATS_FILES === 'undefined') return scoreboardCache;

    var aliases = (typeof PLAYER_ALIASES !== 'undefined' && PLAYER_ALIASES) ? PLAYER_ALIASES : {};

    Object.keys(STATS_FILES).forEach(function (key) {
      var raw = loadedBoards[key];
      var spec = STATS_FILES[key];
      if (!raw || !raw.teams || !spec) return;

      var matchId = spec[0], mapName = spec[1];
      var entry = allPlayerStats()[matchId];
      if (!entry) return;

      var team = TEAM_BY_ID[entry.team];
      if (!team) return;

      var roster = {};
      team.players.forEach(function (p) { roster[p.n] = true; });

      var bucket = {};
      raw.teams.forEach(function (side) {
        (side.players || []).forEach(function (p) {
          var name = aliases[p.name] || p.name;
          if (!roster[name]) return;
          /* an all-zero line means the player sat the map out */
          if (!num(p.score) && !num(p.kills) && !num(p.deaths)) return;

          bucket[name] = {
            hs: (p.hsPercent === null || p.hsPercent === undefined) ? null : num(p.hsPercent),
            kills: num(p.kills),
            tk: num(p.tk),
            nadeKills: num(p.nadeKills),
            nadeDeaths: num(p.nadeDeaths),
            plants: num(p.plants),
            defuses: num(p.defuses)
          };
        });
      });

      scoreboardCache[matchId + '|' + mapName] = bucket;
    });

    return scoreboardCache;
  }

  function scoreboardFor(matchId, mapName) {
    return scoreboardIndex()[matchId + '|' + mapName] || null;
  }

  /* only teams that actually have scoreboards get the extra columns */
  function teamHasScoreboards(teamId) {
    var idx = scoreboardIndex();
    var stats = allPlayerStats();
    return Object.keys(idx).some(function (key) {
      var matchId = key.split('|')[0];
      var entry = stats[matchId];
      return entry && entry.team === teamId && Object.keys(idx[key]).length > 0;
    });
  }

  /* ------------------------------------------------- Player statistics */

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
        var board = scoreboardFor(rec.match.id, map.name);

        map.players.forEach(function (p) {
          if (!byName[p.n]) {
            byName[p.n] = {
              n: p.n, maps: 0, s: 0, k: 0, a: 0, d: 0,
              /* scoreboard extras are summed only over the maps that have one */
              boards: 0, hsWeighted: 0, hsKills: 0, tk: 0,
              nadeKills: 0, nadeDeaths: 0, plants: 0, defuses: 0
            };
            order.push(p.n);
          }
          var t = byName[p.n];
          t.maps++; t.s += p.s; t.k += p.k; t.a += p.a; t.d += p.d;

          var extra = board ? board[p.n] : null;
          if (extra) {
            t.boards++;
            t.tk += extra.tk;
            t.nadeKills += extra.nadeKills;
            t.nadeDeaths += extra.nadeDeaths;
            t.plants += extra.plants;
            t.defuses += extra.defuses;
            if (extra.hs !== null) {
              t.hsWeighted += extra.hs * extra.kills;
              t.hsKills += extra.kills;
            }
          }
        });
      });
    });

    return order.map(function (n) { return byName[n]; })
      .sort(function (a, b) { return b.s - a.s || b.k - a.k || a.n.localeCompare(b.n); });
  }

  function kd(k, d) {
    return d > 0 ? (k / d).toFixed(2) : k.toFixed(2);
  }

  var DASH = '<td class="num-dim">&ndash;</td>';

  /* Per map the source percentage is shown unchanged - it arrives already
     rounded to a whole percent and there is no headshot-kill count to redo the
     division from. */
  function mapExtraCells(extra) {
    if (!extra) return DASH + DASH + DASH + DASH + DASH + DASH;
    return '<td>' + (extra.hs === null ? '&ndash;' : extra.hs + '%') + '</td>' +
      '<td class="num-dim">' + extra.tk + '</td>' +
      '<td class="num-dim">' + extra.nadeKills + '</td>' +
      '<td class="num-dim">' + extra.nadeDeaths + '</td>' +
      '<td class="num-dim">' + extra.plants + '</td>' +
      '<td class="num-dim">' + extra.defuses + '</td>';
  }

  /* Across maps the percentage is weighted by kills, which is as close to the
     true figure as the pre-rounded source allows. */
  function totalExtraCells(p) {
    if (!p.boards) return DASH + DASH + DASH + DASH + DASH + DASH;
    var hs = p.hsKills > 0 ? (p.hsWeighted / p.hsKills).toFixed(1) + '%' : '&ndash;';
    return '<td>' + hs + '</td>' +
      '<td class="num-dim">' + p.tk + '</td>' +
      '<td class="num-dim">' + p.nadeKills + '</td>' +
      '<td class="num-dim">' + p.nadeDeaths + '</td>' +
      '<td class="num-dim">' + p.plants + '</td>' +
      '<td class="num-dim">' + p.defuses + '</td>';
  }

  function statHead(withMaps, withExtras) {
    return '<thead><tr>' +
      '<th class="c-player">Player</th>' +
      (withMaps ? '<th title="Maps played">MAPS</th>' : '') +
      '<th title="Score">SCORE</th>' +
      '<th title="Kills">K</th>' +
      '<th title="Assists">A</th>' +
      '<th title="Deaths">D</th>' +
      '<th title="Kill / death ratio">K/D</th>' +
      (withExtras
        ? '<th title="Share of kills that were headshots">HS%</th>' +
          '<th title="Team kills">TK</th>' +
          '<th title="Grenade kills">NADE K</th>' +
          '<th title="Deaths by grenade">NADE D</th>' +
          '<th title="Bombs planted">PLANTS</th>' +
          '<th title="Bombs defused">DEF</th>'
        : '') +
      '</tr></thead>';
  }

  /* mapsCount is only passed for the aggregate table */
  function playerRow(p, mapsCount, extraCells) {
    return '<tr>' +
      '<td class="c-player">' + esc(p.n) + '</td>' +
      (mapsCount != null ? '<td class="num-dim">' + mapsCount + '</td>' : '') +
      '<td>' + p.s + '</td>' +
      '<td>' + p.k + '</td>' +
      '<td>' + p.a + '</td>' +
      '<td>' + p.d + '</td>' +
      '<td class="num-dim">' + kd(p.k, p.d) + '</td>' +
      (extraCells || '') +
      '</tr>';
  }

  function playerStatsHTML(teamId, anchors) {
    var records = statsForTeam(teamId);
    if (!records.length) return '';

    var withExtras = teamHasScoreboards(teamId);
    var totals = aggregatePlayers(records);

    var summary =
      '<div class="table-scroll"><table class="tbl pstats">' +
      statHead(true, withExtras) + '<tbody>' +
      totals.map(function (p) {
        return playerRow(p, p.maps, withExtras ? totalExtraCells(p) : '');
      }).join('') +
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

        var board = scoreboardFor(rec.match.id, map.name);

        var rows = map.players.slice().sort(function (a, b) { return b.s - a.s; })
          .map(function (p) {
            return playerRow(p, null, withExtras ? mapExtraCells(board ? board[p.n] : null) : '');
          }).join('');

        return '<details class="pstat-map">' +
          '<summary><span class="pm-name">Map ' + (i + 1) + ': ' + esc(map.name) + '</span>' +
          '<span class="pm-score">' + scoreTxt + '</span></summary>' +
          '<div class="table-scroll"><table class="tbl pstats">' +
          statHead(false, withExtras) + '<tbody>' + rows + '</tbody></table></div>' +
          '</details>';
      }).join('');

      return '<div class="pstat-group">' +
        '<h5>vs ' + esc(opp.name) +
          ' <span class="' + (won ? 'pos' : 'neg') + '">' + ownMaps + ':' + oppMaps + '</span></h5>' +
        maps +
        '</div>';
    }).join('');

    var note = '<span class="pstat-note">' + records.length + ' of ' +
      getMatches().filter(function (m) { return m.home === teamId || m.away === teamId; }).length +
      ' matches recorded</span>';

    return '<div class="pstat-block">' +
      heading('h4', 'pstat-head', '', 'playerstats', 'Player statistics',
              'Player statistics', note, anchors) +
      summary +
      heading('h4', 'pstat-head pstat-head-sub', '', 'permap', 'Per map',
              'Per map', '', anchors) +
      detail +
      '</div>';
  }

  /* --------------------------------------------------- Team detail view */

  /* The single source of truth for a team's detail markup - rendered into the
     modal on the league page and into the page body on team.html. */
  function teamDetailHTML(id, anchors) {
    var t = TEAM_BY_ID[id];
    if (!t) return '';
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

    return '<div class="m-head">' + ccChip(t) +
        heading('h2', '', '', 'overview', t.name, esc(t.name), '', anchors) +
      '</div>' +
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
        '<div>' + heading('h4', '', '', 'roster', 'Roster', 'Roster', '', anchors) +
          '<ul class="roster">' + roster + '</ul></div>' +
        '<div>' + heading('h4', '', '', 'results', 'Results', 'Results', '', anchors) + matchRows +
          heading('h4', '', 'margin-top:16px;', 'fixtures', 'Pending fixtures',
                  'Pending fixtures', '', anchors) + openHTML + '</div>' +
      '</div>' +
      playerStatsHTML(id, anchors);
  }

  /* ------------------------------------------------------------- Header */

  function renderHeader() {
    var matches = getMatches();
    var maps = matches.reduce(function (n, m) { return n + m.maps.length; }, 0);

    setHTML('#headerStats',
      '<div class="hstat"><b>' + TEAMS.length + '</b><span>Teams</span></div>' +
      '<div class="hstat"><b>' + TEAMS.length * 7 + '</b><span>Players</span></div>' +
      '<div class="hstat"><b>' + matches.length + '</b><span>Matches</span></div>' +
      '<div class="hstat"><b>' + maps + '</b><span>Maps</span></div>');

    setText('#headerUpdated', LEAGUE.updated ? 'Last updated ' + formatDate(LEAGUE.updated) : '');
    setText('#brandSeason', LEAGUE.season);
    setText('#footNote', matches.length + ' of ' + totalFixtures() + ' fixtures played');
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

    var btn = $('#themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
        document.documentElement.setAttribute('data-theme', next);
        applyTheme();
      });
    }

    /* follow the OS while no manual choice has been made */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (!explicitTheme()) applyTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* -------------------------------------------------------------- Export */

  /* Only what js/app.js and js/team.js actually call - everything else stays
     private to this module. */
  return {
    TEAM_BY_ID: TEAM_BY_ID,
    esc: esc, $: $, $$: $$, setText: setText, setHTML: setHTML,
    diffClass: diffClass, sign: sign, copyText: copyText,
    ccChip: ccChip, teamLabel: teamLabel, teamsAlphabetical: teamsAlphabetical,
    teamSlug: teamSlug, teamBySlug: teamBySlug, teamPageURL: teamPageURL,
    getMatches: getMatches, evalMatch: evalMatch,
    computeStandings: computeStandings, standingsById: standingsById,
    totalFixtures: totalFixtures, legIndex: legIndex,
    loadScoreboards: loadScoreboards,
    teamDetailHTML: teamDetailHTML, SECTIONS: SECTIONS,
    renderHeader: renderHeader, initTheme: initTheme
  };
})();
