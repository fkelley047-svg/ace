// Generated by CoffeeScript 1.10.0
(function() {
  define([], function() {
    var Range, TokenIterator, clearCurrentHighlight, findSurroundingBrackets, highlightBrackets, init, newFakeToken, newFilteringIterator, toggleSurroundingBracketsPopup;
    TokenIterator = null;
    Range = null;
    clearCurrentHighlight = function(session) {
      if (session.$bracketMatchHighlight || session.$bracketMismatchHighlight) {
        session.removeMarker(session.$bracketMatchHighlight);
        session.removeMarker(session.$bracketMismatchHighlight);
        session.$bracketMatchHighlight = null;
        session.$bracketMismatchHighlight = null;
        return session.$highlightRange = null;
      }
    };
    highlightBrackets = function(editor, pos) {
      var range, rangeLeft, rangeRight, session;
      session = editor.getSession();
      clearCurrentHighlight(session);
      if (pos == null) {
        pos = findSurroundingBrackets(editor);
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
    newFakeToken = function(pos) {
      return {
        token: "",
        row: pos.row,
        column: pos.column,
        contains: function(pos) {
          return this.row === pos.row && this.column === pos.column;
        }
      };
    };
    newFilteringIterator = function(session, pos, isForward) {
      var result, token, tokenIterator, typeRe;
      tokenIterator = new TokenIterator(session, pos.row, pos.column);
      token = tokenIterator.getCurrentToken();
      if (token == null) {
        token = tokenIterator.stepForward();
      }
      if (token == null) {
        return null;
      }
      typeRe = /(\.?.paren)+/;
      result = session.$newFilteringIterator(tokenIterator, function(filteringIterator) {
        token = tokenIterator.getCurrentToken();
        while (token && !typeRe.test(token.type)) {
          token = isForward ? tokenIterator.stepForward() : tokenIterator.stepBackward();
        }
        if (token != null) {
          filteringIterator.$updateCurrent();
          if (isForward) {
            tokenIterator.stepForward();
          } else {
            tokenIterator.stepBackward();
          }
          return true;
        } else {
          filteringIterator.$current = null;
          return false;
        }
      });
      if (isForward) {
        if (!result.next()) {
          return null;
        }
      } else {
        result.$current = newFakeToken(pos);
      }
      return result;
    };
    findSurroundingBrackets = function(editor) {
      var allBrackets, expectedRightBracket, key, leftCandidate, leftNearest, pos, result, rightBracket, rightCandidate, rightNearest, session;
      session = editor.getSession();
      pos = editor.getCursorPosition();
      allBrackets = {
        left: [session.$findOpeningBracket('}', pos, newFilteringIterator(session, pos, false)), session.$findOpeningBracket(']', pos, newFilteringIterator(session, pos, false)), session.$findOpeningBracket(')', pos, newFilteringIterator(session, pos, false))],
        right: [session.$findClosingBracket('{', pos, newFilteringIterator(session, pos, true)), session.$findClosingBracket('[', pos, newFilteringIterator(session, pos, true)), session.$findClosingBracket('(', pos, newFilteringIterator(session, pos, true))]
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
        },
        isDefined: function() {
          return (this.left != null) || (this.right != null);
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
    init = function(ace, editor, bindKey, candidateToggleSurroundingBracketsPopup) {
      var keyboardHandler, session;
      Range = ace.require("ace/range").Range;
      TokenIterator = ace.require("ace/token_iterator").TokenIterator;
      if (candidateToggleSurroundingBracketsPopup) {
        toggleSurroundingBracketsPopup = candidateToggleSurroundingBracketsPopup;
      }
      session = editor.getSession();
      keyboardHandler = {
        name: 'highlightBrackets',
        bindKey: bindKey,
        exec: function(editor) {
          session = editor.getSession();
          if (session.$highlightRange) {
            return clearCurrentHighlight(session);
          } else {
            return highlightBrackets(editor);
          }
        },
        readOnly: true
      };
      editor.commands.addCommand(keyboardHandler);
      session.getSelection().on("changeCursor", function() {
        var candidateRange, currentRange;
        currentRange = session.$highlightRange;
        if (currentRange != null) {
          candidateRange = findSurroundingBrackets(editor);
          if (!currentRange.equals(candidateRange) && (candidateRange != null ? candidateRange.isDefined() : void 0)) {
            highlightBrackets(editor, candidateRange);
          }
        }
      });
      session.on("changeScrollTop", function() {
        toggleSurroundingBracketsPopup(editor);
      });
      session.on("changeScrollLeft", function() {
        toggleSurroundingBracketsPopup(editor);
      });
    };
    return {
      highlightBrackets: highlightBrackets,
      findSurroundingBrackets: findSurroundingBrackets,
      init: init
    };
  });

}).call(this);