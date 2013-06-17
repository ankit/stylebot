$(document).ready(function(e) {
  $('a').click(function(e) {
    if (e.target.href) {
      window.open(e.target.href);
    }
  })
});
