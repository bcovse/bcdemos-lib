function loadTopNav(el) {
  var html = '';
  for (var key in _cfg.navigation) {
    html += '<li><a href="#"  onclick="' + _cfg.navigation[key].link + '"><span>' + _cfg.navigation[key].text + '</span></a></li>'
  }
  el.html(html);
}

function loadHomeNav(el) {
  var html, css, colsPerRow = 3, w = 12/colsPerRow;
  var i = 1;
  html = '<div class="row hp-row">';
  for (var key in _cfg.navigation) {
    if (i%2 == 1) {
      css = ' panel-left';
    }
    else {
      css = ' panel-right'
    }
    var style = ' style="background-image: url(' + _cfg.navigation[key].img + ')"';
    html += '<div class="col-sm-' + w + '">';
    html += '<div class="hp-panel"' + style + ' onclick="' + _cfg.navigation[key].link + '"><span>' + _cfg.navigation[key].text + '</span></div>';
    html += '</div>';
    if (i%colsPerRow == 0) {
      html += '</div><div class="row hp-row">'
    }
    i++;
  }
  html += "</div>";
  console.log(html)
  el.html(html);
}