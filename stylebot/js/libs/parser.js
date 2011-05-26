/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   emk <VYV03354@nifty.ne.jp>
 *   Daniel Glazman <glazman@netscape.com>
 *   L. David Baron <dbaron@dbaron.org>
 *   Boris Zbarsky <bzbarsky@mit.edu>
 *   Mats Palmgren <mats.palmgren@bredband.net>
 *   Christian Biesinger <cbiesinger@web.de>
 *   Jeff Walden <jwalden+code@mit.edu>
 *   Jonathon Jongsma <jonathon.jongsma@collabora.co.uk>, Collabora Ltd.
 *   Siraj Razick <siraj.razick@collabora.co.uk>, Collabora Ltd.
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var CSS_ESCAPE  = '\\';

var IS_HEX_DIGIT  = 1;
var START_IDENT   = 2;
var IS_IDENT      = 4;
var IS_WHITESPACE = 8;

var W   = IS_WHITESPACE;
var I   = IS_IDENT;
var S   =          START_IDENT;
var SI  = IS_IDENT|START_IDENT;
var XI  = IS_IDENT            |IS_HEX_DIGIT;
var XSI = IS_IDENT|START_IDENT|IS_HEX_DIGIT;

function CSSScanner(aString)
{
  this.init(aString);
}

CSSScanner.prototype = {

  kLexTable: [
  //                                     TAB LF      FF  CR
     0,  0,  0,  0,  0,  0,  0,  0,  0,  W,  W,  0,  W,  W,  0,  0,
  //
     0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  // SPC !   "   #   $   %   &   '   (   )   *   +   ,   -   .   /
     W,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  I,  0,  0,
  // 0   1   2   3   4   5   6   7   8   9   :   ;   <   =   >   ?
     XI, XI, XI, XI, XI, XI, XI, XI, XI, XI, 0,  0,  0,  0,  0,  0,
  // @   A   B   C   D   E   F   G   H   I   J   K   L   M   N   O
     0,  XSI,XSI,XSI,XSI,XSI,XSI,SI, SI, SI, SI, SI, SI, SI, SI, SI,
  // P   Q   R   S   T   U   V   W   X   Y   Z   [   \   ]   ^   _
     SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, 0,  S,  0,  0,  SI,
  // `   a   b   c   d   e   f   g   h   i   j   k   l   m   n   o
     0,  XSI,XSI,XSI,XSI,XSI,XSI,SI, SI, SI, SI, SI, SI, SI, SI, SI,
  // p   q   r   s   t   u   v   w   x   y   z   {   |   }   ~
     SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, 0,  0,  0,  0,  0,
  //
     0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  //
     0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  //     Â¡   Â¢   Â£   Â¤   Â¥   Â¦   Â§   Â¨   Â©   Âª   Â«   Â¬   Â­   Â®   Â¯
     0,  SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI,
  // Â°   Â±   Â²   Â³   Â´   Âµ   Â¶   Â·   Â¸   Â¹   Âº   Â»   Â¼   Â½   Â¾   Â¿
     SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI,
  // Ã€   Ã   Ã‚   Ãƒ   Ã„   Ã…   Ã†   Ã‡   Ãˆ   Ã‰   ÃŠ   Ã‹   ÃŒ   Ã   ÃŽ   Ã
     SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI,
  // Ã   Ã‘   Ã’   Ã“   Ã”   Ã•   Ã–   Ã—   Ã˜   Ã™   Ãš   Ã›   Ãœ   Ã   Ãž   ÃŸ
     SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI,
  // Ã    Ã¡   Ã¢   Ã£   Ã¤   Ã¥   Ã¦   Ã§   Ã¨   Ã©   Ãª   Ã«   Ã¬   Ã­   Ã®   Ã¯
     SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI,
  // Ã°   Ã±   Ã²   Ã³   Ã´   Ãµ   Ã¶   Ã·   Ã¸   Ã¹   Ãº   Ã»   Ã¼   Ã½   Ã¾   Ã¿
     SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI
  ],

  kHexValues: {
    "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    "a": 10, "b": 11, "c": 12, "d": 13, "e": 14, "f": 15
  },

  mString : "",
  mPos : 0,
  mPreservedPos : [],
  mCurrentLine: 0,

  init: function(aString) {
    this.mString = aString;
    this.mPos = 0;
    this.mPreservedPos = [];
  },

  getCurrentPos: function() {
    return this.mPos;
  },
  
  getAlreadyScanned: function()
  {
    return this.mString.substr(0, this.mPos);
  },

  preserveState: function() {
    this.mPreservedPos.push(this.mPos);
  },

  restoreState: function() {
    if (this.mPreservedPos.length) {
      this.mPos = this.mPreservedPos.pop();
    }
  },

  forgetState: function() {
    if (this.mPreservedPos.length) {
      this.mPreservedPos.pop();
    }
  },

  read: function() {
    if (this.mPos < this.mString.length)
      return this.mString.charAt(this.mPos++);
    return -1;
  },

  peek: function() {
    if (this.mPos < this.mString.length)
      return this.mString.charAt(this.mPos);
    return -1;
  },

  isHexDigit: function(c) {
    var code = c.charCodeAt(0);
    return (code < 256 && (this.kLexTable[code] & IS_HEX_DIGIT) != 0);
  },

  isIdentStart: function(c) {
    var code = c.charCodeAt(0);
    return (code >= 256 || (this.kLexTable[code] & START_IDENT) != 0);
  },

  startsWithIdent: function(aFirstChar, aSecondChar) {
    var code = aFirstChar.charCodeAt(0);
    return this.isIdentStart(aFirstChar) ||
           (aFirstChar == "-" && this.isIdentStart(aSecondChar));
  },

  isIdent: function(c) {
    var code = c.charCodeAt(0);
    return (code >= 256 || (this.kLexTable[code] & IS_IDENT) != 0);
  },

  pushback: function() {
    this.mPos--;
  },

  nextHexValue: function() {
    var c = this.read();
    if (c == -1 || !this.isHexDigit(c))
      return new jscsspToken(jscsspToken.NULL_TYPE, null);
    var s = c;
    c = this.read();
    while (c != -1 && this.isHexDigit(c)) {
      s += c;
      c = this.read();
    }
    if (c != -1)
      this.pushback();
    return new jscsspToken(jscsspToken.HEX_TYPE, s);
  },

  gatherEscape: function() {
    var c = this.peek();
    if (c == -1)
      return "";
    if (this.isHexDigit(c)) {
      var code = 0;
      for (var i = 0; i < 6; i++) {
        c = this.read();
        if (this.isHexDigit(c))
          code = code * 16 + this.kHexValues[c.toLowerCase()];
        else if (!this.isHexDigit(c) && !this.isWhiteSpace(c)) {
          this.pushback();
          break;
        }
        else
          break;
      }
      if (i == 6) {
        c = this.peek();
        if (this.isWhiteSpace(c))
          this.read();
      }
      return String.fromCharCode(code);
    }
    c = this.read();
    if (c != "\n")
      return c;
    return "";
  },

  gatherIdent: function(c) {
    var s = "";
    if (c == CSS_ESCAPE)
      s += this.gatherEscape();
    else
      s += c;
    c = this.read();
    while (c != -1
           && (this.isIdent(c) || c == CSS_ESCAPE)) {
      if (c == CSS_ESCAPE)
        s += this.gatherEscape();
      else
        s += c;
      c = this.read();
    }
    if (c != -1)
      this.pushback();
    return s;
  },

  parseIdent: function(c) {
    var value = this.gatherIdent(c);
    var nextChar = this.peek();
    if (nextChar == "(") {
      value += this.read();
      return new jscsspToken(jscsspToken.FUNCTION_TYPE, value);
    }
    return new jscsspToken(jscsspToken.IDENT_TYPE, value);
  },

  isDigit: function(c) {
    return (c >= '0') && (c <= '9');
  },

  parseComment: function(c) {
    var s = c;
    while ((c = this.read()) != -1) {
      s += c;
      if (c == "*") {
        c = this.read();
        if (c == -1)
          break;
        if (c == "/") {
          s += c;
          break;
        }
        this.pushback();
      }
    }
    return new jscsspToken(jscsspToken.COMMENT_TYPE, s);
  },

  parseNumber: function(c) {
    var s = c;
    var foundDot = false;
    while ((c = this.read()) != -1) {
      if (c == ".") {
        if (foundDot)
          break;
        else {
          s += c;
          foundDot = true;
        }
      } else if (this.isDigit(c))
        s += c;
      else
        break;
    }
    if (this.startsWithIdent(c, this.peek())) { // DIMENSION
      var unit = this.gatherIdent(c);
      s += unit;
      return new jscsspToken(jscsspToken.DIMENSION_TYPE, s, unit);
    }
    else if (c == "%") {
      s += "%";
      return new jscsspToken(jscsspToken.PERCENTAGE_TYPE, s);
    }
    else if (c != -1)
      this.pushback();
    return new jscsspToken(jscsspToken.NUMBER_TYPE, s);
  },

  parseString: function(aStop) {
    var s = aStop;
    var previousChar = aStop;
    var c;
    while ((c = this.read()) != -1) {
      if (c == aStop && previousChar != CSS_ESCAPE) {
        s += c;
        break;
      }
      else if (c == CSS_ESCAPE) {
        c = this.peek();
        if (c == -1)
          break;
        else if (c == "\n" || c == "\r" || c == "\f") {
          d = c;
          c = this.read();
          // special for Opera that preserves \r\n...
          if (d == "\r") {
            c = this.peek();
            if (c == "\n")
              c = this.read();
          }
        }
        else {
          s += this.gatherEscape();
          c = this.peek();
        }
      }
      else if (c == "\n" || c == "\r" || c == "\f") {
        break;
      }
      else
        s += c;

      previousChar = c;
    }
    return new jscsspToken(jscsspToken.STRING_TYPE, s);
  },

  isWhiteSpace: function(c) {
    var code = c.charCodeAt(0);
    return code < 256 && (this.kLexTable[code] & IS_WHITESPACE) != 0;
  },

  eatWhiteSpace: function(c) {
    var s = c;
    while ((c = this.read()) != -1) {
      if (!this.isWhiteSpace(c))
        break;
      s += c;
    }
    if (c != -1)
      this.pushback();
    return s;
  },

  parseAtKeyword: function(c) {
    return new jscsspToken(jscsspToken.ATRULE_TYPE, this.gatherIdent(c));
  },

  nextToken: function() {
    var c = this.read();
    if (c == -1)
      return new jscsspToken(jscsspToken.NULL_TYPE, null);

    if (this.startsWithIdent(c, this.peek()))
      return this.parseIdent(c);

    if (c == '@') {
      var nextChar = this.read();
      if (nextChar != -1) {
        var followingChar = this.peek();
        this.pushback();
        if (this.startsWithIdent(nextChar, followingChar))
          return this.parseAtKeyword(c);
      }
    }

    if (c == "." || c == "+" || c == "-") {
      var nextChar = this.peek();
      if (this.isDigit(nextChar))
        return this.parseNumber(c);
      else if (nextChar == "." && c != ".") {
        firstChar = this.read();
        var secondChar = this.peek();
        this.pushback();
        if (this.isDigit(secondChar))
          return this.parseNumber(c);
      }
    }
    if (this.isDigit(c)) {
      return this.parseNumber(c);
    }

    if (c == "'" || c == '"')
      return this.parseString(c);

    if (this.isWhiteSpace(c)) {
      var s = this.eatWhiteSpace(c);
      this.mCurrentLine += countChar(s);
      
      return new jscsspToken(jscsspToken.WHITESPACE_TYPE, s);
    }

    if (c == "|" || c == "~" || c == "^" || c == "$" || c == "*") {
      var nextChar = this.read();
      if (nextChar == "=") {
        switch (c) {
          case "~" :
            return new jscsspToken(jscsspToken.INCLUDES_TYPE, "~=");
          case "|" :
            return new jscsspToken(jscsspToken.DASHMATCH_TYPE, "|=");
          case "^" :
            return new jscsspToken(jscsspToken.BEGINSMATCH_TYPE, "^=");
          case "$" :
            return new jscsspToken(jscsspToken.ENDSMATCH_TYPE, "$=");
          case "*" :
            return new jscsspToken(jscsspToken.CONTAINSMATCH_TYPE, "*=");
          default :
            break;
        }
      } else if (nextChar != -1)
        this.pushback();
    }

    if (c == "/" && this.peek() == "*")
      return this.parseComment(c);

    return new jscsspToken(jscsspToken.SYMBOL_TYPE, c);
  }
};

