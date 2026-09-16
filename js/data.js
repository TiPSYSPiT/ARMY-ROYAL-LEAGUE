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
  updated: '2026-09-15',

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
    id: 'warz', name: 'W@rZ', cc: 'SK', flag: '\u{1F1F8}\u{1F1F0}',
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
   maps: [[homeRounds, awayRounds], ...]  -  Best of 3 */
const MATCHES = [
  { id: 'm01', home: 'alpha',    away: 'cas1',     maps: [[13, 2], [13, 2]] },
  { id: 'm02', home: 'adhd',     away: 'lafine',   maps: [[9, 13], [10, 13]] },
  { id: 'm03', home: 'deox',     away: 'nosweat',  maps: [[7, 13], [10, 13]] },
  { id: 'm04', home: 'deox',     away: 'infinity', maps: [[13, 11], [3, 13], [16, 6]] },
  { id: 'm05', home: 'alpha',    away: 'sag',      maps: [[13, 5], [13, 7]] },
  { id: 'm06', home: 'myquest',  away: 'warz',     maps: [[13, 2], [13, 3]] },
  { id: 'm07', home: 'bravo',    away: 'deox',     maps: [[13, 2], [13, 10]] },
  { id: 'm08', home: 'deox',     away: 'myquest',  maps: [[7, 13], [5, 13]] },
  { id: 'm09', home: 'bravo',    away: 'cas1',     maps: [[13, 2], [13, 3]] },
  { id: 'm10', home: 'cas1',     away: 'myquest',  maps: [[10, 13], [4, 13]] },
  { id: 'm11', home: 'lafine',   away: 'sag',      maps: [[7, 13], [10, 13]] },
  { id: 'm12', home: 'myquest',  away: 'sag',      maps: [[11, 13], [20, 22]] },
  { id: 'm13', home: 'infinity', away: 'lafine',   maps: [[13, 6], [11, 13], [13, 6]] },
  { id: 'm14', home: 'bravo',    away: 'nosweat',  maps: [[13, 10], [9, 13], [9, 13]] },
  { id: 'm15', home: 'deox',     away: 'bravo',    maps: [[7, 13], [11, 13]] },
  { id: 'm16', home: 'alpha',    away: 'nosweat',  maps: [[13, 11], [13, 3]] },
  { id: 'm17', home: 'lafine',   away: 'revolt',   maps: [[13, 5], [9, 13], [4, 13]] },
  { id: 'm18', home: 'alpha',    away: 'bravo',    maps: [[13, 7], [13, 4]] },
  { id: 'm19', home: 'adhd',     away: 'revolt',   maps: [[5, 13], [6, 13]] },
  { id: 'm20', home: 'adhd',     away: 'warz',     maps: [[13, 5], [13, 3]] },
  { id: 'm21', home: 'infinity', away: 'warz',     maps: [[13, 3], [13, 1]] },
  { id: 'm22', home: 'nosweat',  away: 'bravo',    maps: [[25, 23], [13, 11]] },
  { id: 'm23', home: 'sag',      away: 'myquest',  maps: [[16, 12], [9, 13], [1, 13]] },
  { id: 'm24', home: 'adhd',     away: 'deox',     maps: [[13, 10], [11, 13], [13, 12]] },
  { id: 'm25', home: 'sag',      away: 'revolt',   maps: [[11, 13], [7, 13]] },
  { id: 'm26', home: 'bravo',    away: 'warz',     maps: [[13, 5], [13, 7]] },
  { id: 'm27', home: 'warz',     away: 'bravo',    maps: [[7, 13], [4, 13]] },
  { id: 'm28', home: 'alpha',    away: 'infinity', maps: [[13, 8], [13, 8]] },
  { id: 'm29', home: 'lafine',   away: 'cas1',     maps: [[13, 4], [16, 13]] },
  { id: 'm30', home: 'infinity', away: 'revolt',   maps: [[13, 6], [13, 9]] }
];

/* =========================================================================
   Per-map player statistics

   Keyed by match id. `team` says whose players are listed, `maps` follows the
   same order as that match's `maps` array, so the map score can be looked up.
   Values: s = score, k = kills, a = assists, d = deaths.
   Matches without an entry here simply show no player stats.
   ========================================================================= */

