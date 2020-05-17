(function () {
  var template = Handlebars.template,
    templates = (Handlebars.templates = Handlebars.templates || {});
  templates['page'] = template(function (
    Handlebars,
    depth0,
    helpers,
    partials,
    data
  ) {
    this.compilerInfo = [4, '>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = '',
      stack1,
      functionType = 'function',
      escapeExpression = this.escapeExpression;

    buffer +=
      '\n\n<div>\n  <div id="stylebot-page-editor-header">\n    Edit the CSS for <b>';
    if ((stack1 = helpers.url)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.url;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer +=
      escapeExpression(stack1) +
      '</b>:</div>\n  </div>\n\n  <div id="stylebot-page-editor">\n  </div>\n\n  <div id="stylebot-page-live-preview">\n    <label>\n      <input type="checkbox" title="This may cause performance issues" class="stylebot-button" />\n      Live Preview Changes\n    </label>\n  </div>\n\n  <button class="stylebot-button" title="Copy to Clipboard" style="float:left !important; margin: 0px !important;" tabindex="0">\n    Copy\n  </button>\n\n  <div style="float: right !important; padding-right:15px !important;">\n    <button class="stylebot-button" style="margin: 0px !important; margin-right: 3px !important; float: none !important;" tabindex="0">\n      Save\n    </button>\n    <button class="stylebot-button" style="margin: 0px !important; float: none !important;" tabindex="0">\n      Cancel\n    </button>\n  </div>\n</div>\n';
    return buffer;
  });
})();
