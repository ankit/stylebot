/**
  * stylebot.undo
  *
  * Manages the states for undo in Stylebot editor
  */
stylebot.undo = {
  states: [],

  /**
    * Enables the undo button in editor
    */
  enable: function() {
    stylebot.widget.enableUndoButton();
  },

  /**
    * Disables the undo button in editor
    */
  disable: function() {
    stylebot.widget.disableUndoButton();
  },

  /**
    * Enables / disables the undo button based on if any states are stored
    */
  refresh: function() {
    if (this.isEmpty())
      this.disable();
    else
      this.enable();
  },

  /**
    * Checks if the states are empty.
    * @return {boolean} Returns true if no states exist
    */
  isEmpty: function() {
    if (this.states.length == 0)
      return true;
    else
      return false;
  },

  /**
    * Removes last saved state
    */
  pop: function() {
    return this.states.pop();
  },

  /**
    * Adds a new state
    * @param {object} state State to save
    */
  push: function(state) {
    this.states.push(state);
  }
}