function CSSParser(aString)
{
  this.mToken = null;
  this.mLookAhead = null;
  this.mScanner = new CSSScanner(aString);

  this.mPreserveWS = true;
  this.mPreserveComments = true;

  this.mPreservedTokens = [];
}

CSSParser.prototype = {
  kINHERIT: "inherit",

  kBORDER_WIDTH_NAMES: {
      "thin": true,
      "medium": true,
      "thick": true
  },

  kBORDER_STYLE_NAMES: {
    "none": true,
    "hidden": true,
    "dotted": true,
    "dashed": true,
    "solid": true,
    "double": true,
    "groove": true,
    "ridge": true,
    "inset": true,
    "outset": true
  },

  kCOLOR_NAMES: {
    "transparent": true,
  
    "black": true,
    "silver": true,
    "gray": true,
    "white": true,
    "maroon": true,
    "red": true,
    "purple": true,
    "fuchsia": true,
    "green": true,
    "lime": true,
    "olive": true,
    "yellow": true,
    "navy": true,
    "blue": true,
    "teal": true,
    "aqua": true,
    
    "aliceblue": true,
    "antiquewhite": true,
    "aqua": true,
    "aquamarine": true,
    "azure": true,
    "beige": true,
    "bisque": true,
    "black": true,
    "blanchedalmond": true,
    "blue": true,
    "blueviolet": true,
    "brown": true,
    "burlywood": true,
    "cadetblue": true,
    "chartreuse": true,
    "chocolate": true,
    "coral": true,
    "cornflowerblue": true,
    "cornsilk": true,
    "crimson": true,
    "cyan": true,
    "darkblue": true,
    "darkcyan": true,
    "darkgoldenrod": true,
    "darkgray": true,
    "darkgreen": true,
    "darkgrey": true,
    "darkkhaki": true,
    "darkmagenta": true,
    "darkolivegreen": true,
    "darkorange": true,
    "darkorchid": true,
    "darkred": true,
    "darksalmon": true,
    "darkseagreen": true,
    "darkslateblue": true,
    "darkslategray": true,
    "darkslategrey": true,
    "darkturquoise": true,
    "darkviolet": true,
    "deeppink": true,
    "deepskyblue": true,
    "dimgray": true,
    "dimgrey": true,
    "dodgerblue": true,
    "firebrick": true,
    "floralwhite": true,
    "forestgreen": true,
    "fuchsia": true,
    "gainsboro": true,
    "ghostwhite": true,
    "gold": true,
    "goldenrod": true,
    "gray": true,
    "green": true,
    "greenyellow": true,
    "grey": true,
    "honeydew": true,
    "hotpink": true,
    "indianred": true,
    "indigo": true,
    "ivory": true,
    "khaki": true,
    "lavender": true,
    "lavenderblush": true,
    "lawngreen": true,
    "lemonchiffon": true,
    "lightblue": true,
    "lightcoral": true,
    "lightcyan": true,
    "lightgoldenrodyellow": true,
    "lightgray": true,
    "lightgreen": true,
    "lightgrey": true,
    "lightpink": true,
    "lightsalmon": true,
    "lightseagreen": true,
    "lightskyblue": true,
    "lightslategray": true,
    "lightslategrey": true,
    "lightsteelblue": true,
    "lightyellow": true,
    "lime": true,
    "limegreen": true,
    "linen": true,
    "magenta": true,
    "maroon": true,
    "mediumaquamarine": true,
    "mediumblue": true,
    "mediumorchid": true,
    "mediumpurple": true,
    "mediumseagreen": true,
    "mediumslateblue": true,
    "mediumspringgreen": true,
    "mediumturquoise": true,
    "mediumvioletred": true,
    "midnightblue": true,
    "mintcream": true,
    "mistyrose": true,
    "moccasin": true,
    "navajowhite": true,
    "navy": true,
    "oldlace": true,
    "olive": true,
    "olivedrab": true,
    "orange": true,
    "orangered": true,
    "orchid": true,
    "palegoldenrod": true,
    "palegreen": true,
    "paleturquoise": true,
    "palevioletred": true,
    "papayawhip": true,
    "peachpuff": true,
    "peru": true,
    "pink": true,
    "plum": true,
    "powderblue": true,
    "purple": true,
    "red": true,
    "rosybrown": true,
    "royalblue": true,
    "saddlebrown": true,
    "salmon": true,
    "sandybrown": true,
    "seagreen": true,
    "seashell": true,
    "sienna": true,
    "silver": true,
    "skyblue": true,
    "slateblue": true,
    "slategray": true,
    "slategrey": true,
    "snow": true,
    "springgreen": true,
    "steelblue": true,
    "tan": true,
    "teal": true,
    "thistle": true,
    "tomato": true,
    "turquoise": true,
    "violet": true,
    "wheat": true,
    "white": true,
    "whitesmoke": true,
    "yellow": true,
    "yellowgreen": true,
  
    "activeborder": true,
    "activecaption": true,
    "appworkspace": true,
    "background": true,
    "buttonface": true,
    "buttonhighlight": true,
    "buttonshadow": true,
    "buttontext": true,
    "captiontext": true,
    "graytext": true,
    "highlight": true,
    "highlighttext": true,
    "inactiveborder": true,
    "inactivecaption": true,
    "inactivecaptiontext": true,
    "infobackground": true,
    "infotext": true,
    "menu": true,
    "menutext": true,
    "scrollbar": true,
    "threeddarkshadow": true,
    "threedface": true,
    "threedhighlight": true,
    "threedlightshadow": true,
    "threedshadow": true,
    "window": true,
    "windowframe": true,
    "windowtext": true
  },

  kLIST_STYLE_TYPE_NAMES: {
    "decimal": true,
    "decimal-leading-zero": true,
    "lower-roman": true,
    "upper-roman": true,
    "georgian": true,
    "armenian": true,
    "lower-latin": true,
    "lower-alpha": true,
    "upper-latin": true,
    "upper-alpha": true,
    "lower-greek": true,

    "disc": true,
    "circle": true,
    "square": true,
    "none": true,
    
    /* CSS 3 */
    "box": true,
    "check": true,
    "diamond": true,
    "hyphen": true,

    "lower-armenian": true,
    "cjk-ideographic": true,
    "ethiopic-numeric": true,
    "hebrew": true,
    "japanese-formal": true,
    "japanese-informal": true,
    "simp-chinese-formal": true,
    "simp-chinese-informal": true,
    "syriac": true,
    "tamil": true,
    "trad-chinese-formal": true,
    "trad-chinese-informal": true,
    "upper-armenian": true,
    "arabic-indic": true,
    "binary": true,
    "bengali": true,
    "cambodian": true,
    "khmer": true,
    "devanagari": true,
    "gujarati": true,
    "gurmukhi": true,
    "kannada": true,
    "lower-hexadecimal": true,
    "lao": true,
    "malayalam": true,
    "mongolian": true,
    "myanmar": true,
    "octal": true,
    "oriya": true,
    "persian": true,
    "urdu": true,
    "telugu": true,
    "tibetan": true,
    "upper-hexadecimal": true,
    "afar": true,
    "ethiopic-halehame-aa-et": true,
    "ethiopic-halehame-am-et": true,
    "amharic-abegede": true,
    "ehiopic-abegede-am-et": true,
    "cjk-earthly-branch": true,
    "cjk-heavenly-stem": true,
    "ethiopic": true,
    "ethiopic-abegede": true,
    "ethiopic-abegede-gez": true,
    "hangul-consonant": true,
    "hangul": true,
    "hiragana-iroha": true,
    "hiragana": true,
    "katakana-iroha": true,
    "katakana": true,
    "lower-norwegian": true,
    "oromo": true,
    "ethiopic-halehame-om-et": true,
    "sidama": true,
    "ethiopic-halehame-sid-et": true,
    "somali": true,
    "ethiopic-halehame-so-et": true,
    "tigre": true,
    "ethiopic-halehame-tig": true,
    "tigrinya-er-abegede": true,
    "ethiopic-abegede-ti-er": true,
    "tigrinya-et": true,
    "ethiopic-halehame-ti-et": true,
    "upper-greek": true,
    "asterisks": true,
    "footnotes": true,
    "circled-decimal": true,
    "circled-lower-latin": true,
    "circled-upper-latin": true,
    "dotted-decimal": true,
    "double-circled-decimal": true,
    "filled-circled-decimal": true,
    "parenthesised-decimal": true,
    "parenthesised-lower-latin": true
  },

  currentToken: function() {
    return this.mToken;
  },

  getHexValue: function() {
    this.mToken = this.mScanner.nextHexValue();
    return this.mToken;
  },

  getToken: function(aSkipWS, aSkipComment) {
    if (this.mLookAhead) {
      this.mToken = this.mLookAhead;
      this.mLookAhead = null;
      return this.mToken;
    }

    this.mToken = this.mScanner.nextToken();
    while (this.mToken &&
           ((aSkipWS && this.mToken.isWhiteSpace()) ||
            (aSkipComment && this.mToken.isComment())))
      this.mToken = this.mScanner.nextToken();
    return this.mToken;
  },

  lookAhead: function(aSkipWS, aSkipComment) {
    var preservedToken = this.mToken;
    this.mScanner.preserveState();
    var token = this.getToken(aSkipWS, aSkipComment);
    this.mScanner.restoreState();
    this.mToken = preservedToken;

    return token;
  },

  ungetToken: function() {
    this.mLookAhead = this.mToken;
  },
  
  addUnknownAtRule: function(aSheet, aString) {
    var currentLine = CountLF(this.mScanner.getAlreadyScanned());
    var blocks = [];
    var token = this.getToken(false, false);
    while (token.isNotNull())
    {
      aString += token.value;
      
      if (token.isSymbol(";") && !blocks.length)
        break;
      
      else if (token.isSymbol("{")
               || token.isSymbol("(")
               || token.isSymbol("[")
               || token.type == "function")
      {
        blocks.push(token.isFunction() ? "(" : token.value);
      }
      
      else if (token.isSymbol("}")
                 || token.isSymbol(")")
                 || token.isSymbol("]"))
      {
        if (blocks.length) {
          var ontop = blocks[blocks.length - 1];
          
          if ((token.isSymbol("}") && ontop == "{")
              || (token.isSymbol(")") && ontop == "(")
              || (token.isSymbol("]") && ontop == "["))
          {
            blocks.pop();
            
            if (!blocks.length && token.isSymbol("}"))
              break;
          }
        }
      }
      token = this.getToken(false, false);
    }

    this.addUnknownRule(aSheet, aString, currentLine);
  },

  addUnknownRule: function(aSheet, aString, aCurrentLine) {
    if (aCurrentLine === undefined) {
      aCurrentLine = CountLF(this.mScanner.getAlreadyScanned());
    }
    
    var rule = new jscsspErrorRule();
    rule.currentLine = aCurrentLine;
    rule.parsedCssText = aString;
    rule.parentStyleSheet = aSheet;
    aSheet.cssRules.push(rule);
  },

  addWhitespace: function(aSheet, aString) {
    var rule = new jscsspWhitespace();
    rule.parsedCssText = aString;
    rule.parentStyleSheet = aSheet;
    aSheet.cssRules.push(rule);
  },

  addComment: function(aSheet, aString) {
    var rule = new jscsspComment();
    rule.parsedCssText = aString;
    rule.parentStyleSheet = aSheet;
    aSheet.cssRules.push(rule);
  },

  parseCharsetRule: function(aToken, aSheet) {
    var s = aToken.value;
    var token = this.getToken(false, false);
    if (token.isWhiteSpace(" ")) {
      s += token.value;
      token = this.getToken(false, false);
      if (token.isString()) {
        s += token.value;
        var encoding = token.value;
        token = this.getToken(false, false);
        if (token.isSymbol(";")) {
          s += token.value;
          var rule = new jscsspCharsetRule();
          rule.encoding = encoding;
          rule.parsedCssText = s;
          rule.parentStyleSheet = aSheet;
          aSheet.cssRules.push(rule);
          return true;
        }
      }
    }

    this.addUnknownAtRule(aSheet, s);
    return false;
  },

  parseImportRule: function(aToken, aSheet) {
    var s = aToken.value;
    this.preserveState();
    var token = this.getToken(true, true);
    var media = [];
    var href = "";
    if (token.isString()) {
      href = token.value;
      s += " " + href;
    }
    else if (token.isFunction("url(")) {
      token = this.getToken(true, true);
      var urlContent = this.parseURL(token);
      if (urlContent) {
        href = "url(" + urlContent;
        s += " " + href;
      }
    }

    if (href) {
      token = this.getToken(true, true);
      while (token.isIdent()) {
        s += " " + token.value;
        media.push(token.value);
        token = this.getToken(true, true);
        if (!token)
          break;
        if (token.isSymbol(",")) {
          s += ",";
        } else if (token.isSymbol(";")) {
          break;
        } else
          break;
        token = this.getToken(true, true);
      }
  
      if (token.isSymbol(";") && href && media.length) {
        s += ";"
        this.forgetState();
        var rule = new jscsspImportRule();
        rule.parsedCssText = s;
        rule.href = href;
        rule.media = media;
        rule.parentStyleSheet = aSheet;
        aSheet.cssRules.push(rule);
        return true;
      }
    }
    this.restoreState();
    this.addUnknownAtRule(aSheet, "@import");
    return false;
  },

  parseVariablesRule: function(token, aSheet) {
    var s = token.value;
    var declarations = [];
    var valid = false;
    this.preserveState();
    token = this.getToken(true, true);
    var media = [];
    var foundMedia = false;
    while (token.isNotNull()) {
      if (token.isIdent()) {
        foundMedia = true;
        s += " " + token.value;
        media.push(token.value);
        token = this.getToken(true, true);
        if (token.isSymbol(",")) {
          s += ",";
        } else {
          if (token.isSymbol("{"))
            this.ungetToken();
          else {
            // error...
            token.type = jscsspToken.NULL_TYPE;
            break;
          }
        }
      } else if (token.isSymbol("{"))
        break;
      else if (foundMedia) {
        token.type = jscsspToken.NULL_TYPE;
        // not a media list
        break;
      }
      token = this.getToken(true, true);
    }

    if (token.isSymbol("{")) {
      s += " {";
      token = this.getToken(true, true);
      while (true) {
        if (!token.isNotNull()) {
          valid = true;
          break;
        }
        if (token.isSymbol("}")) {
          s += "}";
          valid = true;
          break;
        } else {
          var d = this.parseDeclaration(token, declarations, true, false, aSheet);
          s += ((d && declarations.length) ? " " : "") + d;
        }
        token = this.getToken(true, false);
      }
    }
    if (valid) {
      this.forgetState();
      var rule = new jscsspVariablesRule();
      rule.parsedCssText = s;
      rule.declarations = declarations;
      rule.media = media;
      rule.parentStyleSheet = aSheet;
      aSheet.cssRules.push(rule)
      return true;
    }
    this.restoreState();
    return false;
  },

  parseNamespaceRule: function(aToken, aSheet) {
    var s = aToken.value;
    var valid = false;
    this.preserveState();
    var token = this.getToken(true, true);
    if (token.isNotNull()) {
      var prefix = "";
      var url = "";
      if (token.isIdent()) {
        prefix = token.value;
        s += " " + prefix;
        token = this.getToken(true, true);
      }
      if (token) {
        var foundURL = false;
        if (token.isString()) {
          foundURL = true;
          url = token.value;
          s += " " + url;
        } else if (token.isFunction("url(")) {
          // get a url here...
          token = this.getToken(true, true);
          var urlContent = this.parseURL(token);
          if (urlContent) {
            url += "url(" + urlContent;
            foundURL = true;
            s += " " + urlContent;
          }
        }
      }
      if (foundURL) {
        token = this.getToken(true, true);
        if (token.isSymbol(";")) {
          s += ";";
          this.forgetState();
          var rule = new jscsspNamespaceRule();
          rule.parsedCssText = s;
          rule.prefix = prefix;
          rule.url = url;
          rule.parentStyleSheet = aSheet;
          aSheet.cssRules.push(rule);
          return true;
        }
      }

    }
    this.restoreState();
    this.addUnknownAtRule(aSheet, "@namespace");
    return false;
  },

  parseFontFaceRule: function(aToken, aSheet) {
    var s = aToken.value;
    var valid = false;
    var descriptors = [];
    this.preserveState();
    var token = this.getToken(true, true);
    if (token.isNotNull()) {
      // expecting block start
      if (token.isSymbol("{")) {
        s += " " + token.value;
        var token = this.getToken(true, false);
        while (true) {
          if (token.isSymbol("}")) {
            s += "}";
            valid = true;
            break;
          } else {
            var d = this.parseDeclaration(token, descriptors, false, false, aSheet);
            s += ((d && descriptors.length) ? " " : "") + d;
          }
          token = this.getToken(true, false);
        }
      }
    }
    if (valid) {
      this.forgetState();
      var rule = new jscsspFontFaceRule();
      rule.parsedCssText = s;
      rule.descriptors = descriptors;
      rule.parentStyleSheet = aSheet;
      aSheet.cssRules.push(rule)
      return true;
    }
    this.restoreState();
    return false;
  },

  parsePageRule: function(aToken, aSheet) {
    var s = aToken.value;
    var valid = false;
    var declarations = [];
    this.preserveState();
    var token = this.getToken(true, true);
    var pageSelector = "";
    if (token.isSymbol(":") || token.isIdent()) {
      if (token.isSymbol(":")) {
        pageSelector = ":";
        token = this.getToken(false, false);
      }
      if (token.isIdent()) {
        pageSelector += token.value;
        s += " " + pageSelector;
        token = this.getToken(true, true);
      }
    }
    if (token.isNotNull()) {
      // expecting block start
      if (token.isSymbol("{")) {
        s += " " + token.value;
        var token = this.getToken(true, false);
        while (true) {
          if (token.isSymbol("}")) {
            s += "}";
            valid = true;
            break;
          } else {
            var d = this.parseDeclaration(token, declarations, true, false, aSheet);
            s += ((d && declarations.length) ? " " : "") + d;
          }
          token = this.getToken(true, false);
        }
      }
    }
    if (valid) {
      this.forgetState();
      var rule = new jscsspPageRule();
      rule.parsedCssText = s;
      rule.pageSelector = pageSelector;
      rule.declarations = declarations;
      rule.parentStyleSheet = aSheet;
      aSheet.cssRules.push(rule)
      return true;
    }
    this.restoreState();
    return false;
  },

  parseDefaultPropertyValue: function(token, aDecl, aAcceptPriority, descriptor, aSheet) {
    var valueText = "";
    var blocks = [];
    var foundPriority = false;
    var values = [];
    while (token.isNotNull()) {

      if ((token.isSymbol(";")
           || token.isSymbol("}")
           || token.isSymbol("!"))
          && !blocks.length) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }
  
      if (token.isIdent(this.kINHERIT)) {
        if (values.length) {
          return "";
        }
        else {
          valueText = this.kINHERIT;
          var value = new jscsspVariable(kJscsspINHERIT_VALUE, aSheet);
          values.push(value);
          token = this.getToken(true, true);
          break;
        }
      }
      else if (token.isSymbol("{")
                 || token.isSymbol("(")
                 || token.isSymbol("[")) {
        blocks.push(token.value);
      }
      else if (token.isSymbol("}")
                 || token.isSymbol("]")) {
        if (blocks.length) {
          var ontop = blocks[blocks.length - 1];
          if ((token.isSymbol("}") && ontop == "{")
              || (token.isSymbol(")") && ontop == "(")
              || (token.isSymbol("]") && ontop == "[")) {
            blocks.pop();
          }
        }
      }
      // XXX must find a better way to store individual values
      // probably a |values: []| field holding dimensions, percentages
      // functions, idents, numbers and symbols, in that order.
      if (token.isFunction()) {
        if (token.isFunction("var(")) {
          token = this.getToken(true, true);
          if (token.isIdent()) {
            var name = token.value;
            token = this.getToken(true, true);
            if (token.isSymbol(")")) {
              var value = new jscsspVariable(kJscsspVARIABLE_VALUE, aSheet);
              valueText += "var(" + name + ")";
              value.name = name;
              values.push(value);
            }
            else
              return "";
          }
          else
            return "";
        }
        else {
          var fn = token.value;
          token = this.getToken(false, true);
          var arg = this.parseFunctionArgument(token);
          if (arg) {
            valueText += fn + arg;
            var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, aSheet);
            value.value = fn + arg;
            values.push(value);
          }
          else
            return "";
        }
      }
      else if (token.isSymbol("#")) {
        var color = this.parseColor(token);
        if (color) {
          valueText += color;
          var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, aSheet);
          value.value = color;
          values.push(value);
        }
        else
          return "";
      }
      else if (!token.isWhiteSpace() && !token.isSymbol(",")) {
        var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, aSheet);
        value.value = token.value;
        values.push(value);
        valueText += token.value;
      }
      else
        valueText += token.value;
      token = this.getToken(false, true);
    }
    if (values.length && valueText) {
      this.forgetState();
      aDecl.push(this._createJscsspDeclarationFromValuesArray(descriptor, values, valueText));
      return valueText;
    }
    return "";
  },

  parseMarginOrPaddingShorthand: function(token, aDecl, aAcceptPriority, aProperty)
  {
    var top = null;
    var bottom = null;
    var left = null;
    var right = null;

    var values = [];
    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!values.length && token.isIdent(this.kINHERIT)) {
        values.push(token.value);
        token = this.getToken(true, true);
        break;
      }

      else if (token.isDimension()
              || token.isNumber("0")
              || token.isPercentage()
              || token.isIdent("auto")) {
        values.push(token.value);
      }
      
      else {
        return "";
      }

      token = this.getToken(true, true);
    }

    var count = values.length;
    switch (count) {
      case 1:
        top = values[0];
        bottom = top;
        left = top;
        right = top;
        break;
      case 2:
        top = values[0];
        bottom = top;
        left = values[1];
        right = left;
        break;
      case 3:
        top = values[0];
        left = values[1];
        right = left;
        bottom = values[2];
        break;
      case 4:
        top = values[0];
        right = values[1];
        bottom = values[2];
        left = values[3];
        break;
      default:
        return "";
    }
    this.forgetState();
    aDecl.push(this._createJscsspDeclarationFromValue(aProperty + "-top", top));
    aDecl.push(this._createJscsspDeclarationFromValue(aProperty + "-right", right));
    aDecl.push(this._createJscsspDeclarationFromValue(aProperty + "-bottom", bottom));
    aDecl.push(this._createJscsspDeclarationFromValue(aProperty + "-left", left));
   return top + " " + right + " " + bottom + " " + left;
  },

  parseBorderColorShorthand: function(token, aDecl, aAcceptPriority)
  {
    var top = null;
    var bottom = null;
    var left = null;
    var right = null;

    var values = [];
    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!values.length && token.isIdent(this.kINHERIT)) {
        values.push(token.value);
        token = this.getToken(true, true);
        break;
      }
      
      else {
        var color = this.parseColor(token);
        if (color)
          values.push(color);
        else
          return "";
      }

      token = this.getToken(true, true);
    }

    var count = values.length;
    switch (count) {
      case 1:
        top = values[0];
        bottom = top;
        left = top;
        right = top;
        break;
      case 2:
        top = values[0];
        bottom = top;
        left = values[1];
        right = left;
        break;
      case 3:
        top = values[0];
        left = values[1];
        right = left;
        bottom = values[2];
        break;
      case 4:
        top = values[0];
        right = values[1];
        bottom = values[2];
        left = values[3];
        break;
      default:
        return "";
    }
    this.forgetState();
    aDecl.push(this._createJscsspDeclarationFromValue("border-top-color", top));
    aDecl.push(this._createJscsspDeclarationFromValue("border-right-color", right));
    aDecl.push(this._createJscsspDeclarationFromValue("border-bottom-color", bottom));
    aDecl.push(this._createJscsspDeclarationFromValue("border-left-color", left));
    return top + " " + right + " " + bottom + " " + left;
  },

  parseCueShorthand: function(token, declarations, aAcceptPriority)
  {
    var before = "";
    var after = "";

    var values = [];
    var values = [];
    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!values.length && token.isIdent(this.kINHERIT)) {
        values.push(token.value);
      }

      else if (token.isIdent("none"))
        values.push(token.value);

        else if (token.isFunction("url(")) {
        var token = this.getToken(true, true);
        var urlContent = this.parseURL(token);
        if (urlContent)
          values.push("url(" + urlContent);
        else
          return "";
      }
      else
        return "";

      token = this.getToken(true, true);
    }

    var count = values.length;
    switch (count) {
      case 1:
        before = values[0];
        after = before;
        break;
      case 2:
        before = values[0];
        after = values[1];
        break;
      default:
        return "";
    }
    this.forgetState();
    aDecl.push(this._createJscsspDeclarationFromValue("cue-before", before));
    aDecl.push(this._createJscsspDeclarationFromValue("cue-after", after));
    return before + " " + after;
  },

  parsePauseShorthand: function(token, declarations, aAcceptPriority)
  {
    var before = "";
    var after = "";

    var values = [];
    var values = [];
    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!values.length && token.isIdent(this.kINHERIT)) {
        values.push(token.value);
      }

      else if (token.isDimensionOfUnit("ms")
               || token.isDimensionOfUnit("s")
               || token.isPercentage()
               || token.isNumber("0"))
        values.push(token.value);
      else
        return "";

      token = this.getToken(true, true);
    }

    var count = values.length;
    switch (count) {
      case 1:
        before = values[0];
        after = before;
        break;
      case 2:
        before = values[0];
        after = values[1];
        break;
      default:
        return "";
    }
    this.forgetState();
    aDecl.push(this._createJscsspDeclarationFromValue("pause-before", before));
    aDecl.push(this._createJscsspDeclarationFromValue("pause-after", after));
    return before + " " + after;
  },

  parseBorderWidthShorthand: function(token, aDecl, aAcceptPriority)
  {
    var top = null;
    var bottom = null;
    var left = null;
    var right = null;

    var values = [];
    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!values.length && token.isIdent(this.kINHERIT)) {
        values.push(token.value);
      }
      
      else if (token.isDimension()
               || token.isNumber("0")
               || (token.isIdent() && token.value in this.kBORDER_WIDTH_NAMES)) {
        values.push(token.value);
      }
      else
        return "";

      token = this.getToken(true, true);
    }

    var count = values.length;
    switch (count) {
      case 1:
        top = values[0];
        bottom = top;
        left = top;
        right = top;
        break;
      case 2:
        top = values[0];
        bottom = top;
        left = values[1];
        right = left;
        break;
      case 3:
        top = values[0];
        left = values[1];
        right = left;
        bottom = values[2];
        break;
      case 4:
        top = values[0];
        right = values[1];
        bottom = values[2];
        left = values[3];
        break;
      default:
        return "";
    }
    this.forgetState();
    aDecl.push(this._createJscsspDeclarationFromValue("border-top-width", top));
    aDecl.push(this._createJscsspDeclarationFromValue("border-right-width", right));
    aDecl.push(this._createJscsspDeclarationFromValue("border-bottom-width", bottom));
    aDecl.push(this._createJscsspDeclarationFromValue("border-left-width", left));
    return top + " " + right + " " + bottom + " " + left;
  },

  parseBorderStyleShorthand: function(token, aDecl, aAcceptPriority)
  {
    var top = null;
    var bottom = null;
    var left = null;
    var right = null;

    var values = [];
    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!values.length && token.isIdent(this.kINHERIT)) {
        values.push(token.value);
      }
      
      else if (token.isIdent() && token.value in this.kBORDER_STYLE_NAMES) {
        values.push(token.value);
      }
      else
        return "";

      token = this.getToken(true, true);
    }

    var count = values.length;
    switch (count) {
      case 1:
        top = values[0];
        bottom = top;
        left = top;
        right = top;
        break;
      case 2:
        top = values[0];
        bottom = top;
        left = values[1];
        right = left;
        break;
      case 3:
        top = values[0];
        left = values[1];
        right = left;
        bottom = values[2];
        break;
      case 4:
        top = values[0];
        right = values[1];
        bottom = values[2];
        left = values[3];
        break;
      default:
        return "";
    }
    this.forgetState();
    aDecl.push(this._createJscsspDeclarationFromValue("border-top-style", top));
    aDecl.push(this._createJscsspDeclarationFromValue("border-right-style", right));
    aDecl.push(this._createJscsspDeclarationFromValue("border-bottom-style", bottom));
    aDecl.push(this._createJscsspDeclarationFromValue("border-left-style", left));
    return top + " " + right + " " + bottom + " " + left;
  },

  parseBorderEdgeOrOutlineShorthand: function(token, aDecl, aAcceptPriority, aProperty)
  {
    var bWidth = null;
    var bStyle = null;
    var bColor = null;

    while (true) {
      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!bWidth && !bStyle && !bColor
               && token.isIdent(this.kINHERIT)) {
        bWidth = this.kINHERIT;
        bStyle = this.kINHERIT;
        bColor = this.kINHERIT;
      }

      else if (!bWidth &&
               (token.isDimension()
                || (token.isIdent() && token.value in this.kBORDER_WIDTH_NAMES)
                || token.isNumber("0"))) {
        bWidth = token.value;
      }

      else if (!bStyle &&
               (token.isIdent() && token.value in this.kBORDER_STYLE_NAMES)) {
        bStyle = token.value;
      }

      else {
        var color = (aProperty == "outline" && token.isIdent("invert"))
                    ? "invert" : this.parseColor(token);
        if (!bColor && color)
          bColor = color;
        else
          return "";
      }
      token = this.getToken(true, true);
    }

    // create the declarations
    this.forgetState();
    bWidth = bWidth ? bWidth : "medium";
    bStyle = bStyle ? bStyle : "none";
    bColor = bColor ? bColor : "-moz-initial";

    function addPropertyToDecl(aSelf, aDecl, property, w, s, c) {
      aDecl.push(aSelf._createJscsspDeclarationFromValue(property + "-width", w));
      aDecl.push(aSelf._createJscsspDeclarationFromValue(property + "-style", s));
      aDecl.push(aSelf._createJscsspDeclarationFromValue(property + "-color", c));
    }

    if (aProperty == "border") {
      addPropertyToDecl(this, aDecl, "border-top", bWidth, bStyle, bColor);
      addPropertyToDecl(this, aDecl, "border-right", bWidth, bStyle, bColor);
      addPropertyToDecl(this, aDecl, "border-bottom", bWidth, bStyle, bColor);
      addPropertyToDecl(this, aDecl, "border-left", bWidth, bStyle, bColor);
    }
    else
      addPropertyToDecl(this, aDecl, aProperty, bWidth, bStyle, bColor);
    return bWidth + " " + bStyle + " " + bColor;
  },

  parseBackgroundShorthand: function(token, aDecl, aAcceptPriority)
  {
    var kHPos = {"left": true, "right": true };
    var kVPos = {"top": true, "bottom": true };
    var kPos = {"left": true, "right": true, "top": true, "bottom": true, "center": true};

    var bgColor = null;
    var bgRepeat = null;
    var bgAttachment = null;
    var bgImage = null;
    var bgPosition = null;

    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!bgColor && !bgRepeat && !bgAttachment && !bgImage && !bgPosition
               && token.isIdent(this.kINHERIT)) {
        bgColor = this.kINHERIT;
        bgRepeat = this.kINHERIT;
        bgAttachment = this.kINHERIT;
        bgImage = this.kINHERIT;
        bgPosition = this.kINHERIT;
      }

      else {
        if (!bgAttachment &&
            (token.isIdent("scroll")
             || token.isIdent("fixed"))) {
          bgAttachment = token.value;
        }

        else if (!bgPosition &&
                 ((token.isIdent() && token.value in kPos)
                  || token.isDimension()
                  || token.isNumber("0")
                  || token.isPercentage())) {
          bgPosition = token.value;
          token = this.getToken(true, true);
          if (token.isDimension() || token.isNumber("0") || token.isPercentage()) {
            bgPosition += " " + token.value;
          }
          else if (token.isIdent() && token.value in kPos) {
            if ((bgPosition in kHPos && token.value in kHPos) ||
                (bgPosition in kVPos && token.value in kVPos))
              return "";
            bgPosition += " " + token.value;
          }
          else {
            this.ungetToken();
            bgPosition += " center";
          }
        }

        else if (!bgRepeat &&
                 (token.isIdent("repeat")
                  || token.isIdent("repeat-x")
                  || token.isIdent("repeat-y")
                  || token.isIdent("no-repeat"))) {
          bgRepeat = token.value;
        }

        else if (!bgImage &&
                 (token.isFunction("url(")
                  || token.isIdent("none"))) {
          bgImage = token.value;
          if (token.isFunction("url(")) {
            token = this.getToken(true, true);
            var url = this.parseURL(token); // TODO
            if (url)
              bgImage += url;
            else
              return "";
          }
        }

        else {
          var color = this.parseColor(token);
          if (!bgColor && color)
            bgColor = color;
          else
            return "";
        }

      }

      token = this.getToken(true, true);
    }

    // create the declarations
    this.forgetState();
    bgColor = bgColor ? bgColor : "transparent";
    bgImage = bgImage ? bgImage : "none";
    bgRepeat = bgRepeat ? bgRepeat : "repeat";
    bgAttachment = bgAttachment ? bgAttachment : "scroll";
    bgPosition = bgPosition ? bgPosition : "top left";

    aDecl.push(this._createJscsspDeclarationFromValue("background-color", bgColor));
    aDecl.push(this._createJscsspDeclarationFromValue("background-image", bgImage));
    aDecl.push(this._createJscsspDeclarationFromValue("background-repeat", bgRepeat));
    aDecl.push(this._createJscsspDeclarationFromValue("background-attachment", bgAttachment));
    aDecl.push(this._createJscsspDeclarationFromValue("background-position", bgPosition));
    return bgColor + " " + bgImage + " " + bgRepeat + " " + bgAttachment + " " + bgPosition;
  },

  parseListStyleShorthand: function(token, aDecl, aAcceptPriority)
  {
    var kPosition = { "inside": true, "outside": true };

    var lType = null;
    var lPosition = null;
    var lImage = null;

    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!lType && !lPosition && ! lImage
               && token.isIdent(this.kINHERIT)) {
        lType = this.kINHERIT;
        lPosition = this.kINHERIT;
        lImage = this.kINHERIT;
      }

      else if (!lType &&
               (token.isIdent() && token.value in this.kLIST_STYLE_TYPE_NAMES)) {
        lType = token.value;
      }

      else if (!lPosition &&
               (token.isIdent() && token.value in kPosition)) {
        lPosition = token.value;
      }

      else if (!lImage && token.isFunction("url")) {
        token = this.getToken(true, true);
        var urlContent = this.parseURL(token);
        if (urlContent) {
          lImage = "url(" + urlContent;
        }
        else
          return "";
      }
      else if (!token.isIdent("none"))
        return "";

      token = this.getToken(true, true);
    }

    // create the declarations
    this.forgetState();
    lType = lType ? lType : "none";
    lImage = lImage ? lImage : "none";
    lPosition = lPosition ? lPosition : "outside";

    aDecl.push(this._createJscsspDeclarationFromValue("list-style-type", lType));
    aDecl.push(this._createJscsspDeclarationFromValue("list-style-position", lPosition));
    aDecl.push(this._createJscsspDeclarationFromValue("list-style-image", lImage));
    return lType + " " + lPosition + " " + lImage;
  },

  parseFontShorthand: function(token, aDecl, aAcceptPriority)
  {
    var kStyle = {"italic": true, "oblique": true };
    var kVariant = {"small-caps": true };
    var kWeight = { "bold": true, "bolder": true, "lighter": true,
                      "100": true, "200": true, "300": true, "400": true,
                      "500": true, "600": true, "700": true, "800": true,
                      "900": true };
    var kSize = { "xx-small": true, "x-small": true, "small": true, "medium": true,
                    "large": true, "x-large": true, "xx-large": true,
                    "larger": true, "smaller": true };
    var kValues = { "caption": true, "icon": true, "menu": true, "message-box": true, "small-caption": true, "status-bar": true };
    var kFamily = { "serif": true, "sans-serif": true, "cursive": true, "fantasy": true, "monospace": true };

    var fStyle = null;
    var fVariant = null;
    var fWeight = null;
    var fSize = null;
    var fLineHeight = null;
    var fFamily = "";
    var fSystem = null;
    var fFamilyValues = [];

    var normalCount = 0;
    while (true) {

      if (!token.isNotNull())
        break;

      if (token.isSymbol(";")
          || (aAcceptPriority && token.isSymbol("!"))
          || token.isSymbol("}")) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      }

      else if (!fStyle && !fVariant && !fWeight
               && !fSize && !fLineHeight && !fFamily
               && !fSystem
               && token.isIdent(this.kINHERIT)) {
        fStyle = this.kINHERIT;
        fVariant = this.kINHERIT;
        fWeight = this.kINHERIT;
        fSize = this.kINHERIT;
        fLineHeight = this.kINHERIT;
        fFamily = this.kINHERIT;
        fSystem = this.kINHERIT;
      }

      else {
        if (!fSystem && (token.isIdent() && token.value in kValues)) {
          fSystem = token.value;
          break;
        }

        else {
          if (!fStyle
                   && token.isIdent()
                   && (token.value in kStyle)) {
            fStyle = token.value;
          }
  
          else if (!fVariant
                   && token.isIdent()
                   && (token.value in kVariant)) {
            fVariant = token.value;
          }
  
          else if (!fWeight
                   && (token.isIdent() || token.isNumber())
                   && (token.value in kWeight)) {
            fWeight = token.value;
          }
  
          else if (!fSize
                   && ((token.isIdent() && (token.value in kSize))
                       || token.isDimension()
                       || token.isPercentage())) {
            fSize = token.value;
            var token = this.getToken(false, false);
            if (token.isSymbol("/")) {
              token = this.getToken(false, false);
              if (!fLineHeight &&
                  (token.isDimension() || token.isNumber() || token.isPercentage())) {
                fLineHeight = token.value;
              }
              else
                return "";
            }
            else
              this.ungetToken();
          }

          else if (token.isIdent("normal")) {
            normalCount++;
            if (normalCount > 3)
              return "";
          }

          else if (!fFamily && // *MUST* be last to be tested here
                   (token.isString()
                    || token.isIdent())) {
            var lastWasComma = false;
            while (true) {
              if (!token.isNotNull())
                break;
              else if (token.isSymbol(";")
                  || (aAcceptPriority && token.isSymbol("!"))
                  || token.isSymbol("}")) {
                this.ungetToken();
                break;
              }
              else if (token.isIdent() && token.value in kFamily) {
                var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, null);
                value.value = token.value;
                fFamilyValues.push(value);
                fFamily += token.value;
                break;
              }
              else if (token.isString() || token.isIdent()) {
                var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, null);
                value.value = token.value;
                fFamilyValues.push(value);
                fFamily += token.value;
                lastWasComma = false;
              }
              else if (!lastWasComma && token.isSymbol(",")) {
                fFamily += ", ";
                lastWasComma = true;
              }
              else
                return "";
              token = this.getToken(true, true);
            }
          }

          else {
            return "";
          }
        }

      }

      token = this.getToken(true, true);
    }

    // create the declarations
    this.forgetState();
    if (fSystem) {
      aDecl.push(this._createJscsspDeclarationFromValue("font", fSystem));
      return fSystem;
    }
    fStyle = fStyle ? fStyle : "normal";
    fVariant = fVariant ? fVariant : "normal";
    fWeight = fWeight ? fWeight : "normal";
    fSize = fSize ? fSize : "medium";
    fLineHeight = fLineHeight ? fLineHeight : "normal";
    fFamily = fFamily ? fFamily : "-moz-initial";

    aDecl.push(this._createJscsspDeclarationFromValue("font-style", fStyle));
    aDecl.push(this._createJscsspDeclarationFromValue("font-variant", fVariant));
    aDecl.push(this._createJscsspDeclarationFromValue("font-weight", fWeight));
    aDecl.push(this._createJscsspDeclarationFromValue("font-size", fSize));
    aDecl.push(this._createJscsspDeclarationFromValue("line-height", fLineHeight));
    aDecl.push(this._createJscsspDeclarationFromValuesArray("font-family", fFamilyValues, fFamily));
    return fStyle + " " + fVariant + " " + fWeight + " " + fSize + "/" + fLineHeight + " " + fFamily;
  },

  _createJscsspDeclaration: function(property, value)
  {
    var decl = new jscsspDeclaration();
    decl.property = property;
    decl.value = this.trim11(value);
    decl.parsedCssText = property + ": " + value + ";";
    return decl;
  },

  _createJscsspDeclarationFromValue: function(property, valueText)
  {
    var decl = new jscsspDeclaration();
    decl.property = property;
    var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, null);
    value.value = valueText;
    decl.values = [value];
    decl.valueText = valueText;
    decl.parsedCssText = property + ": " + valueText + ";";
    return decl;
  },

  _createJscsspDeclarationFromValuesArray: function(property, values, valueText)
  {
    var decl = new jscsspDeclaration();
    decl.property = property;
    decl.values = values;
    decl.valueText = valueText;
    decl.parsedCssText = property + ": " + valueText + ";";
    return decl;
  },

  parseURL: function(token)
  {
    var value = "";
    if (token.isString())
    {
      value += token.value;
      token = this.getToken(true, true);
    }
    else
      while (true)
      {
        if (!token.isNotNull())
          return "";
        if (token.isWhiteSpace()) {
          nextToken = this.lookAhead(true, true);
          // if next token is not a closing parenthesis, that's an error
          if (!nextToken.isSymbol(")")) {
            token = this.currentToken();
            break;
          }
        }
        if (token.isSymbol(")")) {
          break;
        }
        value += token.value;
        token = this.getToken(false, false);
      }

    if (token.isSymbol(")")) {
      var v = this.trim11(value);
      if ((v[0] == "'" && v[v.length -1] == "'") ||
          (v[0] == '"' && v[v.length -1] == '"'))
        v = v.substring(1, v.length - 2)
      var r = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?", "");
      var m = v.match(r)
      if (m) {
        if (m[5].match ( /[^a-z0-9\\-_\\.!~\\*'\\(\\)]/g ) )
          return null;
      }
      return value + ")";
    }
    return "";
  },

  parseFunctionArgument: function(token)
  {
    var value = "";
    if (token.isString())
    {
      value += token.value;
      token = this.getToken(true, true);
    }
    else
      while (true)
      {
        if (!token.isNotNull())
          return "";
        if (token.isSymbol(")")) {
          break;
        }
        value += token.value;
        token = this.getToken(false, false);
      }

    if (token.isSymbol(")"))
      return value + ")";
    return "";
  },

  parseColor: function(token)
  {
    var color = "";
    if (token.isFunction("rgb(")
        || token.isFunction("rgba(")) {
      color = token.value;
      var isRgba = token.isFunction("rgba(")
      token = this.getToken(true, true);
      if (!token.isNumber() && !token.isPercentage())
        return "";
      color += token.value;
      token = this.getToken(true, true);
      if (!token.isSymbol(","))
        return "";
      color += ", ";
  
      token = this.getToken(true, true);
      if (!token.isNumber() && !token.isPercentage())
        return "";
      color += token.value;
      token = this.getToken(true, true);
      if (!token.isSymbol(","))
        return "";
      color += ", ";
  
      token = this.getToken(true, true);
      if (!token.isNumber() && !token.isPercentage())
        return "";
      color += token.value;
  
      if (isRgba) {
        token = this.getToken(true, true);
        if (!token.isSymbol(","))
          return "";
        color += ", ";
  
        token = this.getToken(true, true);
        if (!token.isNumber())
          return "";
        color += token.value;
      }
  
      token = this.getToken(true, true);
      if (!token.isSymbol(")"))
        return "";
      color += token.value;
    }
  
    else if (token.isFunction("hsl(")
             || token.isFunction("hsla(")) {
      color = token.value;
      var isHsla = token.isFunction("hsla(")
      token = this.getToken(true, true);
      if (!token.isNumber())
        return "";
      color += token.value;
      token = this.getToken(true, true);
      if (!token.isSymbol(","))
        return "";
      color += ", ";
  
      token = this.getToken(true, true);
      if (!token.isPercentage())
        return "";
      color += token.value;
      token = this.getToken(true, true);
      if (!token.isSymbol(","))
        return "";
      color += ", ";
  
      token = this.getToken(true, true);
      if (!token.isPercentage())
        return "";
      color += token.value;
  
      if (isHsla) {
        token = this.getToken(true, true);
        if (!token.isSymbol(","))
          return "";
        color += ", ";
  
        token = this.getToken(true, true);
        if (!token.isNumber())
          return "";
        color += token.value;
      }
  
      token = this.getToken(true, true);
      if (!token.isSymbol(")"))
        return "";
      color += token.value;
    }

    else if (token.isIdent()
             && (token.value in this.kCOLOR_NAMES))
      color = token.value;

    else if (token.isSymbol("#")) {
      token = this.getHexValue();
      if (!token.isHex())
        return "";
      var length = token.value.length;
      if (length != 3 && length != 6)
        return "";
      if (token.value.match( /[a-fA-F0-9]/g ).length != length)
        return "";
      color = "#" + token.value;
    }
    return color;
  },

  parseDeclaration: function(aToken, aDecl, aAcceptPriority, aExpandShorthands, aSheet) {
    this.preserveState();
    var blocks = [];
    if (aToken.isIdent()) {
      var descriptor = aToken.value.toLowerCase();
      var token = this.getToken(true, true);
      if (token.isSymbol(":")) {
        var token = this.getToken(true, true);

        var value = "";
        var declarations = [];
        if (aExpandShorthands)
          switch (descriptor) {
            case "background":
              value = this.parseBackgroundShorthand(token, declarations, aAcceptPriority);
              break;
            case "margin":
            case "padding":
              value = this.parseMarginOrPaddingShorthand(token, declarations, aAcceptPriority, descriptor);
              break;
            case "border-color":
              value = this.parseBorderColorShorthand(token, declarations, aAcceptPriority);
              break;
            case "border-style":
              value = this.parseBorderStyleShorthand(token, declarations, aAcceptPriority);
              break;
            case "border-width":
              value = this.parseBorderWidthShorthand(token, declarations, aAcceptPriority);
              break;
            case "border-top":
            case "border-right":
            case "border-bottom":
            case "border-left":
            case "border":
            case "outline":
              value = this.parseBorderEdgeOrOutlineShorthand(token, declarations, aAcceptPriority, descriptor);
              break;
            case "cue":
              value = this.parseCueShorthand(token, declarations, aAcceptPriority);
              break;
            case "pause":
              value = this.parsePauseShorthand(token, declarations, aAcceptPriority);
              break;
            case "font":
              value = this.parseFontShorthand(token, declarations, aAcceptPriority);
              break;
            case "list-style":
              value = this.parseListStyleShorthand(token, declarations, aAcceptPriority);
              break;
            default:
              value = this.parseDefaultPropertyValue(token, declarations, aAcceptPriority, descriptor, aSheet);
              break;
          }
        else
          value = this.parseDefaultPropertyValue(token, declarations, aAcceptPriority, descriptor, aSheet);
        token = this.currentToken();
        if (value) // no error above
        {
          var priority = false;
          if (token.isSymbol("!")) {
            token = this.getToken(true, true);
            if (token.isIdent("important")) {
              priority = true;
              token = this.getToken(true, true);
              if (token.isSymbol(";") || token.isSymbol("}")) {
                if (token.isSymbol("}"))
                  this.ungetToken();
              }
              else return "";
            }
            else return "";
          }
          else if  (token.isNotNull() && !token.isSymbol(";") && !token.isSymbol("}"))
            return "";
          for (var i = 0; i < declarations.length; i++) {
            declarations[i].priority = priority;
            aDecl.push(declarations[i]);
          }
          return descriptor + ": " + value + ";";
        }
      }
    }
    else if (aToken.isComment()) {
      if (this.mPreserveComments) {
        this.forgetState();
        var comment = new jscsspComment();
        comment.parsedCssText = aToken.value;
        aDecl.push(comment);
      }
      return aToken.value;
    }

    // we have an error here, let's skip it
    this.restoreState();
    var s = aToken.value;
    blocks = [];
    var token = this.getToken(false, false);
    while (token.isNotNull()) {
      s += token.value;
      if ((token.isSymbol(";") || token.isSymbol("}")) && !blocks.length) {
        if (token.isSymbol("}"))
          this.ungetToken();
        break;
      } else if (token.isSymbol("{")
                 || token.isSymbol("(")
                 || token.isSymbol("[")
                 || token.isFunction()) {
        blocks.push(token.isFunction() ? "(" : token.value);
      } else if (token.isSymbol("}")
                 || token.isSymbol(")")
                 || token.isSymbol("]")) {
        if (blocks.length) {
          var ontop = blocks[blocks.length - 1];
          if ((token.isSymbol("}") && ontop == "{")
              || (token.isSymbol(")") && ontop == "(")
              || (token.isSymbol("]") && ontop == "[")) {
            blocks.pop();
          }
        }
      }
      token = this.getToken(false, false);
    }
    return "";
  },

  parseMediaRule: function(aToken, aSheet) {
    var s = aToken.value;
    var valid = false;
    var mediaRule = new jscsspMediaRule();
    this.preserveState();
    var token = this.getToken(true, true);
    var foundMedia = false;
    while (token.isNotNull()) {
      if (token.isIdent()) {
        foundMedia = true;
        s += " " + token.value;
        mediaRule.media.push(token.value);
        token = this.getToken(true, true);
        if (token.isSymbol(",")) {
          s += ",";
        } else {
          if (token.isSymbol("{"))
            this.ungetToken();
          else {
            // error...
            token.type = jscsspToken.NULL_TYPE;
            break;
          }
        }
      } else if (token.isSymbol("{"))
        break;
      else if (foundMedia) {
        token.type = jscsspToken.NULL_TYPE;
        // not a media list
        break;
      }
      token = this.getToken(true, true);
    }
    if (token.isSymbol("{") && mediaRule.media.length) {
      // ok let's parse style rules now...
      s += " { ";
      token = this.getToken(true, false);
      while (token.isNotNull()) {
        if (token.isComment() && this.mPreserveComments) {
          s += " " + token.value;
          var comment = new jscsspComment();
          comment.parsedCssText = token.value;
          mediaRule.cssRules.push(comment);
        } else if (token.isSymbol("}")) {
          valid = true;
          break;
        } else {
          var r = this.parseStyleRule(token, mediaRule, true);
          if (r)
            s += r;
        }
        token = this.getToken(true, false);
      }
    }
    if (valid) {
      this.forgetState();
      mediaRule.parsedCssText = s;
      aSheet.cssRules.push(mediaRule);
      return true;
    }
    this.restoreState();
    return false;
  },

  trim11: function(str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
      if (/\S/.test( str.charAt(i) )) { // XXX charat
        str = str.substring(0, i + 1);
        break;
      }
    }
    return str;
  },

  parseStyleRule: function(aToken, aOwner, aIsInsideMediaRule)
  {
    var currentLine = this.mScanner.mCurrentLine;
    this.preserveState();
    // first let's see if we have a selector here...
    var selector = this.parseSelector(aToken, false);
    var valid = false;
    var declarations = [];
    if (selector) {
      selector = this.trim11(selector);
      var s = selector;
      var token = this.getToken(true, true);
      if (token.isSymbol("{")) {
        s += " { ";
        var token = this.getToken(true, false);
        while (true) {
          if (!token.isNotNull()) {
            valid = true;
            break;
          }
          if (token.isSymbol("}")) {
            s += "}";
            valid = true;
            break;
          } else {
            var d = this.parseDeclaration(token, declarations, true, false, aOwner);
            s += ((d && declarations.length) ? " " : "") + d;
          }
          token = this.getToken(true, false);
        }
      }
    }
    else {
      // selector is invalid so the whole rule is invalid with it
    }

    if (valid) {
      var rule = new jscsspStyleRule();
      rule.currentLine = currentLine;
      rule.parsedCssText = s;
      rule.declarations = declarations;
      rule.mSelectorText = selector;
      if (aIsInsideMediaRule)
        rule.parentRule = aOwner;
      else
        rule.parentStyleSheet = aOwner;
      aOwner.cssRules.push(rule);
      return s;
    }
    this.restoreState();
    s = this.currentToken().value;
    this.addUnknownAtRule(aOwner, s);
    return "";
  },

  parseSelector: function(aToken, aParseSelectorOnly) {
    var s = "";
    var isFirstInChain = true;
    var token = aToken;
    var valid = false;
    var combinatorFound = false;
    while (true) {
      if (!token.isNotNull()) {
        if (aParseSelectorOnly)
          return s;
        return "";
      }

      if (!aParseSelectorOnly && token.isSymbol("{")) {
        // end of selector
        this.ungetToken();
        valid = true;
        break;
      }

      if (token.isSymbol(",")) {
        s += token.value;
        isFirstInChain = true;
        combinatorFound = false;
        token = this.getToken(false, true);
        continue;
      }
      // now combinators and grouping...
      else if (!combinatorFound
          && (token.isWhiteSpace()
              || token.isSymbol(">")
              || token.isSymbol("+")
              || token.isSymbol("~"))) {
        if (token.isWhiteSpace())
          s += " ";
        else
          s += token.value;
        if (token.isSymbol(">")
            || token.isSymbol("+")
            || token.isSymbol("~"))
          combinatorFound = true;
        token = this.getToken(true, true);
        continue;
      }
      else {
        var simpleSelector = this.parseSimpleSelector(token, isFirstInChain, true);
        if (!simpleSelector)
          break; // error
        s += simpleSelector;
      }

      isFirstInChain == false;
      combinatorFound = false;
      token = this.getToken(false, true);
    }

    if (valid) {
      return s;
    }
    return "";
  },

  parseSimpleSelector: function(token, isFirstInChain, canNegate)
  {
    var s = "";
    if (isFirstInChain
        && (token.isSymbol("*") || token.isSymbol("|") || token.isIdent())) {
      // type or universal selector
      if (token.isSymbol("*") || token.isIdent()) {
        // we don't know yet if it's a prefix or a universal
        // selector
        s += token.value;
        token = this.getToken(false, true);
        if (token.isSymbol("|")) {
          // it's a prefix
          s += token.value;
          token = this.getToken(false, true);
          if (token.isIdent() || token.isSymbol("*")) {
            // ok we now have a type element or universal
            // selector
            s += token.value;
          } else
            // oops that's an error...
            return null;
        } else
          this.ungetToken();
      } else if (token.isSymbol("|")) {
        s += token.value;
        token = this.getToken(false, true);
        if (token.isIdent() || token.isSymbol("*")) {
          s += token.value;
        } else
          // oops that's an error
          return null;
      }
    }
  
    else if (token.isSymbol(".") || token.isSymbol("#")) {
      s += token.value;
      token = this.getToken(false, true);
      if (token.isIdent())
        s += token.value
      else
        return null;
    }

    else if (token.isSymbol(":")) {
      s += token.value;
      token = this.getToken(false, true);
      if (token.isSymbol(":")) {
        s += token.value;
        token = this.getToken(false, true);
      }
      if (token.isIdent())
        s += token.value
      else if (token.isFunction()) {
        s += token.value;
        if (token.isFunction(":not(")) {
          if (!canNegate)
            return null;
          token = this.getToken(true, true);
          var simpleSelector = this.parseSimpleSelector(token, isFirstInChain, false);
          if (!simpleSelector)
            return null;
          else {
            s += simpleSelector;
            token = this.getToken(true, true);
            if (token.isSymbol(")"))
              s += ")";
            else
              return null;
          }
        }
        else
          while (true) {
            token = this.getToken(false, true);
            if (token.isSymbol(")")) {
              s += ")";
              break;
            } else
              s += token.value;
          }
      } else
        return null;
  
    } else if (token.isSymbol("[")) {
      s += "[";
      token = this.getToken(true, true);
      if (token.isIdent() || token.isSymbol("*")) {
        s += token.value;
        var nextToken = this.getToken(true, true);
        if (token.isSymbol("|")) {
          s += "|";
          token = this.getToken(true, true);
          if (token.isIdent())
            s += token.value;
          else
            return null;
        } else
          this.ungetToken();
      } else if (token.isSymbol("|")) {
        s += "|";
        token = this.getToken(true, true);
        if (token.isIdent())
          s += token.value;
        else
          return null;
      }
      else
        return null;
  
      // nothing, =, *=, $=, ^=, |=
      token = this.getToken(true, true);
      if (token.isIncludes()
          || token.isDashmatch()
          || token.isBeginsmatch()
          || token.isEndsmatch()
          || token.isContainsmatch()
          || token.isSymbol("=")) {
        s += token.value;
        token = this.getToken(true, true);
        if (token.isString() || token.isIdent()) {
          s += token.value;
          token = this.getToken(true, true);
        }
        else
          return null;

        if (token.isSymbol("]"))
          s += token.value;
        else
          return null;
      }
      else if (token.isSymbol("]"))
        s += token.value;
      else
        return null;
    }
    else if (token.isWhiteSpace()) {
      var t = this.lookAhead(true, true);
      if (t.isSymbol('{'))
        return ""
    }
    if (s)
      return s;
    return null;
  },

  preserveState: function() {
    this.mPreservedTokens.push(this.currentToken());
    this.mScanner.preserveState();
  },

  restoreState: function() {
    if (this.mPreservedTokens.length) {
      this.mScanner.restoreState();
      this.mToken = this.mPreservedTokens.pop();
    }
  },

  forgetState: function() {
    if (this.mPreservedTokens.length) {
      this.mScanner.forgetState();
      this.mPreservedTokens.pop();
    }
  },

  parse: function(aString, aTryToPreserveWhitespaces, aTryToPreserveComments) {
    if (!aString)
      return null; // early way out if we can

    this.mPreserveWS       = aTryToPreserveWhitespaces;
    this.mPreserveComments = aTryToPreserveComments;
    this.mPreservedTokens = [];
    this.mScanner.init(aString);
    var sheet = new jscsspStylesheet();

    // @charset can only appear at first char of the stylesheet
    var token = this.getToken(false, false);
    if (!token.isNotNull())
      return;
    if (token.isAtRule("@charset")) {
      this.parseCharsetRule(token, sheet);
      token = this.getToken(false, false);
    }

    var foundStyleRules = false;
    var foundImportRules = false;
    var foundNameSpaceRules = false;
    while (true) {
      if (!token.isNotNull())
        break;
      if (token.isWhiteSpace())
      {
        if (aTryToPreserveWhitespaces)
          this.addWhitespace(sheet, token.value);
      }

      else if (token.isComment())
      {
        if (this.mPreserveComments)
          this.addComment(sheet, token.value);
      }

      else if (token.isAtRule()) {
        if (token.isAtRule("@variables")) {
          if (!foundImportRules && !foundStyleRules)
            this.parseVariablesRule(token, sheet);
          else
            this.addUnknownAtRule(sheet, token.value);
        }
        else if (token.isAtRule("@import")) {
          // @import rules MUST occur before all style and namespace
          // rules
          if (!foundStyleRules && !foundNameSpaceRules)
            foundImportRules = this.parseImportRule(token, sheet);
          else
            this.addUnknownAtRule(sheet, token.value);
        }
        else if (token.isAtRule("@namespace")) {
          // @namespace rules MUST occur before all style rule and
          // after all @import rules
          if (!foundStyleRules)
            foundNameSpaceRules = this.parseNamespaceRule(token,
                sheet);
          else
            this.addUnknownAtRule(sheet, token.value);
        }
        else if (token.isAtRule("@font-face")) {
          if (this.parseFontFaceRule(token, sheet))
            foundStyleRules = true;
          else
            this.addUnknownAtRule(sheet, token.value);
        }
        else if (token.isAtRule("@page")) {
          if (this.parsePageRule(token, sheet))
            foundStyleRules = true;
          else
            this.addUnknownAtRule(sheet, token.value);
        }
        else if (token.isAtRule("@media")) {
          if (this.parseMediaRule(token, sheet))
            foundStyleRules = true;
          else
            this.addUnknownAtRule(sheet, token.value);
        }
        else
          this.addUnknownAtRule(sheet, token.value);
      }

      else // plain style rules
      {
        var ruleText = this.parseStyleRule(token, sheet, false);
        if (ruleText)
          foundStyleRules = true;
      }
      token = this.getToken(false);
    }

    return sheet;
  }

};


function jscsspToken(aType, aValue, aUnit)
{
  this.type = aType;
  this.value = aValue;
  this.unit = aUnit;
}

jscsspToken.NULL_TYPE = 0;

jscsspToken.WHITESPACE_TYPE = 1;
jscsspToken.STRING_TYPE = 2;
jscsspToken.COMMENT_TYPE = 3;
jscsspToken.NUMBER_TYPE = 4;
jscsspToken.IDENT_TYPE = 5;
jscsspToken.FUNCTION_TYPE = 6;
jscsspToken.ATRULE_TYPE = 7;
jscsspToken.INCLUDES_TYPE = 8;
jscsspToken.DASHMATCH_TYPE = 9;
jscsspToken.BEGINSMATCH_TYPE = 10;
jscsspToken.ENDSMATCH_TYPE = 11;
jscsspToken.CONTAINSMATCH_TYPE = 12;
jscsspToken.SYMBOL_TYPE = 13;
jscsspToken.DIMENSION_TYPE = 14;
jscsspToken.PERCENTAGE_TYPE = 15;
jscsspToken.HEX_TYPE = 16;

jscsspToken.prototype = {

  isNotNull: function ()
  {
    return this.type;
  },

  _isOfType: function (aType, aValue)
  {
    return (this.type == aType && (!aValue || this.value.toLowerCase() == aValue));
  },

  isWhiteSpace: function(w)
  {
    return this._isOfType(jscsspToken.WHITESPACE_TYPE, w);
  },

  isString: function()
  {
    return this._isOfType(jscsspToken.STRING_TYPE);
  },

  isComment: function()
  {
    return this._isOfType(jscsspToken.COMMENT_TYPE);
  },

  isNumber: function(n)
  {
    return this._isOfType(jscsspToken.NUMBER_TYPE, n);
  },

  isSymbol: function(c)
  {
    return this._isOfType(jscsspToken.SYMBOL_TYPE, c);
  },

  isIdent: function(i)
  {
    return this._isOfType(jscsspToken.IDENT_TYPE, i);
  },

  isFunction: function(f)
  {
    return this._isOfType(jscsspToken.FUNCTION_TYPE, f);
  },

  isAtRule: function(a)
  {
    return this._isOfType(jscsspToken.ATRULE_TYPE, a);
  },

  isIncludes: function()
  {
    return this._isOfType(jscsspToken.INCLUDES_TYPE);
  },

  isDashmatch: function()
  {
    return this._isOfType(jscsspToken.DASHMATCH_TYPE);
  },

  isBeginsmatch: function()
  {
    return this._isOfType(jscsspToken.BEGINSMATCH_TYPE);
  },

  isEndsmatch: function()
  {
    return this._isOfType(jscsspToken.ENDSMATCH_TYPE);
  },

  isContainsmatch: function()
  {
    return this._isOfType(jscsspToken.CONTAINSMATCH_TYPE);
  },

  isSymbol: function(c)
  {
    return this._isOfType(jscsspToken.SYMBOL_TYPE, c);
  },

  isDimension: function()
  {
    return this._isOfType(jscsspToken.DIMENSION_TYPE);
  },

  isPercentage: function()
  {
    return this._isOfType(jscsspToken.PERCENTAGE_TYPE);
  },

  isHex: function()
  {
    return this._isOfType(jscsspToken.HEX_TYPE);
  },

  isDimensionOfUnit: function(aUnit)
  {
    return (this.isDimension() && this.unit == aUnit);
  }
}

var kJscsspUNKNOWN_RULE   = 0;
var kJscsspSTYLE_RULE     = 1
var kJscsspCHARSET_RULE   = 2;
var kJscsspIMPORT_RULE    = 3;
var kJscsspMEDIA_RULE     = 4;
var kJscsspFONT_FACE_RULE = 5;
var kJscsspPAGE_RULE      = 6;
var kJscsspVARIABLES_RULE = 7;

var kJscsspNAMESPACE_RULE = 100;
var kJscsspCOMMENT        = 101;
var kJscsspWHITE_SPACE    = 102;

var kJscsspSTYLE_DECLARATION = 1000;

var gTABS = "";

function jscsspStylesheet()
{
  this.cssRules = [];
  this.variables = {};
}

jscsspStylesheet.prototype = {
  insertRule: function(aRule, aIndex) {
    try {
     this.cssRules.splice(aIndex, 1, aRule);
    }
    catch(e) {
      dump("DOMException: jscsspStylesheet.insertRule\n")
    }
  },

  deleteRule: function(aIndex) {
    try {
      this.cssRules.splice(aIndex);
    }
    catch(e) {
      dump("DOMException: jscsspStylesheet.insertRule\n")
    }
  },

  cssText: function() {
    var rv = "";
    for (var i = 0; i < this.cssRules.length; i++)
      rv += this.cssRules[i].cssText() + "\n";
    return rv;
  },

  htmlText: function() {
    var rv = "";
    for (var i = 0; i < this.cssRules.length; i++)
      rv += this.cssRules[i].htmlText() + "<br>";
    return rv;
  },

  resolveVariables: function(aMedium) {

    function ItemFoundInArray(aArray, aItem) {
      for (var i = 0; i < aArray.length; i++)
        if (aItem == aArray[i])
          return true;
      return false;
    }
    
    for (var i = 0; i < this.cssRules.length; i++)
    {
      var rule = this.cssRules[i];
      if (rule.type == kJscsspSTYLE_RULE || rule.type == kJscsspIMPORT_RULE)
        break;
      else if (rule.type == kJscsspVARIABLES_RULE &&
               (!rule.media.length || ItemFoundInArray(rule.media, aMedium))) {
        
        for (var j = 0; j < rule.declarations.length; j++) {
          var valueText = "";
          for (var k = 0; k < rule.declarations[j].values.length; k++)
            valueText += (k ? " " : "") + rule.declarations[j].values[k].value;
          this.variables[rule.declarations[j].property] = valueText;
        }
      }
    }
  }
};

/* kJscsspCHARSET_RULE */

function jscsspCharsetRule()
{
  this.type = kJscsspCHARSET_RULE;
  this.encoding = null;
  this.parsedCssText = null;
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspCharsetRule.prototype = {

  cssText: function() {
    return "@charset " + this.encoding + ";";
  },

  htmlText: function() {
    return "<span class='atrule'>@charset</span>&nbsp;<span class='string'>"
           + this.encoding + "</span>;";
  },

  setCssText: function(val) {
    var sheet = {cssRules: []};
    var parser = new CSSParser(val);
    var token = parser.getToken(false, false);
    if (token.isAtRule("@charset")) {
      if (parser.parseCharsetRule(token, sheet)) {
        var newRule = sheet.cssRules[0];
        this.encoding = newRule.encoding;
        this.parsedCssText = newRule.parsedCssText;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspUNKNOWN_RULE */

function jscsspErrorRule()
{
  this.type = kJscsspUNKNOWN_RULE;
  this.parsedCssText = null;
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspErrorRule.prototype = {
  cssText: function() {
    return this.parsedCssText;
  },

  htmlText: function() {
    return "<span class='error'>" + this.parsedCssText + "</span>";
  }
};

/* kJscsspCOMMENT */

function jscsspComment()
{
  this.type = kJscsspCOMMENT;
  this.parsedCssText = null;
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspComment.prototype = {
  cssText: function() {
    return this.parsedCssText;
  },

  htmlText: function() {
    return "<span class='comment'>" + this.parsedCssText + "</span>";
  },

  setCssText: function(val) {
    var parser = new CSSParser(val);
    var token = parser.getToken(true, false);
    if (token.isComment())
      this.parsedCssText = token.value;
    else
      throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspWHITE_SPACE */

function jscsspWhitespace()
{
  this.type = kJscsspWHITE_SPACE;
  this.parsedCssText = null;
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspWhitespace.prototype = {
  cssText: function() {
    return this.parsedCssText;
  },

  htmlText: function() {
    return this.cssText().replace( / /g , "&nbsp;")
                         .replace( /\n/g , "<br>");
  },
};

/* kJscsspIMPORT_RULE */

function jscsspImportRule()
{
  this.type = kJscsspIMPORT_RULE;
  this.parsedCssText = null;
  this.href = null;
  this.media = [];
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspImportRule.prototype = {
  cssText: function() {
    var mediaString = this.media.join(", ");
    return "@import " + (mediaString ? mediaString + " " : "")
                      + this.href
                      + ";";
  },

  htmlText: function() {
    var mediaString = "";
    if (this.media.length)
      mediaString = "<span class='medium'>" + this.media.join("</span>, <span class='medium'>")
                    + "</span>";
    return "<span class='atrule'>@import</span> " + (mediaString ? mediaString + " " : "")
           + "<span class='url'>" + this.href + "</span>"
           + ";";
  },

  setCssText: function(val) {
    var sheet = {cssRules: []};
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (token.isAtRule("@import")) {
      if (parser.parseImportRule(token, sheet)) {
        var newRule = sheet.cssRules[0];
        this.href = newRule.href;
        this.media = newRule.media;
        this.parsedCssText = newRule.parsedCssText;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspNAMESPACE_RULE */

function jscsspNamespaceRule()
{
  this.type = kJscsspNAMESPACE_RULE;
  this.parsedCssText = null;
  this.prefix = null;
  this.url = null;
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspNamespaceRule.prototype = {
  cssText: function() {
    return "@namespace " + (this.prefix ? this.prefix + " ": "")
                        + this.url
                        + ";";
  },

  htmlText: function() {
    return "<span class='atrule'>@namespace</span> " + (this.prefix ? this.prefix + " ": "")
                        + "<span class='url'>" + this.url + "</span>"
                        + ";";
  },

  setCssText: function(val) {
    var sheet = {cssRules: []};
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (token.isAtRule("@namespace")) {
      if (parser.parseNamespaceRule(token, sheet)) {
        var newRule = sheet.cssRules[0];
        this.url = newRule.url;
        this.prefix = newRule.prefix;
        this.parsedCssText = newRule.parsedCssText;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspSTYLE_DECLARATION */

function jscsspDeclaration()
{
  this.type = kJscsspSTYLE_DECLARATION;
  this.property = null;
  this.values = [];
  this.valueText = null;
  this.priority = null;
  this.parsedCssText = null;
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspDeclaration.prototype = {
  kCOMMA_SEPARATED: {
    "cursor": true,
    "font-family": true,
    "voice-family": true
  },

  htmlText: function() {
    var rv = "<span class='property'>" + this.property + "</span>: ";
    var separator = (this.property in this.kCOMMA_SEPARATED) ? ", " : " ";
    for (var i = 0; i < this.values.length; i++)
      if (this.values[i].cssText() != null)
        rv += (i ? separator : "") + "<span class='value'>" + this.values[i].cssText() + "</span>";
      else
        return null;
    return rv + (this.priority ? " <span class='bang'>!important</span>" : "") + ";";
  },

  cssText: function() {
    var rv = this.property + ": ";
    var separator = (this.property in this.kCOMMA_SEPARATED) ? ", " : " ";
    for (var i = 0; i < this.values.length; i++)
      if (this.values[i].cssText() != null)
        rv += (i ? separator : "") + this.values[i].cssText();
      else
        return null;
    return rv + (this.priority ? " !important" : "") + ";";
  },

  setCssText: function(val) {
    var declarations = [];
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (parser.parseDeclaration(token, declarations, true, false, null)
        && declarations.length
        && declarations[0].type == kJscsspSTYLE_DECLARATION) {
      var newDecl = declarations.cssRules[0];
      this.property = newDecl.property;
      this.value = newDecl.value;
      this.priority = newDecl.priority;
      this.parsedCssText = newRule.parsedCssText;
      return;
    }
    throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspFONT_FACE_RULE */

function jscsspFontFaceRule()
{
  this.type = kJscsspFONT_FACE_RULE;
  this.parsedCssText = null;
  this.descriptors = [];
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspFontFaceRule.prototype = {
  cssText: function() {
    var rv = gTABS + "@font-face {\n";
    var preservedGTABS = gTABS;
    gTABS += "  ";
    for (var i = 0; i < this.descriptors.length; i++)
      rv += gTABS + this.descriptors[i].cssText() + "\n";
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  htmlText: function() {
    var rv = gTABS + "<span class='atrule'>@font-face</span> {<br>";
    var preservedGTABS = gTABS;
    gTABS += "&nbsp;&nbsp;";
    for (var i = 0; i < this.descriptors.length; i++)
      rv += gTABS + this.descriptors[i].htmlText() + "<br>";
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  setCssText: function(val) {
    var sheet = {cssRules: []};
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (token.isAtRule("@font-face")) {
      if (parser.parseFontFaceRule(token, sheet)) {
        var newRule = sheet.cssRules[0];
        this.descriptors = newRule.descriptors;
        this.parsedCssText = newRule.parsedCssText;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspMEDIA_RULE */

function jscsspMediaRule()
{
  this.type = kJscsspMEDIA_RULE;
  this.parsedCssText = null;
  this.cssRules = [];
  this.media = [];
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspMediaRule.prototype = {
  cssText: function() {
    var rv = gTABS + "@media " + this.media.join(", ") + " {\n";
    var preservedGTABS = gTABS;
    gTABS += "  ";
    for (var i = 0; i < this.cssRules.length; i++)
      rv += gTABS + this.cssRules[i].cssText() + "\n";
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  htmlText: function() {
    var mediaString = "";
    if (this.media.length)
      mediaString = "<span class='medium'>" + this.media.join("</span>, <span class='medium'>")
                    + "</span>";
    var rv = gTABS + "<span class='atrule'>@media</span> " + mediaString + " {<br>";
    var preservedGTABS = gTABS;
    gTABS += "&nbsp;&nbsp;";
    for (var i = 0; i < this.cssRules.length; i++)
      rv += gTABS + this.cssRules[i].htmlText() + "<br>";
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  setCssText: function(val) {
    var sheet = {cssRules: []};
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (token.isAtRule("@media")) {
      if (parser.parseMediaRule(token, sheet)) {
        var newRule = sheet.cssRules[0];
        this.cssRules = newRule.cssRules;
        this.media = newRule.media;
        this.parsedCssText = newRule.parsedCssText;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspSTYLE_RULE */

function jscsspStyleRule()
{
  this.type = kJscsspSTYLE_RULE;
  this.parsedCssText = null;
  this.declarations = []
  this.mSelectorText = null;
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspStyleRule.prototype = {
  cssText: function() {
    var rv = this.mSelectorText + " {\n";
    var preservedGTABS = gTABS;
    gTABS += "  ";
    for (var i = 0; i < this.declarations.length; i++) {
      var declText = this.declarations[i].cssText();
      if (declText)
        rv += gTABS + this.declarations[i].cssText() + "\n";
    }
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  htmlText: function() {
    var rv = "<span class='selector'>" + this.mSelectorText + "</span> {<br>";
    var preservedGTABS = gTABS;
    gTABS += "&nbsp;&nbsp;";
    for (var i = 0; i < this.declarations.length; i++) {
      var declText = this.declarations[i].htmlText();
      if (declText)
        rv += gTABS + this.declarations[i].htmlText() + "<br>";
    }
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  setCssText: function(val) {
    var sheet = {cssRules: []};
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (!token.isNotNull()) {
      if (parser.parseStyleRule(token, sheet, false)) {
        var newRule = sheet.cssRules[0];
        this.mSelectorText = newRule.mSelectorText;
        this.declarations = newRule.declarations;
        this.parsedCssText = newRule.parsedCssText;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  },

  selectorText: function() {
    return this.mSelectorText;
  },

  setSelectorText: function(val) {
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (!token.isNotNull()) {
      var s = parser.parseSelector(token, true);
      if (s) {
        this.mSelectorText = s;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspPAGE_RULE */

function jscsspPageRule()
{
  this.type = kJscsspPAGE_RULE;
  this.parsedCssText = null;
  this.pageSelector = null;
  this.declarations = [];
  this.parentStyleSheet = null;
  this.parentRule = null;
}

jscsspPageRule.prototype = {
  cssText: function() {
    var rv = gTABS + "@page "
                   + (this.pageSelector ? this.pageSelector + " ": "")
                   + "{\n";
    var preservedGTABS = gTABS;
    gTABS += "  ";
    for (var i = 0; i < this.declarations.length; i++)
      rv += gTABS + this.declarations[i].cssText() + "\n";
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  htmlText: function() {
    var rv = gTABS + "<span class='atrule'>@page</span> "
                   + (this.pageSelector ? "<span class='selector'>" + this.pageSelector + "</span> " : "")
                   + "{<br>";
    var preservedGTABS = gTABS;
    gTABS += "&nbsp;&nbsp;";
    for (var i = 0; i < this.declarations.length; i++)
      rv += gTABS + this.declarations[i].htmlText() + "<br>";
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  setCssText: function(val) {
    var sheet = {cssRules: []};
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (token.isAtRule("@page")) {
      if (parser.parsePageRule(token, sheet)) {
        var newRule = sheet.cssRules[0];
        this.pageSelector = newRule.pageSelector;
        this.declarations = newRule.declarations;
        this.parsedCssText = newRule.parsedCssText;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  }
};

/* kJscsspVARIABLES_RULE */

function jscsspVariablesRule()
{
  this.type = kJscsspVARIABLES_RULE;
  this.parsedCssText = null;
  this.declarations = [];
  this.parentStyleSheet = null;
  this.parentRule = null;
  this.media = null;
}

jscsspVariablesRule.prototype = {
  cssText: function() {
    var rv = gTABS + "@variables " +
                     (this.media.length ? this.media.join(", ") + " " : "") +
                     "{\n";
    var preservedGTABS = gTABS;
    gTABS += "  ";
    for (var i = 0; i < this.declarations.length; i++)
      rv += gTABS + this.declarations[i].cssText() + "\n";
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

 htmlText: function() {
    var mediaString = "";
    if (this.media.length)
      mediaString = "<span class='medium'>" + this.media.join("</span>, <span class='medium'>")
                    + "</span>";
    var rv = gTABS + "<span class='atrule'>@variables</span> " +
                     (mediaString ? mediaString + " " : "") +
                     "{<br>";
    var preservedGTABS = gTABS;
    gTABS += "&nbsp;&nbsp;";
    for (var i = 0; i < this.declarations.length; i++)
      rv += gTABS + this.declarations[i].htmlText() + "<br>";
    gTABS = preservedGTABS;
    return rv + gTABS + "}";
  },

  setCssText: function(val) {
    var sheet = {cssRules: []};
    var parser = new CSSParser(val);
    var token = parser.getToken(true, true);
    if (token.isAtRule("@variables")) {
      if (parser.parseVariablesRule(token, sheet)) {
        var newRule = sheet.cssRules[0];
        this.declarations = newRule.declarations;
        this.parsedCssText = newRule.parsedCssText;
        return;
      }
    }
    throw DOMException.SYNTAX_ERR;
  }
};

var kJscsspINHERIT_VALUE = 0;
var kJscsspPRIMITIVE_VALUE = 1;
var kJscsspVARIABLE_VALUE = 4;

function jscsspVariable(aType, aSheet)
{
  this.value = "";
  this.type = aType;
  this.name  = null;
  this.parentRule = null;
  this.parentStyleSheet = aSheet;
}

jscsspVariable.prototype = {
  cssText: function() {
    if (this.type == kJscsspVARIABLE_VALUE)
      return this.resolveVariable(this.name, this.parentRule, this.parentStyleSheet);
    else
      return this.value;
  },

  setCssText: function(val) {
    if (this.type == kJscsspVARIABLE_VALUE)
      throw DOMException.SYNTAX_ERR;
    else
      this.value = val;
  },

  resolveVariable: function(aName, aRule, aSheet)
  {
    if (aName.toLowerCase() in aSheet.variables)
      return aSheet.variables[aName.toLowerCase()];
    return null;
  }
};

function ParseURL(buffer) {
  var result = { };
  result.protocol = "";
  result.user = "";
  result.password = "";
  result.host = "";
  result.port = "";
  result.path = "";
  result.query = "";

  var section = "PROTOCOL";
  var start = 0;
  var wasSlash = false;

  while(start < buffer.length) {
    if(section == "PROTOCOL") {
      if(buffer.charAt(start) == ':') {
        section = "AFTER_PROTOCOL";
        start++;
      } else if(buffer.charAt(start) == '/' && result.protocol.length() == 0) {
        section = PATH;
      } else {
        result.protocol += buffer.charAt(start++);
      }
    } else if(section == "AFTER_PROTOCOL") {
      if(buffer.charAt(start) == '/') {
    if(!wasSlash) {
          wasSlash = true;
    } else {
          wasSlash = false;
          section = "USER";
    }
        start ++;
      } else {
        throw new ParseException("Protocol shell be separated with 2 slashes");
      }
    } else if(section == "USER") {
      if(buffer.charAt(start) == '/') {
        result.host = result.user;
        result.user = "";
        section = "PATH";
      } else if(buffer.charAt(start) == '?') {
        result.host = result.user;
        result.user = "";
        section = "QUERY";
        start++;
      } else if(buffer.charAt(start) == ':') {
        section = "PASSWORD";
        start++;
      } else if(buffer.charAt(start) == '@') {
        section = "HOST";
        start++;
      } else {
        result.user += buffer.charAt(start++);
      }
    } else if(section == "PASSWORD") {
      if(buffer.charAt(start) == '/') {
        result.host = result.user;
        result.port = result.password;
        result.user = "";
        result.password = "";
        section = "PATH";
      } else if(buffer.charAt(start) == '?') {
        result.host = result.user;
        result.port = result.password;
        result.user = "";
        result.password = "";
        section = "QUERY";
        start ++;
      } else if(buffer.charAt(start) == '@') {
        section = "HOST";
        start++;
      } else {
        result.password += buffer.charAt(start++);
      }
    } else if(section == "HOST") {
      if(buffer.charAt(start) == '/') {
        section = "PATH";
      } else if(buffer.charAt(start) == ':') {
        section = "PORT";
        start++;
      } else if(buffer.charAt(start) == '?') {
        section = "QUERY";
        start++;
      } else {
        result.host += buffer.charAt(start++);
      }
    } else if(section == "PORT") {
      if(buffer.charAt(start) = '/') {
        section = "PATH";
      } else if(buffer.charAt(start) == '?') {
        section = "QUERY";
        start++;
      } else {
        result.port += buffer.charAt(start++);
      }
    } else if(section == "PATH") {
      if(buffer.charAt(start) == '?') {
    section = "QUERY";
    start ++;
      } else {
    result.path += buffer.charAt(start++);
      }
    } else if(section == "QUERY") {
      result.query += buffer.charAt(start++);
    }
  }

  if(section == "PROTOCOL") {
    result.host = result.protocol;
    result.protocol = "http";
  } else if(section == "AFTER_PROTOCOL") {
    throw new ParseException("Invalid url");
  } else if(section == "USER") {
    result.host = result.user;
    result.user = "";
  } else if(section == "PASSWORD") {
    result.host = result.user;
    result.port = result.password;
    result.user = "";
    result.password = "";
  }

  return result;
}

function CountLF(s)
{
  var nCR = s.match( /\n/g );
  return nCR ? nCR.length + 1 : 1;
}

function ParseException(description) {
    this.description = description;
}

function countChar(s){
  var nChar = s.match(/[^\r\n]/g);
  var nCRLF = s.match(/\r\n/g);
  if (nChar != null){nChar = nChar.length}else{nChar = 0}
  if (nCRLF != null){nCRLF = nCRLF.length}else{nCRLF = 0}
  var nChar = nChar+nCRLF;
  return nChar;
}
