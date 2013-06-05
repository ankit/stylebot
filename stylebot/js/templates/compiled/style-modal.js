(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['style-modal'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  stack1 = depth0.global;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(4, program4, data),fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return "\n            Edit the Global Stylesheet:\n        ";}

function program4(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n            URL: <input type='text' value=\"";
  foundHelper = helpers.url;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"></input>\n        ";
  return buffer;}

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  stack1 = depth0['export'];
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(9, program9, data),fn:self.program(7, program7, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;}
function program7(depth0,data) {
  
  
  return "\n            Copy and paste the following into a text file:\n        ";}

function program9(depth0,data) {
  
  
  return "\n            Paste previously exported styles: <br>\n            <span class='note'>Note</span>: Existing styles for similar URLs will be overwritten.\n        ";}

function program11(depth0,data) {
  
  
  return "\n    <div id=\"editor\"></div>\n  ";}

function program13(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n    <textarea class=\"stylebot-css-code\">";
  foundHelper = helpers.code;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.code; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</textarea>\n  ";
  return buffer;}

function program15(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  stack1 = depth0.add;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(18, program18, data),fn:self.program(16, program16, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;}
function program16(depth0,data) {
  
  
  return "\n            <button class=\"add-style\">Add</button>\n        ";}

function program18(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n            <button ";
  stack1 = depth0.global;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(21, program21, data),fn:self.program(19, program19, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">Save</button>\n        ";
  return buffer;}
function program19(depth0,data) {
  
  
  return "class=\"edit-global\"";}

function program21(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "data-original-url=\"";
  foundHelper = helpers.url;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" class=\"edit-style\"";
  return buffer;}

function program23(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  stack1 = depth0['export'];
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(26, program26, data),fn:self.program(24, program24, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;}
function program24(depth0,data) {
  
  
  return "\n            <button class=\"copy-to-clipboard\">Copy to Clipboard</button>\n        ";}

function program26(depth0,data) {
  
  
  return "\n            <button class=\"import\">Import</button>\n        ";}

  buffer += "<div class=\"modal-content\">\n  <div class=\"modal-header\">\n    ";
  stack1 = depth0.editor;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(6, program6, data),fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n\n  ";
  stack1 = depth0.editor;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(13, program13, data),fn:self.program(11, program11, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n  <div class=\"modal-footer\">\n    ";
  stack1 = depth0.editor;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(23, program23, data),fn:self.program(15, program15, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    <button class=\"cancel\">Cancel</button>\n  </div>\n</div>\n";
  return buffer;});
})();
