/* =========================================================================
   ARMY ROYAL LEAGUE - single team page

   Reads the slug from ?team=... and renders the very same markup the league
   page shows in its popup, via ARL.teamDetailHTML().

   The team is addressed by query parameter, which leaves the hash free for
   section anchors: team.html?team=infinity-esports#playerstats
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

  /* ---------------------------------------------------- Section anchors */

  /* Keeps path and query, swaps only the fragment - works under a GitHub Pages
     sub-path just as well as on file://. */
  function sectionURL(id) {
    return new URL('#' + id, location.href).href;
  }

  function flash(btn, text) {
    var old = btn.parentNode.querySelector('.anchor-msg');
    if (old) old.parentNode.removeChild(old);

    var msg = document.createElement('span');
    msg.className = 'anchor-msg';
    msg.textContent = text;
    btn.parentNode.insertBefore(msg, btn.nextSibling);

    setTimeout(function () {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 2000);
  }

  function wireAnchors() {
    C.$$('#teamContent .anchor-link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var url = sectionURL(btn.getAttribute('data-anchor'));
        C.copyText(url).then(
          function () { flash(btn, 'Link copied'); },
          function () { flash(btn, url); }   /* clipboard denied: show it instead */
        );
      });
    });
  }

  /* The sections only exist once the scoreboards have arrived, so the browser's
     own jump at load time finds nothing. This repeats it afterwards. Only the
     headings carrying .has-anchor count, so a stray #abc is simply ignored and
     the page stays at the top. */
  function jumpToAnchor() {
    var id = (location.hash || '').replace(/^#/, '');
    if (!id) return;

    try { id = decodeURIComponent(id); } catch (e) { return; }

    var el = document.getElementById(id);
    if (!el || !el.classList.contains('has-anchor')) return;

    /* 'instant' overrides the stylesheet's global scroll-behavior: smooth -
       a deep link should land at once, and the long animation it would
       otherwise run can be cancelled halfway by any stray scroll. */
    requestAnimationFrame(function () {
      el.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }

  function render(team) {
    document.title = team.name + ' — ARMY ROYAL LEAGUE';
    C.setHTML('#teamContent', C.teamDetailHTML(team.id, true));
    wireAnchors();
    jumpToAnchor();
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

    /* someone editing the fragment by hand after the page is up */
    window.addEventListener('hashchange', jumpToAnchor);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
