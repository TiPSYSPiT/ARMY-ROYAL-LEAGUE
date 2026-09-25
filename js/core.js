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
    { id: 'mapstats',    label: 'Map stats' },
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

  /* A map is [home, away] or [home, away, 'Name']. The name is deliberately not
     validated here: a typo in it must never drop the whole match from the
     standings. checkMapNames() reports such problems in the console instead. */
  function validMatch(m) {
    return m && TEAM_BY_ID[m.home] && TEAM_BY_ID[m.away] &&
           Array.isArray(m.maps) && m.maps.length >= 2 &&
           m.maps.every(function (x) { return Array.isArray(x) && (x.length === 2 || x.length === 3); });
  }

  /* the name exactly as typed - '' when there is no usable one */
  function rawMapName(map) {
    return (map && typeof map[2] === 'string') ? map[2].trim() : '';
  }

  /* Canonical map names: the pools in LEAGUE.legs, in that order. */
  function knownMaps() {
    var list = [];
    ((typeof LEAGUE !== 'undefined' && LEAGUE.legs) || []).forEach(function (l) {
      (l.maps || []).forEach(function (n) { if (list.indexOf(n) === -1) list.push(n); });
    });
    return list;
  }

  /* 'mp_backlot_x', 'backlot', ' BACKLOT ' -> 'Backlot'. The scoreboards use the
     engine names (mp_*), data.js the display names; both end up the same here.
     Anything not in LEAGUE.legs is kept as typed, so a new map still shows up
     without a code change (and checkMapNames() flags it). */
  function normalizeMapName(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    var squash = function (x) { return x.toLowerCase().replace(/[\s_-]+/g, ''); };
    var key = squash(s.replace(/^mp_/i, '').replace(/_x$/i, ''));
    var hit = knownMaps().filter(function (n) { return squash(n) === key; });
    return hit.length ? hit[0] : s;
  }

  /* display name of a map entry - '' when none was entered */
  function mapName(map) {
    return normalizeMapName(rawMapName(map));
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

  /* ------------------------------------------------------- Map name check */

  /* Map names are typed in by hand, so every problem is reported once in the
     console with the match id - nothing here ever hides a result. */
  function checkMapNames() {
    var legs = (LEAGUE.legs && LEAGUE.legs.length) ? LEAGUE.legs : [];
    if (!legs.length) return;

    var known = {};
    legs.forEach(function (l) { (l.maps || []).forEach(function (n) { known[n] = true; }); });
    var knownList = Object.keys(known);

    function warn(m, i, text) {
      console.warn('[ARL] ' + m.id + ' map ' + (i + 1) + ': ' + text);
    }

    getMatches().forEach(function (m) {
      var leg = isFirstLeg(m) ? 1 : 2;
      var pool = (legs[leg - 1] && legs[leg - 1].maps) || [];
      var seen = {};

      m.maps.forEach(function (map, i) {
        if (map.length < 3) return;

        /* the raw spelling on purpose: display normalises 'backlot' quietly,
           but the entry in data.js should still be fixed */
        var name = rawMapName(map);
        if (!name) {
          warn(m, i, 'the map name must be a quoted text, e.g. \'Cluster\'');
          return;
        }

        if (!known[name]) {
          var near = knownList.filter(function (k) { return k.toLowerCase() === name.toLowerCase(); });
          warn(m, i, 'unknown map "' + name + '"' +
                     (near.length ? ' - did you mean "' + near[0] + '"?' : ' - expected one of ' + knownList.join(', ')));
        } else if (pool.indexOf(name) === -1) {
          warn(m, i, '"' + name + '" is not in the ' + (legs[leg - 1].name || 'leg ' + leg) +
                     ' pool (' + pool.join(', ') + ')');
        }

        if (seen[name]) warn(m, i, '"' + name + '" is listed twice in this match');
        seen[name] = true;
      });
    });
  }

  /* --------------------------------------------------------- Scoreboards */

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }

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
      statsCache = null;   /* rebuilt on next access */
      return loadedBoards;
    });

    return loadPromise;
  }

  /* ------------------------------------------------- Player statistics */

  var statsCache = null;

  /* Player statistics come straight from the fetched scoreboards - nothing is
     kept by hand in data.js. For each file in STATS_FILES, the scoreboard side
     whose in-game names resolve (via PLAYER_ALIASES) to the home or the away
     roster becomes that team's record of the map; a side nobody can be matched
     on is simply not shown. So a new match needs only its JSON file and its
     line in STATS_FILES.

     Result: teamId -> matchId -> { maps: [{ index, name, players, partial }] },
     each player row carrying score/K/A/D and the scoreboard extras together. */
  function playerStatsIndex() {
    if (statsCache) return statsCache;
    statsCache = {};
    if (typeof STATS_FILES === 'undefined') return statsCache;

    var aliases = (typeof PLAYER_ALIASES !== 'undefined' && PLAYER_ALIASES) ? PLAYER_ALIASES : {};
    var byId = {};
    getMatches().forEach(function (m) { byId[m.id] = m; });

    function warn(path, text) { console.warn('[ARL] ' + path + ': ' + text); }

    function rosterOf(teamId) {
      var r = {};
      TEAM_BY_ID[teamId].players.forEach(function (p) { r[p.n] = true; });
      return r;
    }

    /* one roster name can appear twice on a map (a reconnect under another
       name) - those lines are merged, the headshot share weighted by kills */
    function addRow(rows, name, p) {
      var hs = (p.hsPercent === null || p.hsPercent === undefined) ? null : num(p.hsPercent);
      var r = rows[name];
      if (!r) {
        rows[name] = { n: name, s: num(p.score), k: num(p.kills), a: num(p.assists), d: num(p.deaths),
                       hs: hs, tk: num(p.tk), nadeKills: num(p.nadeKills), nadeDeaths: num(p.nadeDeaths),
                       plants: num(p.plants), defuses: num(p.defuses) };
        return;
      }
      if (hs !== null || r.hs !== null) {
        var k1 = r.hs === null ? 0 : r.k, k2 = hs === null ? 0 : num(p.kills);
        r.hs = (k1 + k2) ? ((r.hs || 0) * k1 + (hs || 0) * k2) / (k1 + k2) : null;
      }
      r.s += num(p.score); r.k += num(p.kills); r.a += num(p.assists); r.d += num(p.deaths);
      r.tk += num(p.tk); r.nadeKills += num(p.nadeKills); r.nadeDeaths += num(p.nadeDeaths);
      r.plants += num(p.plants); r.defuses += num(p.defuses);
    }

    Object.keys(STATS_FILES).forEach(function (path) {
      var raw = loadedBoards[path];
      var spec = STATS_FILES[path];
      if (!raw || !spec) return;

      var m = byId[spec[0]];
      if (!m) { warn(path, 'match ' + spec[0] + ' does not exist in MATCHES'); return; }

      var label = normalizeMapName(spec[1]);
      var index = -1;
      m.maps.forEach(function (mp, i) { if (index < 0 && mapName(mp) === label) index = i; });
      if (index < 0) { warn(path, spec[0] + ' has no map named "' + label + '"'); return; }

      /* the recording names its own map - it should agree with STATS_FILES */
      if (raw.map && normalizeMapName(raw.map) !== label) {
        warn(path, 'listed as ' + label + ', but the recording itself says "' + raw.map + '"');
      }

      var best = null;
      raw.teams.forEach(function (side) {
        [m.home, m.away].forEach(function (teamId) {
          var roster = rosterOf(teamId);
          var rows = {};
          (side.players || []).forEach(function (p) {
            var name = aliases[p.name] || p.name;
            if (!roster[name]) return;
            /* an all-zero line means the player sat the map out */
            if (!num(p.score) && !num(p.kills) && !num(p.deaths)) return;
            addRow(rows, name, p);
          });
          var list = Object.keys(rows).map(function (n) { return rows[n]; });
          if (list.length && (!best || list.length > best.players.length)) {
            best = { team: teamId, players: list };
          }
        });
      });
      if (!best) return;

      /* a recording started late or cut short has fewer rounds than the result */
      var recorded = raw.teams.reduce(function (n, t) { return n + num(t.roundsWon); }, 0);
      var official = m.maps[index][0] + m.maps[index][1];

      var team = statsCache[best.team] || (statsCache[best.team] = {});
      var entry = team[m.id] || (team[m.id] = { maps: [] });
      entry.maps.push({
        index: index,
        name: label,
        players: best.players,
        partial: (recorded && recorded < official) ? { recorded: recorded, official: official } : null
      });
    });

    /* maps in the order they were played */
    Object.keys(statsCache).forEach(function (teamId) {
      Object.keys(statsCache[teamId]).forEach(function (matchId) {
        statsCache[teamId][matchId].maps.sort(function (a, b) { return a.index - b.index; });
      });
    });

    return statsCache;
  }

  /* every recorded match of one team, in the order of MATCHES */
  function statsForTeam(teamId) {
    var byMatch = playerStatsIndex()[teamId] || {};
    return getMatches().filter(function (m) { return byMatch[m.id]; })
      .map(function (m) { return { match: m, entry: byMatch[m.id] }; });
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
            byName[p.n] = {
              n: p.n, maps: 0, s: 0, k: 0, a: 0, d: 0,
              hsWeighted: 0, hsKills: 0, tk: 0,
              nadeKills: 0, nadeDeaths: 0, plants: 0, defuses: 0
            };
            order.push(p.n);
          }
          var t = byName[p.n];
          t.maps++; t.s += p.s; t.k += p.k; t.a += p.a; t.d += p.d;
          t.tk += p.tk;
          t.nadeKills += p.nadeKills;
          t.nadeDeaths += p.nadeDeaths;
          t.plants += p.plants;
          t.defuses += p.defuses;
          if (p.hs !== null) {
            t.hsWeighted += p.hs * p.k;
            t.hsKills += p.k;
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

  /* Per map the source percentage is shown unchanged - it arrives already
     rounded to a whole percent and there is no headshot-kill count to redo the
     division from. */
  function mapExtraCells(p) {
    return '<td>' + (p.hs === null ? '&ndash;' : Math.round(p.hs) + '%') + '</td>' +
      '<td class="num-dim">' + p.tk + '</td>' +
      '<td class="num-dim">' + p.nadeKills + '</td>' +
      '<td class="num-dim">' + p.nadeDeaths + '</td>' +
      '<td class="num-dim">' + p.plants + '</td>' +
      '<td class="num-dim">' + p.defuses + '</td>';
  }

  /* Across maps the percentage is weighted by kills, which is as close to the
     true figure as the pre-rounded source allows. */
  function totalExtraCells(p) {
    var hs = p.hsKills > 0 ? (p.hsWeighted / p.hsKills).toFixed(1) + '%' : '&ndash;';
    return '<td>' + hs + '</td>' +
      '<td class="num-dim">' + p.tk + '</td>' +
      '<td class="num-dim">' + p.nadeKills + '</td>' +
      '<td class="num-dim">' + p.nadeDeaths + '</td>' +
      '<td class="num-dim">' + p.plants + '</td>' +
      '<td class="num-dim">' + p.defuses + '</td>';
  }

  function statHead(withMaps) {
    return '<thead><tr>' +
      '<th class="c-player">Player</th>' +
      (withMaps ? '<th title="Maps played">MAPS</th>' : '') +
      '<th title="Score">SCORE</th>' +
      '<th title="Kills">K</th>' +
      '<th title="Assists">A</th>' +
      '<th title="Deaths">D</th>' +
      '<th title="Kill / death ratio">K/D</th>' +
      '<th title="Share of kills that were headshots">HS%</th>' +
      '<th title="Team kills">TK</th>' +
      '<th title="Grenade kills">NADE K</th>' +
      '<th title="Deaths by grenade">NADE D</th>' +
      '<th title="Bombs planted">PLANTS</th>' +
      '<th title="Bombs defused">DEF</th>' +
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

    var totals = aggregatePlayers(records);
    var partialMaps = 0;

    var summary =
      '<div class="table-scroll"><table class="tbl pstats">' +
      statHead(true) + '<tbody>' +
      totals.map(function (p) { return playerRow(p, p.maps, totalExtraCells(p)); }).join('') +
      '</tbody></table></div>';

    var detail = records.map(function (rec) {
      var opp = TEAM_BY_ID[rec.match.home === teamId ? rec.match.away : rec.match.home];
      var e = evalMatch(rec.match);
      var isHome = rec.match.home === teamId;
      var ownMaps = isHome ? e.mapsHome : e.mapsAway;
      var oppMaps = isHome ? e.mapsAway : e.mapsHome;
      var won = ownMaps > oppMaps;

      var maps = rec.entry.maps.map(function (map) {
        var sc = mapScoreFor(rec.match, teamId, map.index);
        var scoreTxt = sc
          ? '<span class="' + (sc.won ? 'pos' : 'neg') + '">' + sc.own + ':' + sc.opp + '</span>'
          : '';

        var partial = '';
        if (map.partial) {
          partialMaps++;
          partial = '<span class="pm-partial" title="The recording holds ' + map.partial.recorded +
            ' of the ' + map.partial.official + ' rounds played - these numbers are incomplete">' +
            'partial: ' + map.partial.recorded + ' of ' + map.partial.official + ' rounds</span>';
        }

        var rows = map.players.slice().sort(function (a, b) { return b.s - a.s; })
          .map(function (p) { return playerRow(p, null, mapExtraCells(p)); }).join('');

        return '<details class="pstat-map">' +
          '<summary><span class="pm-name">Map ' + (map.index + 1) + ': ' + esc(map.name) + '</span>' +
          partial +
          '<span class="pm-score">' + scoreTxt + '</span></summary>' +
          '<div class="table-scroll"><table class="tbl pstats">' +
          statHead(false) + '<tbody>' + rows + '</tbody></table></div>' +
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
      ' matches recorded' +
      (partialMaps ? ' &middot; ' + partialMaps + ' map' + (partialMaps > 1 ? 's' : '') + ' only partly' : '') +
      '</span>';

    return '<div class="pstat-block">' +
      heading('h4', 'pstat-head', '', 'playerstats', 'Player statistics',
              'Player statistics', note, anchors) +
      summary +
      heading('h4', 'pstat-head pstat-head-sub', '', 'permap', 'Per map',
              'Per map', '', anchors) +
      detail +
      '</div>';
  }

  /* ------------------------------------------------------------ Map stats */

  /* A team needs this many maps on a map before it can be called its best or
     weakest map, or the league leader there - one lucky game says little. */
  var MIN_MAPS_RANKED = 2;

  var mapStatsCache = null;

  /* The single calculation behind the team section, the popup and the league
     tab. One pass over MATCHES, so new matches and new maps flow in by
     themselves. Maps without a name cannot be attributed and are skipped. */
  function mapStatsIndex() {
    if (mapStatsCache) return mapStatsCache;

    var byTeam = {};
    var timesPlayed = {};
    TEAMS.forEach(function (t) { byTeam[t.id] = {}; });

    getMatches().forEach(function (m) {
      m.maps.forEach(function (map) {
        var name = mapName(map);
        if (!name) return;
        timesPlayed[name] = (timesPlayed[name] || 0) + 1;

        [[m.home, map[0], map[1]], [m.away, map[1], map[0]]].forEach(function (side) {
          var team = byTeam[side[0]];
          if (!team) return;
          var r = team[name] || (team[name] = { map: name, played: 0, w: 0, d: 0, l: 0, rw: 0, rl: 0 });
          r.played++;
          r.rw += side[1];
          r.rl += side[2];
          if (side[1] > side[2]) r.w++;
          else if (side[1] < side[2]) r.l++;
          else r.d++;
        });
      });
    });

    Object.keys(byTeam).forEach(function (id) {
      Object.keys(byTeam[id]).forEach(function (n) {
        var r = byTeam[id][n];
        r.diff = r.rw - r.rl;
        r.winPct = r.played ? r.w * 100 / r.played : null;
      });
    });

    mapStatsCache = { byTeam: byTeam, timesPlayed: timesPlayed };
    return mapStatsCache;
  }

  /* maps that were actually played: the league pools first, then any other name */
  function mapOrder() {
    var played = mapStatsIndex().timesPlayed;
    var known = knownMaps();
    return known.filter(function (n) { return played[n]; })
      .concat(Object.keys(played).filter(function (n) { return known.indexOf(n) === -1; }).sort());
  }

  function mapTimesPlayed(name) {
    return mapStatsIndex().timesPlayed[name] || 0;
  }

  function teamMapRecord(teamId, name) {
    var t = mapStatsIndex().byTeam[teamId];
    return (t && t[name]) || null;
  }

  /* default order: most played first */
  function teamMapRows(teamId) {
    var t = mapStatsIndex().byTeam[teamId] || {};
    var order = mapOrder();
    return Object.keys(t).map(function (n) { return t[n]; }).sort(function (a, b) {
      return b.played - a.played || b.winPct - a.winPct || b.diff - a.diff ||
             order.indexOf(a.map) - order.indexOf(b.map);
    });
  }

  function byStrength(a, b) {
    return b.winPct - a.winPct || b.diff - a.diff || b.played - a.played;
  }

  /* best and weakest map of a team; nothing when fewer than two maps qualify
     or when all qualifying maps are level */
  function teamBestWorst(rows) {
    var ok = rows.filter(function (r) { return r.played >= MIN_MAPS_RANKED; }).sort(byStrength);
    if (ok.length < 2) return {};
    var best = ok[0], worst = ok[ok.length - 1];
    if (best.winPct === worst.winPct && best.diff === worst.diff) return {};
    return { best: best.map, worst: worst.map };
  }

  /* the strongest team on one map, among teams with enough games there */
  function mapLeader(name) {
    var rows = TEAMS.map(function (t) {
      var r = teamMapRecord(t.id, name);
      return r ? { team: t, played: r.played, w: r.w, d: r.d, l: r.l,
                   winPct: r.winPct, diff: r.diff, rw: r.rw, rl: r.rl } : null;
    }).filter(function (r) { return r && r.played >= MIN_MAPS_RANKED; }).sort(byStrength);
    return rows.length ? rows[0] : null;
  }

  function pct(v) {
    return v === null || v === undefined ? '&ndash;' : Math.round(v) + '%';
  }

  function mapStatsHTML(teamId, anchors) {
    var rows = teamMapRows(teamId);
    var note = rows.length
      ? '<span class="pstat-note">best / weakest need ' + MIN_MAPS_RANKED + '+ maps</span>'
      : '';
    var head = heading('h4', 'pstat-head', '', 'mapstats', 'Map stats', 'Map stats', note, anchors);

    if (!rows.length) {
      return '<div class="mstat-block">' + head + '<p class="m-open">No maps played yet.</p></div>';
    }

    var bw = teamBestWorst(rows);

    var body = rows.map(function (r) {
      var tag = r.map === bw.best ? '<span class="mtag mtag-best">best</span>'
              : r.map === bw.worst ? '<span class="mtag mtag-worst">weakest</span>' : '';
      var cls = r.map === bw.best ? ' class="mst-best"' : r.map === bw.worst ? ' class="mst-worst"' : '';
      return '<tr' + cls + '>' +
        '<td class="c-player" data-v="' + esc(r.map) + '">' + esc(r.map) + tag + '</td>' +
        '<td data-v="' + r.played + '">' + r.played + '</td>' +
        '<td data-v="' + r.w + '">' + r.w + '</td>' +
        '<td class="num-dim" data-v="' + r.d + '">' + r.d + '</td>' +
        '<td data-v="' + r.l + '">' + r.l + '</td>' +
        '<td data-v="' + (r.winPct === null ? '' : r.winPct) + '"><b>' + pct(r.winPct) + '</b></td>' +
        '<td class="num-dim" data-v="' + r.rw + '">' + r.rw + '</td>' +
        '<td class="num-dim" data-v="' + r.rl + '">' + r.rl + '</td>' +
        '<td class="' + diffClass(r.diff) + '" data-v="' + r.diff + '">' + sign(r.diff) + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="mstat-block">' + head +
      '<div class="table-scroll"><table class="tbl pstats mstats sortable">' +
      '<thead><tr>' +
        '<th class="c-player" data-sort="text" title="Map">MAP</th>' +
        '<th data-sort="num" aria-sort="descending" title="Maps played">PLAYED</th>' +
        '<th data-sort="num" title="Maps won">W</th>' +
        '<th data-sort="num" title="Maps drawn">D</th>' +
        '<th data-sort="num" title="Maps lost">L</th>' +
        '<th data-sort="num" title="Share of maps won">WIN%</th>' +
        '<th data-sort="num" title="Rounds won on this map">ROUNDS WON</th>' +
        '<th data-sort="num" title="Rounds lost on this map">ROUNDS LOST</th>' +
        '<th data-sort="num" title="Rounds won minus rounds lost">ROUND DIFF</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div></div>';
  }

  /* ------------------------------------------------------ Table sorting */

  /* Makes every table.sortable under `root` sortable by clicking a header with
     data-sort="num" or "text". Cells may carry the raw value in data-v; an
     empty value (a dash) always sorts last. Safe to call again after a
     re-render - each table is wired only once. */
  function enableSorting(root) {
    $$('table.sortable', root).forEach(function (table) {
      if (table.getAttribute('data-sort-ready')) return;
      table.setAttribute('data-sort-ready', '1');

      var ths = $$('thead th[data-sort]', table);
      ths.forEach(function (th) {
        th.tabIndex = 0;

        function sortBy() {
          var cur = th.getAttribute('aria-sort');
          var dir = cur ? (cur === 'descending' ? 'ascending' : 'descending')
                        : (th.getAttribute('data-sort') === 'text' ? 'ascending' : 'descending');
          ths.forEach(function (o) { o.removeAttribute('aria-sort'); });
          th.setAttribute('aria-sort', dir);

          var col = Array.prototype.indexOf.call(th.parentNode.children, th);
          var numeric = th.getAttribute('data-sort') === 'num';
          var body = table.tBodies[0];
          var rows = Array.prototype.slice.call(body.rows);

          rows.sort(function (a, b) {
            var x = a.cells[col].getAttribute('data-v');
            var y = b.cells[col].getAttribute('data-v');
            if (x === null) x = a.cells[col].textContent;
            if (y === null) y = b.cells[col].textContent;
            if (x === '' || y === '') return (x === '') - (y === '');   /* dashes last */
            var c = numeric ? parseFloat(x) - parseFloat(y)
                            : String(x).localeCompare(String(y), 'en', { sensitivity: 'base' });
            return dir === 'ascending' ? c : -c;
          });
          rows.forEach(function (r) { body.appendChild(r); });
        }

        th.addEventListener('click', sortBy);
        th.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortBy(); }
        });
      });
    });
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
      mapStatsHTML(id, anchors) +
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

  /* once per page load - every declaration above is in place by now */
  checkMapNames();

  /* Only what js/app.js and js/team.js actually call - everything else stays
     private to this module. */
  return {
    TEAM_BY_ID: TEAM_BY_ID,
    esc: esc, $: $, $$: $$, setText: setText, setHTML: setHTML,
    diffClass: diffClass, sign: sign, copyText: copyText,
    ccChip: ccChip, teamLabel: teamLabel, teamsAlphabetical: teamsAlphabetical,
    teamSlug: teamSlug, teamBySlug: teamBySlug, teamPageURL: teamPageURL,
    getMatches: getMatches, evalMatch: evalMatch, mapName: mapName,
    mapOrder: mapOrder, mapTimesPlayed: mapTimesPlayed, teamMapRecord: teamMapRecord,
    mapLeader: mapLeader, MIN_MAPS_RANKED: MIN_MAPS_RANKED, pct: pct,
    enableSorting: enableSorting,
    computeStandings: computeStandings, standingsById: standingsById,
    totalFixtures: totalFixtures, legIndex: legIndex,
    loadScoreboards: loadScoreboards,
    teamDetailHTML: teamDetailHTML, SECTIONS: SECTIONS,
    renderHeader: renderHeader, initTheme: initTheme
  };
})();
