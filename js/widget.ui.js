/**
  * stylebot.widget.ui
  * 
  * UI Controls for Stylebot Widget
  **/
  
stylebot.widget.ui = {
    createControl: function(text, property){
        var el = $('<li class="stylebot-control"></li>');
        //add label
        $('<label class="stylebot-label">'+text+':</label>').appendTo(el);
        
        /* Property specific tools to add to control set */
        switch(property){
            case 'font-size'        :   this.createTextfield(property, 4).appendTo(el);el.html(el.html() + " px");
                                        break;
                                        
            case 'color'            :   this.createTextfield(property, 10).appendTo(el);
                                        break;
                                        
            case 'background-color' :   this.createTextfield(property, 10).appendTo(el);
                                        break;
                                        
            case 'display'          :   this.createCheckbox(null, property, 'none').appendTo(el);
                                        break;
                                        
            case 'style'            :   // this.createCheckbox("<b>Bold</b>", 'font-weight', 'bold').appendTo(el);
                                        // this.createCheckbox("<i>Italic</i>", 'font-style', 'italic').appendTo(el);
                                        this.createRadio("<b>B</b>", "style", ['font-weight','font-style'], ['bold', 'none']).appendTo(el);
                                        this.createRadio("<i>i</i>", "style", ['font-weight','font-style'], ['none', 'italic']).appendTo(el);
                                        this.createRadio("<b>B</b> + <i>i</i>", "style", ['font-weight','font-style'], ['bold','italic']).appendTo(el);
                                        this.createRadio("None", "style", ['font-weight','font-style'], ['normal','none']).appendTo(el);
                                        break;
                                        
            case 'text-decoration'  :   this.createRadio("<u>underline</u>", property, property, 'underline').appendTo(el);
                                        this.createRadio("None", property, property, 'none').appendTo(el);
                                        break;
        }
        return el;
    },
    createTextfield: function(property, size){
        return $('<input type="text" class="stylebot-textfield stylebot-tool" stylebot-property="'+ property +'" size="'+ size +'" />');
    },
    createCheckbox: function(text, property, value){
        var checkbox = $('<input type="checkbox" class="stylebot-tool stylebot-checkbox" stylebot-property="'+ property +'" value="'+ value +'"/> ');
        if(text)
        {
            var span = $('<span class="stylebot-tool"></span>');
            checkbox.appendTo(span);
            $('<label class="stylebot-inline-label">'+text+'</label>').appendTo(span);
            return span;
        }
        else
            return checkbox;
    },
    createRadio: function(text, name, property, value){
        var span = $('<span class="stylebot-tool"></span>');
        var radio;
        if(typeof(property) == 'string')
            radio = $('<input type="radio" name = "'+ name +'" class="stylebot-tool stylebot-radio" stylebot-property="'+ property +'" value="'+ value +'"/> ');
        else
            radio = $('<input type="radio" name = "'+ name +'" class="stylebot-tool stylebot-radio" stylebot-property="'+ property.join(",") +'" value="'+ value.join(",") +'"/> ');
        radio.appendTo(span);
        $('<label class="stylebot-inline-label">'+text+'</label>').appendTo(span);
        return span;
    }
}