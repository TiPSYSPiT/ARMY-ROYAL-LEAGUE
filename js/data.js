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
  updated: '2026-09-14'
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

/* maps: [[homeRounds, awayRounds], ...]  -  Best of 3 */
const MATCHES = [
  { id: 'm01', home: 'alpha',    away: 'cas1',     maps: [[13, 2], [13, 2]] },
  { id: 'm02', home: 'lafine',   away: 'adhd',     maps: [[13, 9], [13, 10]] },
  { id: 'm03', home: 'nosweat',  away: 'deox',     maps: [[13, 7], [13, 10]] },
  { id: 'm04', home: 'deox',     away: 'infinity', maps: [[13, 11], [3, 13], [16, 6]] },
  { id: 'm05', home: 'alpha',    away: 'sag',      maps: [[13, 5], [13, 7]] },
  { id: 'm06', home: 'myquest',  away: 'warz',     maps: [[13, 2], [13, 3]] },
  { id: 'm07', home: 'bravo',    away: 'deox',     maps: [[13, 2], [13, 10]] },
  { id: 'm08', home: 'myquest',  away: 'deox',     maps: [[13, 7], [13, 5]] },
  { id: 'm09', home: 'bravo',    away: 'cas1',     maps: [[13, 2], [13, 3]] },
  { id: 'm10', home: 'myquest',  away: 'cas1',     maps: [[13, 10], [13, 4]] },
  { id: 'm11', home: 'sag',      away: 'lafine',   maps: [[13, 7], [13, 10]] },
  { id: 'm12', home: 'sag',      away: 'myquest',  maps: [[13, 11], [22, 20]] },
  { id: 'm13', home: 'infinity', away: 'lafine',   maps: [[13, 6], [11, 13], [13, 6]] },
  { id: 'm14', home: 'nosweat',  away: 'bravo',    maps: [[10, 13], [13, 9], [13, 9]] },
  { id: 'm15', home: 'bravo',  away: 'deox',    maps: [[13, 7], [13, 11]] },
  { id: 'm16', home: 'alpha',  away: 'nosweat',    maps: [[13, 11], [13, 3]] },
  { id: 'm17', home: 'revolt',  away: 'lafine',    maps: [[5, 13], [13, 9], [13, 4]] },
  { id: 'm18', home: 'alpha',  away: 'bravo',    maps: [[13, 7], [13, 4]] },
  { id: 'm19', home: 'revolt',  away: 'adhd',    maps: [[13, 5], [13, 6]] }
];