// Generated by CoffeeScript 1.12.6
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define(function(require, exports, module) {
    var AUTO_INSERT, Behaviour, COMMENT_CONTEXT, CORRESPONDING_CLOSING, DO_NOTHING, EQUATION_CONTEXT, ESCAPE_TOKENTYPE, KEYWORD_TOKENTYPE, LatexBehaviour, RPAREN_TOKENTYPE, SKIP, SKIP_TWO, STORAGE_TOKENTYPE, dollarsDeletionAction, dollarsInsertionAction, getBracketInsertionAction, getBracketsDeletionAction, getContext, getWrapped, isEscapedInsertion, isType, ref, ref1;
    Behaviour = require("ace/mode/behaviour").Behaviour;
    ref = require("ace/ext/papeeria/latex_parsing_context"), COMMENT_CONTEXT = ref.COMMENT_CONTEXT, EQUATION_CONTEXT = ref.EQUATION_CONTEXT, getContext = ref.getContext;
    ref1 = require("ace/ext/papeeria/papeeria_latex_highlight_rules"), ESCAPE_TOKENTYPE = ref1.ESCAPE_TOKENTYPE, RPAREN_TOKENTYPE = ref1.RPAREN_TOKENTYPE, STORAGE_TOKENTYPE = ref1.STORAGE_TOKENTYPE, KEYWORD_TOKENTYPE = ref1.KEYWORD_TOKENTYPE, isType = ref1.isType;
    CORRESPONDING_CLOSING = {
      '(': ')',
      '[': ']',
      '{': '}'
    };
    isEscapedInsertion = function(token, column) {
      return (token != null) && (isType(token, ESCAPE_TOKENTYPE) || isType(token, KEYWORD_TOKENTYPE) || isType(token, STORAGE_TOKENTYPE)) && column - token.start === 1;
    };
    DO_NOTHING = null;
    AUTO_INSERT = {
      text: "$$",
      selection: [1, 1]
    };
    SKIP = {
      text: "",
      selection: [1, 1]
    };
    dollarsInsertionAction = function(state, action, editor, session, text) {
      var column, line, nextChar, nextToken, prevChar, ref2, row, selected, selection, shouldSkip, token;
      if (editor.inMultiSelectMode || text !== '$') {
        return DO_NOTHING;
      }
      ref2 = editor.getCursorPosition(), row = ref2.row, column = ref2.column;
      line = session.getLine(row);
      selection = editor.getSelectionRange();
      selected = session.getTextRange(selection);
      if (selected !== "") {
        if (editor.getWrapBehavioursEnabled()) {
          return getWrapped(selection, selected, text, text);
        } else {
          return DO_NOTHING;
        }
      }
      token = session.getTokenAt(row, column);
      nextToken = session.getTokenAt(row, column + 1);
      if (getContext(session, row, column) === COMMENT_CONTEXT || isEscapedInsertion(token, column)) {
        return DO_NOTHING;
      }
      prevChar = line[column - 1] || '';
      nextChar = line[column] || '';
      if (getContext(session, row, column) === EQUATION_CONTEXT) {
        if (nextChar === '$') {
          return SKIP;
        } else {
          return DO_NOTHING;
        }
      }
      shouldSkip = nextChar === '$' && (prevChar !== '$' || isType(nextToken, RPAREN_TOKENTYPE));
      if (shouldSkip) {
        return SKIP;
      } else {
        return AUTO_INSERT;
      }
    };
    dollarsDeletionAction = function(state, action, editor, session, range) {
      var line, nextChar, selected, token;
      if (editor.inMultiSelectMode) {
        return DO_NOTHING;
      }
      selected = session.doc.getTextRange(range);
      if (selected !== '$') {
        return DO_NOTHING;
      }
      line = session.getLine(range.start.row);
      token = session.getTokenAt(range.end.row, range.end.column);
      nextChar = line[range.start.column + 1];
      if (nextChar === '$' && !(isType(token, ESCAPE_TOKENTYPE))) {
        range.end.column++;
        return range;
      }
    };
    getWrapped = function(selection, selected, opening, closing) {
      var rowDiff;
      rowDiff = selection.end.row - selection.start.row;
      return {
        text: opening + selected + closing,
        selection: [0, selection.start.column + 1, rowDiff, selection.end.column + (rowDiff !== 0 ? 0 : 1)]
      };
    };
    SKIP_TWO = {
      text: "",
      selection: [2, 2]
    };
    getBracketInsertionAction = function(opening) {
      var closing;
      closing = CORRESPONDING_CLOSING[opening];
      return function(state, action, editor, session, text) {
        var column, line, matching, nextChar, nextToken, ref2, ref3, row, selected, selection, shouldComplete, token;
        if (editor.inMultiSelectMode) {
          return DO_NOTHING;
        }
        ref2 = editor.getCursorPosition(), row = ref2.row, column = ref2.column;
        line = session.getLine(row);
        switch (text) {
          case opening:
            selection = editor.getSelectionRange();
            selected = session.getTextRange(selection);
            if (selected !== "") {
              if (editor.getWrapBehavioursEnabled()) {
                return getWrapped(selection, selected, opening, closing);
              } else {
                return DO_NOTHING;
              }
            }
            token = session.getTokenAt(row, column);
            if (isEscapedInsertion(token, column)) {
              shouldComplete = opening !== '{' && getContext(session, row, column) !== EQUATION_CONTEXT;
              if (shouldComplete) {
                return {
                  text: opening + '\\' + closing,
                  selection: [1, 1]
                };
              } else {
                return DO_NOTHING;
              }
            }
            if (!((ref3 = editor.completer) != null ? ref3.activated : void 0) && getContext(session, row, column) !== COMMENT_CONTEXT) {
              return {
                text: opening + closing,
                selection: [1, 1]
              };
            }
            break;
          case closing:
            nextChar = line[column];
            if (nextChar === closing) {
              matching = session.$findOpeningBracket(closing, {
                column: column + 1,
                row: row
              });
              if (matching != null) {
                return SKIP;
              } else {
                return DO_NOTHING;
              }
            }
            if (opening === '{') {
              return DO_NOTHING;
            }
            nextToken = session.getTokenAt(row, column + 1);
            if (nextChar === "\\" && line[column + 1] === closing && isType(nextToken, RPAREN_TOKENTYPE)) {
              return SKIP_TWO;
            }
        }
      };
    };
    getBracketsDeletionAction = function(opening) {
      var closing;
      closing = CORRESPONDING_CLOSING[opening];
      return function(state, action, editor, session, range) {
        var column, line, nextChar, nextNextChar, prevChar, ref2, row, selected;
        if (editor.inMultiSelectMode || range.isMultiLine()) {
          return DO_NOTHING;
        }
        selected = session.doc.getTextRange(range);
        if (selected !== opening) {
          return DO_NOTHING;
        }
        ref2 = range.start, row = ref2.row, column = ref2.column;
        line = session.doc.getLine(row);
        nextChar = line[column + 1];
        if (nextChar === closing) {
          range.end.column += 1;
          return range;
        }
        if (opening === '{') {
          return DO_NOTHING;
        }
        prevChar = line[column - 1];
        nextNextChar = line[column + 2];
        if (prevChar === '\\' && nextChar === '\\' && nextNextChar === closing) {
          range.end.column += 2;
          return range;
        }
      };
    };
    LatexBehaviour = (function(superClass) {
      extend(LatexBehaviour, superClass);

      function LatexBehaviour() {
        this.add("dollars", "insertion", dollarsInsertionAction);
        this.add("dollars", "deletion", dollarsDeletionAction);
        this.add("braces", "insertion", getBracketInsertionAction('{'));
        this.add("braces", "deletion", getBracketsDeletionAction('{'));
        this.add("parens", "insertion", getBracketInsertionAction('('));
        this.add("parens", "deletion", getBracketsDeletionAction('('));
        this.add("brackets", "insertion", getBracketInsertionAction('['));
        this.add("brackets", "deletion", getBracketsDeletionAction('['));
      }

      return LatexBehaviour;

    })(Behaviour);
    exports.LatexBehaviour = LatexBehaviour;
  });

}).call(this);

//# sourceMappingURL=latex_behaviour.js.map