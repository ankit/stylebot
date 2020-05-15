(function () {
  var template = Handlebars.template,
    templates = (Handlebars.templates = Handlebars.templates || {});
  templates['style'] = template(function (
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
      escapeExpression = this.escapeExpression,
      self = this;

    function program1(depth0, data) {
      return '\n          <span class="style-featured">featured</span>\n        ';
    }

    function program3(depth0, data) {
      return '\n          <span class="style-installed">installed</span>\n        ';
    }

    function program5(depth0, data) {
      return '\n          <span class="hide style-installed">installed</span>\n        ';
    }

    buffer += '<li class="style-item"\n    role="presentation"\n    data-url="';
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
      '"\n    data-placement="bottom"\n    data-title="';
    if ((stack1 = helpers.title)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.title;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer += escapeExpression(stack1) + '"\n    data-desc="';
    if ((stack1 = helpers.description)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.description;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer += escapeExpression(stack1) + '"\n    data-id="';
    if ((stack1 = helpers.id)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.id;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer += escapeExpression(stack1) + '"\n    data-author="';
    if ((stack1 = helpers.username)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.username;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer += escapeExpression(stack1) + '"\n    data-favcount="';
    if ((stack1 = helpers.favorites)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.favorites;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer += escapeExpression(stack1) + '"\n    data-timeago="';
    if ((stack1 = helpers.timeAgo)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.timeAgo;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer += escapeExpression(stack1) + '"\n    data-timestamp="';
    if ((stack1 = helpers.timestamp)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.timestamp;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer +=
      escapeExpression(stack1) +
      '">\n\n  <div role="menuitem" tabindex="-1" href="#">\n    ';
    if ((stack1 = helpers.shortTitle)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.shortTitle;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer +=
      escapeExpression(stack1) +
      '\n    <span class="style-meta">\n      <a class="style-link" href="';
    if ((stack1 = helpers.styleLink)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.styleLink;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer +=
      escapeExpression(stack1) +
      '">link</a>\n      by <a class="style-author" href="';
    if ((stack1 = helpers.usernameLink)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.usernameLink;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer += escapeExpression(stack1) + '">';
    if ((stack1 = helpers.username)) {
      stack1 = stack1.call(depth0, { hash: {}, data: data });
    } else {
      stack1 = depth0 && depth0.username;
      stack1 =
        typeof stack1 === functionType
          ? stack1.call(depth0, { hash: {}, data: data })
          : stack1;
    }
    buffer +=
      escapeExpression(stack1) +
      '</a>\n\n      <span class="pull-right">\n        ';
    stack1 = helpers['if'].call(depth0, depth0 && depth0.featured, {
      hash: {},
      inverse: self.noop,
      fn: self.program(1, program1, data),
      data: data,
    });
    if (stack1 || stack1 === 0) {
      buffer += stack1;
    }
    buffer += '\n\n        ';
    stack1 = helpers['if'].call(depth0, depth0 && depth0.installed, {
      hash: {},
      inverse: self.program(5, program5, data),
      fn: self.program(3, program3, data),
      data: data,
    });
    if (stack1 || stack1 === 0) {
      buffer += stack1;
    }
    buffer += '\n      </span>\n\n    </span>\n  </div>\n\n</li>\n';
    return buffer;
  });
})();
