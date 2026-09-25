/* =========================================================================
   ARMY ROYAL LEAGUE - data source
   Teams and results are maintained here. Everything else is derived.
   ========================================================================= */

const LEAGUE = {
  name: 'ARMY ROYAL LEAGUE',
  game: 'Call of Duty 4',
  season: 'Season 1',
  mode: 'Best of 3',
  pointsWin: 3,
  pointsLoss: 0,

  /* Date the results below were last updated (YYYY-MM-DD).
     Bump this whenever you add a match - it is shown in the header. */
  updated: '2026-09-25',

  /* Each pairing is played twice, with its own map pool per leg.
     Leg 1 puts the alphabetically first team at home, leg 2 reverses that. */
  legs: [
    { name: 'First leg',  maps: ['Backlot', 'Cluster', 'Strike'] },
    { name: 'Return leg', maps: ['Citystreets', 'Crash', 'Crossfire'] }
  ]
};

const COUNTRIES = {
  EU: 'Europe',
  IT: 'Italy',
  HU: 'Hungary',
  HR: 'Croatia',
  SK: 'Slovakia',
  FR: 'France',
  UN: 'International'
};

/* c: true  =>  captain */
const TEAMS = [
  {
    id: 'alpha', name: 'ARMY ALPHA', cc: 'EU', flag: '\u{1F1EA}\u{1F1FA}',
    players: [
      { n: 'z1nkARY', c: true }, { n: 'Pio', c: true }, { n: 'Reaper' },
      { n: 'Bzumo' }, { n: 'Ghjj' }, { n: 'Shooter' }, { n: 'bersje' }
    ]
  },
  {
    id: 'bravo', name: 'ARMY BRAVO', cc: 'EU', flag: '\u{1F1EA}\u{1F1FA}',
    players: [
      { n: 'ONworld', c: true }, { n: 'dcl', c: true }, { n: 'jUZE' },
      { n: 'Shark' }, { n: 'Andy' }, { n: 'Streaty' }, { n: 'PATIR' }
    ]
  },
  {
    id: 'sag', name: '[SaG]', cc: 'IT', flag: '\u{1F1EE}\u{1F1F9}',
    players: [
      { n: 'Shuzj', c: true }, { n: 'Robewixz', c: true }, { n: '1lb10nd0' },
      { n: 'Toraki' }, { n: 'Brambi$h0w' }, { n: 'Woody' }, { n: 'sM0ke' }
    ]
  },
  {
    id: 'myquest', name: 'myQuest', cc: 'HU', flag: '\u{1F1ED}\u{1F1FA}',
    players: [
      { n: 'MAFFIA', c: true }, { n: 'kR1sZ', c: true }, { n: 'Pr1Mo' },
      { n: 'zozo' }, { n: 'sleedy' }, { n: 'swaaney' }, { n: 't00ls' }
    ]
  },
  {
    id: 'infinity', name: 'infinity eSports', cc: 'EU', flag: '\u{1F1EA}\u{1F1FA}',
    players: [
      { n: 'Basham', c: true }, { n: 'paramore', c: true }, { n: 'EMPzY' },
      { n: 'BOOBiO' }, { n: 'TiPSY' }, { n: 'Levitate' }, { n: 'NATHZN' }
    ]
  },
  {
    id: 'deox', name: 'deox', cc: 'HR', flag: '\u{1F1ED}\u{1F1F7}',
    players: [
      { n: 'reflex', c: true }, { n: 'Brosky', c: true }, { n: 'M1taR' },
      { n: 'mihajj' }, { n: 'SHOZ' }, { n: 'fdDX' }, { n: 'NOCNAMORA' }
    ]
  },
  {
    id: 'cas1', name: 'CAS1', cc: 'HU', flag: '\u{1F1ED}\u{1F1FA}',
    players: [
      { n: 'TOCSKA', c: true }, { n: 'abc', c: true }, { n: 'YSL' },
      { n: 'buci' }, { n: 'fors3y' }, { n: 'adamd' }, { n: 'PLAXZ' }
    ]
  },
  {
    id: 'lafine', name: 'LAFINE Corp', cc: 'FR', flag: '\u{1F1EB}\u{1F1F7}',
    players: [
      { n: 'sobieK', c: true }, { n: 'POPCORN', c: true }, { n: 'lucknazz' },
      { n: 'exta' }, { n: 'jeyt' }, { n: 'GuiGuiTwenTy' }, { n: 'foxzeed' }
    ]
  },
  {
    id: 'warz', name: 'W@rZ', slug: 'warz', cc: 'SK', flag: '\u{1F1F8}\u{1F1F0}',
    players: [
      { n: 'Zetor_7245', c: true }, { n: 'delete', c: true }, { n: 'imperial' },
      { n: 'superb' }, { n: 'koyak' }, { n: 'hawkotro' }, { n: 'zAzA' }
    ]
  },
  {
    id: 'nosweat', name: 'NoSweat', cc: 'EU', flag: '\u{1F1EA}\u{1F1FA}',
    players: [
      { n: 'Alex', c: true }, { n: 'dUST', c: true }, { n: 'zenr' },
      { n: 'MRSU' }, { n: 'DUZMAAN' }, { n: 'ibes' }, { n: 'kAAAkao' }
    ]
  },
  {
    id: 'adhd', name: 'AD☇HD', cc: 'UN', flag: '\u{1F1FA}\u{1F1F3}',
    players: [
      { n: 'Beck', c: true }, { n: 'Robzz', c: true }, { n: 'Nemes' },
      { n: 'Ossi' }, { n: 'GENESIS' }, { n: 'Ziva' }, { n: 'proxict' }
    ]
  },
  {
    id: 'revolt', name: 'Revolt', cc: 'EU', flag: '\u{1F1EA}\u{1F1FA}',
    players: [
      { n: 'ninja', c: true }, { n: 'Saintz', c: true }, { n: 'Atum' },
      { n: 'Vahz' }, { n: 'Meep' }, { n: '+2' }
    ]
  }
];


