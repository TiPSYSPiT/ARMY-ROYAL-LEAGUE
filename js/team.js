/* =========================================================================
   ARMY ROYAL LEAGUE - single team page

   Reads the slug from ?team=... and renders the very same markup the league
   page shows in its popup, via ARL.teamDetailHTML().
   ========================================================================= */

(function () {
  'use strict';

  var C = ARL;

  function paramTeam() {
    var params = new URLSearchParams(location.search);
    return (params.get('team') || '').trim();
  }

  function notFound(slug) {
    document.title = 'Team not found — ARMY ROYAL LEAGUE';

    var known = C.teamsAlphabetical().map(function (t) {
      return '<li><a href="' + C.esc(C.teamPageURL(t)) + '">' + C.esc(t.name) + '</a></li>';
    }).join('');

    C.setHTML('#teamContent',
      '<div class="not-found">' +
        '<h2>Team not found</h2>' +
        '<p>' + (slug
          ? 'There is no team with the slug <code>' + C.esc(slug) + '</code>.'
          : 'No team was given in the address.') + '</p>' +
        '<p class="nf-hint">Pick one of the twelve teams:</p>' +
        '<ul class="nf-list">' + known + '</ul>' +
        '<p><a class="btn btn-ghost" href="index.html">Back to the league</a></p>' +
      '</div>');
  }

  function render(team) {
    document.title = team.name + ' — ARMY ROYAL LEAGUE';
    C.setHTML('#teamContent', C.teamDetailHTML(team.id));
  }

  function init() {
    C.initTheme();
    C.renderHeader();

    var slug = paramTeam();
    var team = slug ? C.teamBySlug(slug) : null;

    /* An unknown slug needs no scoreboards, so that answer is immediate. */
    if (!team) {
      notFound(slug);
      return;
    }

    document.title = team.name + ' — ARMY ROYAL LEAGUE';
    C.loadScoreboards().then(function () { render(team); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