const PLAYER_STATS = {
  m04: {
    team: 'infinity',
    maps: [
      {
        name: 'Backlot',
        players: [
          { n: 'TiPSY',    s: 135, k: 27, a: 0, d: 17 },
          { n: 'BOOBiO',   s:  89, k: 16, a: 1, d: 18 },
          { n: 'Levitate', s:  83, k: 16, a: 1, d: 19 },
          { n: 'NATHZN',   s:  75, k: 15, a: 0, d: 18 },
          { n: 'paramore', s:  41, k:  8, a: 1, d: 18 }
        ]
      },
      {
        name: 'Strike',
        players: [
          { n: 'NATHZN',   s: 104, k: 19, a: 3, d: 10 },
          { n: 'paramore', s: 103, k: 20, a: 1, d:  7 },
          { n: 'Levitate', s:  81, k: 15, a: 2, d:  7 },
          { n: 'TiPSY',    s:  79, k: 14, a: 2, d: 10 },
          { n: 'BOOBiO',   s:  34, k:  5, a: 1, d:  6 }
        ]
      },
      {
        name: 'Cluster',
        players: [
          { n: 'paramore', s: 100, k: 21, a: 0, d: 15 },
          { n: 'Levitate', s:  77, k: 13, a: 2, d: 15 },
          { n: 'BOOBiO',   s:  73, k: 14, a: 1, d: 16 },
          { n: 'TiPSY',    s:  60, k:  9, a: 3, d: 16 },
          { n: 'NATHZN',   s:  57, k:  9, a: 2, d: 17 }
        ]
      }
    ]
  },

  m13: {
    team: 'infinity',
    maps: [
      {
        name: 'Strike',
        players: [
          { n: 'NATHZN',   s: 118, k: 23, a: 1, d: 10 },
          { n: 'paramore', s:  95, k: 19, a: 0, d: 11 },
          { n: 'Basham',   s:  91, k: 17, a: 0, d:  9 },
          { n: 'TiPSY',    s:  74, k: 14, a: 2, d: 14 },
          { n: 'EMPzY',    s:  40, k:  8, a: 0, d: 14 }
        ]
      },
      {
        name: 'Backlot',
        players: [
          { n: 'NATHZN',   s: 148, k: 29, a: 0, d: 16 },
          { n: 'paramore', s: 110, k: 22, a: 0, d: 17 },
          { n: 'TiPSY',    s:  83, k: 16, a: 1, d: 19 },
          { n: 'EMPzY',    s:  46, k:  8, a: 2, d: 19 },
          { n: 'Basham',   s:  45, k:  9, a: 0, d: 16 }
        ]
      },
      {
        name: 'Cluster',
        players: [
          { n: 'paramore', s: 119, k: 22, a: 1, d: 10 },
          { n: 'Basham',   s: 117, k: 18, a: 3, d: 14 },
          { n: 'TiPSY',    s:  79, k: 14, a: 2, d: 12 },
          { n: 'NATHZN',   s:  65, k: 13, a: 0, d: 13 },
          { n: 'EMPzY',    s:  59, k: 10, a: 2, d: 15 }
        ]
      }
    ]
  },

  m21: {
    team: 'infinity',
    maps: [
      {
        name: 'Strike',
        players: [
          { n: 'Levitate', s: 105, k: 21, a: 0, d:  9 },
          { n: 'paramore', s:  94, k: 17, a: 2, d:  9 },
          { n: 'Basham',   s:  70, k: 14, a: 0, d:  6 },
          { n: 'TiPSY',    s:  66, k: 12, a: 1, d: 12 },
          { n: 'EMPzY',    s:  51, k:  9, a: 1, d:  4 }
        ]
      },
      {
        name: 'Backlot',
        players: [
          { n: 'paramore', s:  35, k:  7, a: 0, d:  3 },
          { n: 'Levitate', s:  30, k:  6, a: 0, d:  2 },
          { n: 'Basham',   s:  29, k:  4, a: 3, d:  2 },
          { n: 'EMPzY',    s:  28, k:  5, a: 1, d:  2 },
          { n: 'TiPSY',    s:  28, k:  5, a: 1, d:  5 }
        ]
      }
    ]
  },

  m28: {
    team: 'infinity',
    maps: [
      {
        name: 'Cluster',
        players: [
          { n: 'Levitate', s: 124, k: 23, a: 0, d: 16 },
          { n: 'BOOBiO',   s:  84, k: 15, a: 3, d: 18 },
          { n: 'Basham',   s:  82, k: 14, a: 2, d: 15 },
          { n: 'TiPSY',    s:  55, k: 11, a: 0, d: 16 },
          { n: 'EMPzY',    s:  25, k:  5, a: 0, d: 19 }
        ]
      },
      {
        name: 'Strike',
        players: [
          { n: 'Basham',   s: 103, k: 20, a: 0, d: 18 },
          { n: 'Levitate', s:  89, k: 16, a: 3, d: 15 },
          { n: 'TiPSY',    s:  73, k: 14, a: 1, d: 18 },
          { n: 'BOOBiO',   s:  64, k: 11, a: 2, d: 17 },
          { n: 'EMPzY',    s:  50, k: 10, a: 0, d: 18 }
        ]
      }
    ]
  },

  m30: {
    team: 'infinity',
    maps: [
      {
        name: 'Backlot',
        players: [
          { n: 'NATHZN',   s: 120, k: 21, a: 3, d: 14 },
          { n: 'Basham',   s: 112, k: 20, a: 1, d: 12 },
          { n: 'EMPzY',    s:  83, k: 16, a: 0, d: 17 },
          { n: 'Levitate', s:  75, k: 15, a: 0, d: 17 },
          { n: 'paramore', s:  71, k: 13, a: 2, d: 16 }
        ]
      },
      {
        name: 'Strike',
        players: [
          { n: 'Basham',   s: 101, k: 19, a: 2, d:  9 },
          { n: 'NATHZN',   s:  98, k: 19, a: 1, d: 15 },
          { n: 'paramore', s:  93, k: 19, a: 0, d: 10 },
          { n: 'EMPzY',    s:  59, k: 10, a: 0, d: 12 },
          { n: 'Levitate', s:  50, k: 10, a: 0, d: 15 }
        ]
      }
    ]
  }
};
