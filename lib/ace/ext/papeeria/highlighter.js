// Generated by CoffeeScript 1.10.0
(function() {
  define(function(require, exports, module) {
    var Range, findSurroundingBrackets, highlightBrackets, init, toggleSurroundingBracketsPopup;
    Range = require("../../range").Range;
    highlightBrackets = function(editor) {
      var pos, range, rangeLeft, rangeRight, session;
      pos = findSurroundingBrackets(editor);
      session = editor.getSession();
      if (session.$bracketMatchHighlight || session.$bracketMismatchHighlight) {
        session.removeMarker(session.$bracketMatchHighlight);
        session.removeMarker(session.$bracketMismatchHighlight);
        session.$bracketMatchHighlight = null;
        session.$bracketMismatchHighlight = null;
        toggleSurroundingBracketsPopup(editor);
        return;
      }
      if (!pos.mismatch) {
        range = new Range(pos.left.row, pos.left.column, pos.right.row, pos.right.column + 1);
        session.$bracketMatchHighlight = session.addMarker(range, "ace_selection", "text");
      } else {
        if (pos.left && pos.right) {
          range = new Range(pos.left.row, pos.left.column, pos.right.row, pos.right.column + 1);
          session.$bracketMismatchHighlight = session.addMarker(range, "ace_error-marker", "text");
        }
        if (pos.left && !pos.right) {
          rangeLeft = new Range(pos.left.row, pos.left.column, Infinity, Infinity);
          session.$bracketMismatchHighlight = session.addMarker(rangeLeft, "ace_error-marker", "text");
        }
        if (pos.right && !pos.left) {
          rangeRight = new Range(0, 0, pos.right.row, pos.right.column + 1);
          session.$bracketMismatchHighlight = session.addMarker(rangeRight, "ace_error-marker", "text");
        }
      }
      session.$highlightRange = pos;
      toggleSurroundingBracketsPopup(editor, pos.left, pos.right);
    };
    findSurroundingBrackets = function(editor) {
      var allBrackets, expectedRightBracket, key, leftCandidate, leftNearest, positionLeftwards, positionRightwards, result, rightBracket, rightCandidate, rightNearest, session;
      session = editor.getSession();
      positionLeftwards = editor.getCursorPosition();
      if (session.getLine(positionLeftwards.row).length === positionLeftwards.column) {
        positionLeftwards.row += 1;
        positionLeftwards.column = 0;
      } else {
        positionLeftwards.column += 1;
      }
      positionRightwards = editor.getCursorPosition();
      allBrackets = {
        left: [session.$findOpeningBracket('}', positionLeftwards, /(\.?.paren)+/), session.$findOpeningBracket(']', positionLeftwards, /(\.?.paren)+/), session.$findOpeningBracket(')', positionLeftwards, /(\.?.paren)+/)],
        right: [session.$findClosingBracket('{', positionRightwards, /(\.?.paren)+/), session.$findClosingBracket('[', positionRightwards, /(\.?.paren)+/), session.$findClosingBracket('(', positionRightwards, /(\.?.paren)+/)]
      };
      leftNearest = null;
      rightNearest = null;
      key = 0;
      while (key < allBrackets.left.length) {
        leftCandidate = allBrackets.left[key];
        rightCandidate = allBrackets.right[key];
        if (!leftNearest) {
          leftNearest = leftCandidate;
        }
        if (!rightNearest) {
          rightNearest = rightCandidate;
        }
        if (leftCandidate) {
          if (leftNearest.row <= leftCandidate.row) {
            if (leftNearest.row === leftCandidate.row) {
              if (leftNearest.column < leftCandidate.column) {
                leftNearest = leftCandidate;
              }
            } else {
              leftNearest = leftCandidate;
            }
          }
        }
        if (rightCandidate) {
          if (rightNearest.row >= rightCandidate.row) {
            if (rightNearest.row === rightCandidate.row) {
              if (rightNearest.column > rightCandidate.column) {
                rightNearest = rightCandidate;
              }
            } else {
              rightNearest = rightCandidate;
            }
          }
        }
        key++;
      }
      result = {
        left: leftNearest,
        right: rightNearest,
        mismatch: true,
        equals: function(object) {
          if (object.left !== this.left) {
            return false;
          }
          if (object.right !== this.right) {
            return false;
          }
          if (object.mismatch !== this.mismatch) {
            return false;
          }
          return true;
        }
      };
      if (result.left && result.right) {
        expectedRightBracket = session.$brackets[session.getLine(result.left.row).charAt(result.left.column)];
        rightBracket = session.getLine(result.right.row).charAt(result.right.column);
        if (expectedRightBracket === rightBracket) {
          result.mismatch = false;
        }
      }
      return result;
    };
    toggleSurroundingBracketsPopup = function(editor) {};
    init = function(editor, bindKey, candidateToggleSurroundingBracketsPopup) {
      var isInsideCurrentHighlight, keyboardHandler, session;
      if (candidateToggleSurroundingBracketsPopup) {
        toggleSurroundingBracketsPopup = candidateToggleSurroundingBracketsPopup;
      }
      session = editor.getSession();
      keyboardHandler = {
        name: 'highlightBrackets',
        bindKey: bindKey,
        exec: function(editor) {
          return highlightBrackets(editor);
        },
        readOnly: true
      };
      editor.commands.addCommand(keyboardHandler);
      session.getSelection().on("changeCursor", function() {
        if (session.$bracketMatchHighlight || session.$bracketMismatchHighlight) {
          session.removeMarker(session.$bracketMatchHighlight);
          session.removeMarker(session.$bracketMismatchHighlight);
          session.$bracketMatchHighlight = null;
          session.$bracketMismatchHighlight = null;
          if (!isInsideCurrentHighlight()) {
            highlightBrackets(editor);
          }
        }
        toggleSurroundingBracketsPopup(editor);
      });
      session.on("changeScrollTop", function() {
        toggleSurroundingBracketsPopup(editor);
      });
      session.on("changeScrollLeft", function() {
        toggleSurroundingBracketsPopup(editor);
      });
      isInsideCurrentHighlight = function() {
        var newRange, oldRange;
        oldRange = session.$highlightRange;
        newRange = findSurroundingBrackets(editor);
        return oldRange.equals(newRange);
      };
    };
    return exports.highlighter = {
      highlightBrackets: highlightBrackets,
      findSurroundingBrackets: findSurroundingBrackets,
      init: init
    };
  });

}).call(this);