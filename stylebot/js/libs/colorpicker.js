/**
 * Slim Color picker
 * Original Author: Stefan Petre www.eyecon.ro
 * Modified By: Ankit Ahuja
 *
 * Dual licensed under the MIT and GPL licenses
 */
 
(function ($) {
    var ColorPicker = function () {
        var
            ids = {},
            inAction,
            charMin = 65,
            visible,
            tpl = '<div class="stylebot_colorpicker"> \
            <div class="stylebot_colorpicker_color"> \
            <div><div></div></div> \
            </div> \
            <div class="stylebot_colorpicker_hue"><div> \
            </div> \
            </div> \
            </div>',
            
            defaults = {
                eventName: 'click',
                onShow: function () {},
                onBeforeShow: function(){},
                onHide: function () {},
                onChange: function () {},
                onSubmit: function () {},
                appendToElement: document.body,
                color: 'ff0000',
                flat: false
            },
            
            setSelector = function (hsb, cal) {
                $(cal).data('colorpicker').selector.css('backgroundColor', '#' + HSBToHex({h: hsb.h, s: 100, b: 100}));
                $(cal).data('colorpicker').selectorIndic.css({
                    left: parseInt(150 * hsb.s/100, 10),
                    top: parseInt(150 * (100-hsb.b)/100, 10)
                });
            },
            
            setHue = function (hsb, cal) {
                $(cal).data('colorpicker').hue.css('top', parseInt(150 - 150 * hsb.h/360, 10));
            },
            
            update = function (cal) {
                var col = cal.data('colorpicker').color;
                setSelector(col, cal.get(0));
                setHue(col, cal.get(0));
                cal.data('colorpicker').onChange.apply(cal, [col, HSBToHex(col), HSBToRGB(col)]);
            },
            
            downHue = function (ev) {
                var current = {
                 cal: $(this).parent(),
                 y: $(this).offset().top
                };
                $(document).bind('mouseup', current, upHue);
                $(document).bind('mousedown', current, moveHue);
                $(document).bind('mousemove', current, moveHue);
            },
            
            moveHue = function (ev) {
                var cal = ev.data.cal;
                var hsb_h = parseInt(360*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.y))))/150, 10);
                cal.data('colorpicker').color.h = hsb_h;
                update(cal);
                return false;
            },
            
            upHue = function (ev) {
                $(document).unbind('mouseup', upHue);
                $(document).unbind('mousedown', moveHue);
                $(document).unbind('mousemove', moveHue);
                return false;
            },
            
            downSelector = function (ev) {
                var current = {
                    cal: $(this).parent(),
                    pos: $(this).offset()
                };
                $(document).bind('mouseup', current, upSelector);
                $(document).bind('mousedown', current, moveSelector);
                $(document).bind('mousemove', current, moveSelector);
            },
            
            moveSelector = function (ev) {
                var cal = ev.data.cal;
                var hsb_s = parseInt(100*(Math.max(0,Math.min(150,(ev.pageX - ev.data.pos.left))))/150, 10);
                var hsb_b = parseInt(100*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.pos.top))))/150, 10);
                hsb_h = cal.data('colorpicker').color.h;
                cal.data('colorpicker').color = fixHSB({
                     h: hsb_h,
                     s: hsb_s,
                     b: hsb_b
                 });
                 update(cal);
                 return false;
            },
            
            upSelector = function (ev) {
                $(document).unbind('mouseup', upSelector);
                $(document).unbind('mousedown', moveSelector);
                $(document).unbind('mousemove', moveSelector);
                return false;
            },
            
            toggle = function(ev) {
                var cal = $('#' + $(this).data('colorpickerId'));
                if( cal.css('display') == "none" )
                {
                    show.apply( this );
                }
                else
                {
                    cal.hide();
                }
            },
            
            show = function (ev) {
                var cal = $('#' + $(this).data('colorpickerId'));
                cal.data('colorpicker').onBeforeShow.apply(this, [cal.get(0)]);
                var pos = $(this).offset();
                var viewPort = getViewport();
                var top = pos.top + this.offsetHeight;
                var left = pos.left;
                if (top + 176 > viewPort.t + viewPort.h) {
                    top -= this.offsetHeight + 176;
                }
                if (left + 208 > viewPort.l + viewPort.w) {
                    left -= (208 - $(this).width() - 10);
                }
                cal.css({left: left + 'px', top: top + 'px'});
                if (cal.data('colorpicker').onShow.apply(this, [cal.get(0)]) != false) {
                    cal.show();
                }
                $(document).bind('mousedown keyup', {cal: cal, el: this}, hide);
                return false;
            },
            
            hide = function (ev) {
                if (ev.type == 'keyup' && ev.keyCode != 27)
                    return true;
                    
                if (ev.type == 'mousedown' && (isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0)) ||
                isChildOf(ev.data.el, ev.target, ev.data.el))) {
                    return true;
                }
                
                if (ev.data.cal.data('colorpicker').onHide.apply(this, [ev.data.cal.get(0)]) != false) {
                    ev.data.cal.hide();
                }
                
                $(document).unbind('mousedown keyup', hide);
            },
            
            isChildOf = function(parentEl, el, container) {
                if (parentEl == el) {
                    return true;
                }
                if (parentEl.contains) {
                    return parentEl.contains(el);
                }
                if ( parentEl.compareDocumentPosition ) {
                    return !!(parentEl.compareDocumentPosition(el) & 16);
                }
                var prEl = el.parentNode;
                while(prEl && prEl != container) {
                    if (prEl == parentEl)
                        return true;
                    prEl = prEl.parentNode;
                }
                return false;
            },
            
            getViewport = function () {
                var m = document.compatMode == 'CSS1Compat';
                return {
                    l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
                    t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
                    w : $(window).width() || (m ? document.documentElement.clientWidth : document.body.clientWidth),
                    h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
                };
            },
            
            fixHSB = function (hsb) {
                return {
                    h: Math.min(360, Math.max(0, hsb.h)),
                    s: Math.min(100, Math.max(0, hsb.s)),
                    b: Math.min(100, Math.max(0, hsb.b))
                };
            },
            
            fixRGB = function (rgb) {
                return {
                    r: Math.min(255, Math.max(0, rgb.r)),
                    g: Math.min(255, Math.max(0, rgb.g)),
                    b: Math.min(255, Math.max(0, rgb.b))
                };
            },
            
            fixHex = function (hex) {
                var len = 6 - hex.length;
                if (len > 0) {
                    var o = [];
                    for (var i=0; i<len; i++) {
                        o.push('0');
                    }
                    o.push(hex);
                    hex = o.join('');
                }
                return hex;
            },
            
            HexToRGB = function (hex) {
                var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
                return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
            },
            
            HexToHSB = function (hex) {
                return RGBToHSB(HexToRGB(hex));
            },
            
            RGBToHSB = function (rgb) {
                var hsb = {
                    h: 0,
                    s: 0,
                    b: 0
                };
                var min = Math.min(rgb.r, rgb.g, rgb.b);
                var max = Math.max(rgb.r, rgb.g, rgb.b);
                var delta = max - min;
                hsb.b = max;
                if (max != 0) {
                    
                }
                hsb.s = max != 0 ? 255 * delta / max : 0;
                if (hsb.s != 0) {
                    if (rgb.r == max) {
                        hsb.h = (rgb.g - rgb.b) / delta;
                    } else if (rgb.g == max) {
                        hsb.h = 2 + (rgb.b - rgb.r) / delta;
                    } else {
                        hsb.h = 4 + (rgb.r - rgb.g) / delta;
                    }
                } else {
                    hsb.h = -1;
                }
                hsb.h *= 60;
                if (hsb.h < 0) {
                    hsb.h += 360;
                }
                hsb.s *= 100/255;
                hsb.b *= 100/255;
                return hsb;
            },
            
            HSBToRGB = function (hsb) {
                var rgb = {};
                var h = Math.round(hsb.h);
                var s = Math.round(hsb.s*255/100);
                var v = Math.round(hsb.b*255/100);
                if(s == 0) {
                    rgb.r = rgb.g = rgb.b = v;
                } else {
                    var t1 = v;
                    var t2 = (255-s)*v/255;
                    var t3 = (t1-t2)*(h%60)/60;
                    if(h==360) h = 0;
                    if(h<60) {rgb.r=t1; rgb.b=t2; rgb.g=t2+t3}
                    else if(h<120) {rgb.g=t1; rgb.b=t2; rgb.r=t1-t3}
                    else if(h<180) {rgb.g=t1; rgb.r=t2; rgb.b=t2+t3}
                    else if(h<240) {rgb.b=t1; rgb.r=t2; rgb.g=t1-t3}
                    else if(h<300) {rgb.b=t1; rgb.g=t2; rgb.r=t2+t3}
                    else if(h<360) {rgb.r=t1; rgb.g=t2; rgb.b=t1-t3}
                    else {rgb.r=0; rgb.g=0; rgb.b=0}
                }
                return {r:Math.round(rgb.r), g:Math.round(rgb.g), b:Math.round(rgb.b)};
            },
            
            RGBToHex = function (rgb) {
                var hex = [
                    rgb.r.toString(16),
                    rgb.g.toString(16),
                    rgb.b.toString(16)
                ];
                $.each(hex, function (nr, val) {
                    if (val.length == 1) {
                        hex[nr] = '0' + val;
                    }
                });
                return hex.join('');
            },
            
            HSBToHex = function (hsb) {
                return RGBToHex(HSBToRGB(hsb));
            };
        return {
            init: function (opt) {
                opt = $.extend({}, defaults, opt||{});
                if (typeof opt.color == 'string') {
                    opt.color = HexToHSB(opt.color);
                } else if (opt.color.r != undefined && opt.color.g != undefined && opt.color.b != undefined) {
                    opt.color = RGBToHSB(opt.color);
                } else if (opt.color.h != undefined && opt.color.s != undefined && opt.color.b != undefined) {
                    opt.color = fixHSB(opt.color);
                } else {
                    return this;
                }
                return this.each(function () {
                    if (!$(this).data('colorpickerId')) {
                        var options = $.extend({}, opt);
                        var id = 'colorpicker_' + parseInt(Math.random() * 1000);
                        $(this).data('colorpickerId', id);
                        var cal = $(tpl).attr('id', id);
                        if (options.flat) {
                            cal.appendTo(this).show();
                        } else {
                            cal.appendTo(options.appendToElement);
                        }
                        options.selector = cal.find('div.stylebot_colorpicker_color').bind('mousedown', downSelector);
                        options.selectorIndic = options.selector.find('div div');
                        options.el = this;
                        options.hue = cal.find('div.stylebot_colorpicker_hue div');
                        cal.find('div.stylebot_colorpicker_hue').bind('mousedown', downHue);
                        cal.data('colorpicker', options);
                        setHue(options.color, cal.get(0));
                        setSelector(options.color, cal.get(0));
                        if (options.flat) {
                            cal.css({
                                position: 'relative',
                                display: 'block'
                            });
                        } else {
                            $(this).bind(options.eventName, toggle);
                        }
                    }
                });
            },
            
            togglePicker: function() {
                this.each( function() {
                    if( $(this).data('colorpickerId') ) {
                        toggle.apply( this );
                    }
                })
            },
            
            showPicker: function() {
                return this.each( function () {
                    if ( $(this).data('colorpickerId') ) {
                        show.apply( this );
                    }
                });
            },
            
            hidePicker: function() {
                return this.each( function () {
                    if ( $(this).data('colorpickerId') ) {
                        $('#' + $(this).data('colorpickerId')).hide();
                    }
                });
            },
            
            setColor: function(col) {
                if (typeof col == 'string') {
                    col = HexToHSB(col);
                } else if (col.r != undefined && col.g != undefined && col.b != undefined) {
                    col = RGBToHSB(col);
                } else if (col.h != undefined && col.s != undefined && col.b != undefined) {
                    col = fixHSB(col);
                } else {
                    return this;
                }
                return this.each(function(){
                    if ($(this).data('colorpickerId')) {
                        var cal = $('#' + $(this).data('colorpickerId'));
                        cal.data('colorpicker').color = col;
                        setHue(col, cal.get(0));
                        setSelector(col, cal.get(0));
                    }
                });
            }
        };
    }();
    
    $.fn.extend({
        ColorPicker: ColorPicker.init,
        ColorPickerHide: ColorPicker.hidePicker,
        ColorPickerShow: ColorPicker.showPicker,
        ColorPickerToggle: ColorPicker.togglePicker,
        ColorPickerSetColor: ColorPicker.setColor
    });
})(jQuery)