/* Every pairing is played twice.
   Leg 1: the alphabetically first team is at home.
   Leg 2: the same pairing with the sides reversed.
   maps: [[homeRounds, awayRounds, 'MapName'], ...]  -  Best of 3

   The map name is optional - [13, 2] and [13, 2, 'Cluster'] are both fine.
   Use the spelling from LEAGUE.legs (Backlot, Cluster, Strike, Citystreets,
   Crash, Crossfire); anything else is reported in the browser console. */
const MATCHES = [
  { id: 'm01', home: 'alpha',    away: 'cas1',     maps: [[13, 2, 'Cluster'], [13, 2, 'Backlot']] },
  { id: 'm02', home: 'adhd',     away: 'lafine',   maps: [[9, 13, 'Strike'], [10, 13, 'Backlot']] },
  { id: 'm03', home: 'deox',     away: 'nosweat',  maps: [[7, 13, 'Backlot'], [10, 13, 'Cluster']] },
  { id: 'm04', home: 'deox',     away: 'infinity', maps: [[13, 11, 'Backlot'], [3, 13, 'Strike'], [13, 6, 'Cluster']] },
  { id: 'm05', home: 'alpha',    away: 'sag',      maps: [[13, 5, 'Strike'], [13, 7, 'Cluster']] },
  { id: 'm06', home: 'myquest',  away: 'warz',     maps: [[13, 2, 'Strike'], [13, 3, 'Backlot']] },
  { id: 'm07', home: 'bravo',    away: 'deox',     maps: [[13, 2, 'Backlot'], [13, 10, 'Strike']] },
  { id: 'm08', home: 'deox',     away: 'myquest',  maps: [[7, 13, 'Cluster'], [5, 13, 'Strike']] },
  { id: 'm09', home: 'bravo',    away: 'cas1',     maps: [[13, 2, 'Backlot'], [13, 3, 'Strike']] },
  { id: 'm10', home: 'cas1',     away: 'myquest',  maps: [[10, 13, 'Strike'], [4, 13, 'Backlot']] },
  { id: 'm11', home: 'lafine',   away: 'sag',      maps: [[7, 13, 'Strike'], [10, 13, 'Backlot']] },
  { id: 'm12', home: 'myquest',  away: 'sag',      maps: [[11, 13, 'Strike'], [20, 22, 'Backlot']] },
  { id: 'm13', home: 'infinity', away: 'lafine',   maps: [[13, 6, 'Strike'], [11, 13, 'Backlot'], [13, 6, 'Cluster']] },
  { id: 'm14', home: 'bravo',    away: 'nosweat',  maps: [[13, 10, 'Backlot'], [9, 13, 'Strike'], [9, 13, 'Cluster']] },
  { id: 'm15', home: 'deox',     away: 'bravo',    maps: [[7, 13, 'Citystreets'], [11, 13, 'Crossfire']] },
  { id: 'm16', home: 'alpha',    away: 'nosweat',  maps: [[13, 11, 'Cluster'], [13, 3, 'Strike']] },
  { id: 'm17', home: 'lafine',   away: 'revolt',   maps: [[13, 5, 'Strike'], [9, 13, 'Backlot'], [4, 13, 'Cluster']] },
  { id: 'm18', home: 'alpha',    away: 'bravo',    maps: [[13, 7, 'Backlot'], [13, 4, 'Cluster']] },
  { id: 'm19', home: 'adhd',     away: 'revolt',   maps: [[5, 13, 'Strike'], [6, 13, 'Backlot']] },
  { id: 'm20', home: 'adhd',     away: 'warz',     maps: [[13, 5, 'Strike'], [13, 3, 'Cluster']] },
  { id: 'm21', home: 'infinity', away: 'warz',     maps: [[13, 3, 'Strike'], [13, 1, 'Backlot']] },
  { id: 'm22', home: 'nosweat',  away: 'bravo',    maps: [[25, 23, 'Crash'], [13, 11, 'Citystreets']] },
  { id: 'm23', home: 'sag',      away: 'myquest',  maps: [[16, 12, 'Crash'], [9, 13, 'Crossfire'], [1, 13, 'Citystreets']] },
  { id: 'm24', home: 'adhd',     away: 'deox',     maps: [[13, 10, 'Cluster'], [11, 13, 'Backlot'], [13, 12, 'Strike']] },
  { id: 'm25', home: 'sag',      away: 'revolt',   maps: [[11, 13, 'Backlot'], [7, 13, 'Strike']] },
  { id: 'm26', home: 'bravo',    away: 'warz',     maps: [[13, 5, 'Strike'], [13, 7, 'Backlot']] },
  { id: 'm27', home: 'warz',     away: 'bravo',    maps: [[7, 13, 'Crossfire'], [4, 13, 'Citystreets']] },
  { id: 'm28', home: 'alpha',    away: 'infinity', maps: [[13, 8, 'Cluster'], [13, 8, 'Strike']] },
  { id: 'm29', home: 'lafine',   away: 'cas1',     maps: [[13, 4, 'Backlot'], [16, 13, 'Strike']] },
  { id: 'm30', home: 'infinity', away: 'revolt',   maps: [[13, 6, 'Strike'], [13, 9, 'Backlot']] },
  { id: 'm31', home: 'myquest',  away: 'deox',     maps: [[13, 11, 'Crash'], [13, 7, 'Citystreets']] },
  { id: 'm32', home: 'nosweat',  away: 'myquest',  maps: [[5, 13, 'Strike'], [9, 13, 'Cluster']] },
  { id: 'm33', home: 'adhd',     away: 'bravo',    maps: [[13, 5, 'Cluster'], [13, 10, 'Backlot']] },
  { id: 'm34', home: 'sag',      away: 'alpha',    maps: [[4, 13, 'Crossfire'], [10, 13, 'Crash']] },
  { id: 'm35', home: 'infinity', away: 'myquest',  maps: [[3, 13, 'Strike'], [10, 13, 'Backlot']] },
  { id: 'm36', home: 'alpha',    away: 'revolt',   maps: [[9, 13, 'Backlot'], [13, 2, 'Cluster'], [13, 7, 'Strike']] },
  { id: 'm37', home: 'alpha',    away: 'lafine',   maps: [[13, 7, 'Strike'], [13, 4, 'Cluster']] },
  { id: 'm38', home: 'revolt',   away: 'lafine',   maps: [[13, 10, 'Crash'], [13, 9, 'Crossfire']] },
  { id: 'm39', home: 'deox',     away: 'revolt',   maps: [[10, 13, 'Cluster'], [8, 13, 'Backlot']] },
  { id: 'm40', home: 'revolt',   away: 'deox',     maps: [[13, 5, 'Citystreets'], [13, 11, 'Crossfire']] },
  { id: 'm41', home: 'cas1',     away: 'infinity', maps: [[3, 13, 'Strike'], [9, 13, 'Backlot']] },
  { id: 'm42', home: 'infinity', away: 'cas1',     maps: [[13, 7, 'Citystreets'], [13, 6, 'Crash']] },
  { id: 'm43', home: 'myquest',  away: 'nosweat',  maps: [[13, 11, 'Crossfire'], [13, 8, 'Crash']] },
  { id: 'm44', home: 'cas1',     away: 'warz',     maps: [[10, 13, 'Strike'], [10, 13, 'Backlot']] },
  { id: 'm45', home: 'myquest',  away: 'lafine',   maps: [[13, 7, 'Strike'], [13, 5, 'Backlot']] },
  { id: 'm46', home: 'myquest',  away: 'cas1',     maps: [[13, 0, 'Crash'], [13, 4, 'Citystreets']] },
  { id: 'm47', home: 'alpha',    away: 'deox',     maps: [[13, 7, 'Cluster'], [13, 7, 'Strike']] },
  { id: 'm48', home: 'deox',     away: 'alpha',    maps: [[10, 13, 'Crossfire'], [9, 13, 'Crash']] },
  { id: 'm49', home: 'infinity', away: 'sag',      maps: [[11, 13, 'Strike'], [16, 13, 'Backlot'], [13, 9, 'Cluster']] },
  { id: 'm50', home: 'warz',     away: 'adhd',     maps: [[6, 13, 'Crash'], [6, 13, 'Crossfire']] },
  { id: 'm51', home: 'nosweat',  away: 'sag',      maps: [[2, 13, 'Strike'], [9, 13, 'Cluster']] },
  { id: 'm52', home: 'cas1',     away: 'sag',      maps: [[7, 13, 'Strike'], [7, 13, 'Backlot']] },
  { id: 'm53', home: 'bravo',    away: 'infinity', maps: [[17, 19, 'Backlot'], [19, 17, 'Strike']] }
];


