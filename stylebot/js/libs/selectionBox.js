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
        this.edges[edge].hide();
}

SelectionBox.prototype.show = function() {
    for( var edge in this.edges )
        this.edges[edge].show();
}

SelectionBox.prototype.highlight = function( el ) {
    var offset = el.offset();
    var w = el.width();
    var h = el.height();
    
    this.updatePosition( offset.left, offset.top, w, h );
}