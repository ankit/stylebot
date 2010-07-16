/**
  * Selection of DOM elements
  * 
  * Based on Firebug's Implementation
 **/

var SelectionBox = function( edgeSize, className ) {
    
    this.edgeSize = edgeSize;
    this.className = className;
    
    this.edges = {};
    this.edges.top = this.createEdge();
    this.edges.right = this.createEdge();
    this.edges.bottom = this.createEdge();
    this.edges.left = this.createEdge();
    
    for( var edge in this.edges )
        this.edges[edge].appendTo( document.body );
}

SelectionBox.prototype.updatePosition = function( x, y, w, h ) {
    // move
    this.moveEdge( "top", x, y-this.edgeSize );
    this.moveEdge( "right", x+w, y-this.edgeSize );
    this.moveEdge( "bottom", x, y+h );
    this.moveEdge( "left", x-this.edgeSize, y-this.edgeSize );
    
    // resize
    this.resizeEdge( "top", w, this.edgeSize );
    this.resizeEdge( "right", this.edgeSize, h+this.edgeSize*2 );
    this.resizeEdge( "bottom", w, this.edgeSize );
    this.resizeEdge( "left", this.edgeSize, h+this.edgeSize*2 );
}

SelectionBox.prototype.createEdge = function() {
    return $( '<div>', {
        class: this.className
    });
}

SelectionBox.prototype.moveEdge = function( edge, x, y ) {
    this.edges[edge].css( 'left', x + "px" );
    this.edges[edge].css( 'top', y + "px" );
}

SelectionBox.prototype.resizeEdge = function( edge, w, h ) {
    this.edges[edge].width(w);
    this.edges[edge].height(h);
}

SelectionBox.prototype.hide = function() {
    for( var edge in this.edges )
        this.edges[edge].width(0).height(0);
}

SelectionBox.prototype.highlight = function( el ) {
    if ( !el ){
        this.hide(); return;
    }
    if( el.nodeType != 1 )
        el = el.parentNode;
    
    var offset = this.getViewOffset( el, true );
    var w = el.offsetWidth;
    var h = el.offsetHeight;
    
    this.updatePosition( offset.x, offset.y, w, h );
}

// from lib.js in Firebug
SelectionBox.prototype.getViewOffset = function( elt )
{
    function addOffset(elt, coords, view)
    {
        var p = elt.offsetParent;
        coords.x += elt.offsetLeft - (p ? p.scrollLeft : 0);
        coords.y += elt.offsetTop - (p ? p.scrollTop : 0);

        if (p)
        {
            if (p.nodeType == 1)
            {
                var parentStyle = view.getComputedStyle(p, "");
                if (parentStyle.position != "static")
                {
                    coords.x += parseInt(parentStyle.borderLeftWidth);
                    coords.y += parseInt(parentStyle.borderTopWidth);

                    if (p.localName == "TABLE")
                    {
                        coords.x += parseInt(parentStyle.paddingLeft);
                        coords.y += parseInt(parentStyle.paddingTop);
                    }
                    else if (p.localName == "BODY")
                    {
                        var style = view.getComputedStyle(elt, "");
                        coords.x += parseInt(style.marginLeft);
                        coords.y += parseInt(style.marginTop);
                    }
                }
                else if (p.localName == "BODY")
                {
                    coords.x += parseInt(parentStyle.borderLeftWidth);
                    coords.y += parseInt(parentStyle.borderTopWidth);
                }

                var parent = elt.parentNode;
                while (p != parent)
                {
                    coords.x -= parent.scrollLeft;
                    coords.y -= parent.scrollTop;
                    parent = parent.parentNode;
                }
                addOffset(p, coords, view);
            }
        }
        else
        {
            if (elt.localName == "BODY")
            {
                var style = view.getComputedStyle(elt, "");
                coords.x += parseInt(style.borderLeftWidth);
                coords.y += parseInt(style.borderTopWidth);

                var htmlStyle = view.getComputedStyle(elt.parentNode, "");
                coords.x -= parseInt(htmlStyle.paddingLeft);
                coords.y -= parseInt(htmlStyle.paddingTop);
            }

            if (elt.scrollLeft)
                coords.x += elt.scrollLeft;
            if (elt.scrollTop)
                coords.y += elt.scrollTop;
        }
    }

    var coords = {x: 0, y: 0};
    if (elt)
        addOffset(elt, coords, elt.ownerDocument.defaultView);

    return coords;
};

SelectionBox.prototype.destroy = function() {
    for( var edge in this.edges )
        this.edges[edge].remove();
}