/* =========================================================================
   Scoreboard sources  <<< ADD NEW MATCHES HERE

   Every scoreboard is fetched at runtime straight from json/ - the files are
   never converted or duplicated into JavaScript.

   Paths are relative on purpose: GitHub Pages serves the site from
   username.github.io/repo-name/, where a leading slash would break. Paths are
   also case sensitive there, so each one must match the file on disk exactly -
   note the mixed case in CAS1, LAFINE, WrZ, myQuest and infeS.

   File names follow  <date>_<clan>_vs_<clan>_<map>.json  but that order is the
   scoreboard's, NOT home vs away: 20260920_CAS1_vs_infeS_citystreets.json and
   20260920_infeS_vs_CAS1_crash.json are two maps of the SAME match (m40). The
   league match a file belongs to therefore stays spelled out here.

   Listed in the order the maps were played, taken from each file's recordDate.

   To add a match: drop the file into json/ and add one line here. A new
   in-game spelling also needs an entry in PLAYER_ALIASES below.
   ========================================================================= */

const STATS_FILES = {
  /* m04 - deox vs infinity eSports, 3 Sep 2026 */
  'json/20260903_deox_vs_infeS_backlot-x.json':   ['m04', 'Backlot'],
  'json/20260903_infeS_vs_deox_strike.json':      ['m04', 'Strike'],
  'json/20260903_deox_vs_infeS_cluster.json':     ['m04', 'Cluster'],

  /* m13 - infinity eSports vs LAFINE Corp, 9 Sep 2026 */
  'json/20260909_LAFINE_vs_infeS_strike.json':    ['m13', 'Strike'],
  'json/20260909_infeS_vs_LAFINE_backlot-x.json': ['m13', 'Backlot'],
  'json/20260909_LAFINE_vs_infeS_cluster.json':   ['m13', 'Cluster'],

  /* m21 - infinity eSports vs W@rZ, 14 Sep 2026*/
  'json/20260914_infeS_vs_WrZ_strike.json':       ['m21', 'Strike'],
  'json/20260914_infeS_vs_WrZ_backlot-x.json':    ['m21', 'Backlot'],

  /* m28 - ARMY ALPHA vs infinity eSports, 15 Sep 2026*/
  'json/20260915_infeS_vs_ALPHA_cluster.json':    ['m28', 'Cluster'],
  'json/20260915_infeS_vs_ALPHA_strike.json':     ['m28', 'Strike'],

  /* m30 - infinity eSports vs Revolt, 16 Sep 2026*/
  'json/20260916_RL_vs_infeS_strike.json':        ['m30', 'Strike'],
  'json/20260916_RL_vs_infeS_backlot.json':       ['m30', 'Backlot'],

  /* m35 - infinity eSports vs myQuest, 17 Sep 2026 */
  'json/20260917_myQuest_vs_infeS_strike.json':   ['m35', 'Strike'],
  'json/20260917_myQuest_vs_infeS_backlot-x.json':['m35', 'Backlot'],

  /* m41 - CAS1 vs infinity eSports, 20 Sep 2026*/
  'json/20260920_CAS1_vs_infeS_strike.json':      ['m41', 'Strike'],
  'json/20260920_CAS1_vs_infeS_backlot-x.json':   ['m41', 'Backlot'],

  /* m42 - infinity eSports vs CAS1, 20 Sep 2026*/
  'json/20260920_CAS1_vs_infeS_citystreets.json': ['m42', 'Citystreets'],
  'json/20260920_infeS_vs_CAS1_crash.json':       ['m42', 'Crash'],

  /* m49 - infinity eSports vs SaG, 22 Sep 2026*/
  'json/20260922_SaG_vs_infeS_strike.json':       ['m49', 'Strike'],
  'json/20260922_infeS_vs_SaG_backlot-x.json':    ['m49', 'Backlot'],
  'json/20260922_SaG_vs_infeS_cluster.json':      ['m49', 'Cluster'],

  /* m53 - ARMY BRAVO vs infinity eSports, 24 Sep 2026*/
  'json/20260924_BRAVO_vs_infeS_backlot-x.json':  ['m53', 'Backlot'],
  'json/20260924_BRAVO_vs_infeS_strike.json':     ['m53', 'Strike']
};

/* In-game names (clan tag included) mapped onto roster names. Every entry here
   was verified by matching the scoreboard's score/kills/assists/deaths against
   PLAYER_STATS, except the two BOBiO lines, which were confirmed manually. */
const PLAYER_ALIASES = {
  'inf.eS TiPSY':    'TiPSY',
  '-o__/ TiPSY':     'TiPSY',
  'inf.eS paramore': 'paramore',
  'inf.eS NATHZN':   'NATHZN',
  'inf.eS Basham':   'Basham',
  'inf.eS Lodie':    'Levitate',
  'inf.eS NIGERian': 'EMPzY',
  "inf.eS b o ' AA": 'BOOBiO',
  'inf.eS BOBiO':    'BOOBiO'
};
