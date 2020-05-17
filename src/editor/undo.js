/**
 * stylebot.undo
 *
 * Manages the states for undo in Stylebot editor
 */
stylebot.undo = {
  states: [],

  /**
   * Enable the undo button in editor
   */
  enable: function () {
    stylebot.widget.enableUndoButton();
  },

  /**
   * Disable the undo button in editor
   */
  disable: function () {
    stylebot.widget.disableUndoButton();
  },

  /**
   * Enable / disable the undo button based on if any states are stored
   */
  refresh: function () {
    if (this.isEmpty()) {
      this.disable();
    } else {
      this.enable();
    }
  },

  /**
   * Check if the states are empty.
   * @return {boolean} Returns true if no states exist
   */
  isEmpty: function () {
    if (this.states.length === 0) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * Remove last saved state
   */
  pop: function () {
    return this.states.pop();
  },

  /**
   * Add a new state
   * @param {object} state State to save
   */
  push: function (state) {
    this.states.push(state);
  },
};
