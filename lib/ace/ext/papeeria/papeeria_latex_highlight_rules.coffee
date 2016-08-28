foo = null # ACE builder wants some meaningful JS code here to use ace.define instead of just define

define((require, exports, module) ->
  "use strict"
  oop = require("../../lib/oop")
  TextHighlightRules = require("../../mode/text_highlight_rules").TextHighlightRules
  LIST_REGEX = "itemize|enumerate"
  EQUATION_REGEX = "equation|equation\\*"
  LIST_STATE = "list"
  EQUATION_STATE = "equation"
  exports.EQUATION_STATE = EQUATION_STATE
  exports.LIST_STATE = LIST_STATE
  PapeeriaLatexHighlightRules = ->
    ###*
    * We maintain a stack of nested LaTeX semantic types (e.g. "document", "section", "list"
    * to be able to provide context for autocompletion and other functions.
    * Stack is constructed by the background highlighter;
    * its elements are then propagated to * the editor session and become
    * available through getContext method.
    *
    * The exact semantics of the rules for the use described in the file tokenizer.js
    * @param {pushedState} string
    * @return {function} function, which correctly puts new type(pushedState) on stack
   ###


    pushState = (pushedState) ->
      return (currentState, stack) ->
        if currentState == "start"
          stack.push(currentState, pushedState)
        else
          stack.push(pushedState)
        return pushedState

    #The same as pushState, but switch our finite state to "to" state
    pushStateCheckout = (pushedState, to) ->
      return (currentState, stack) ->
        if currentState == "start"
          stack.push(currentState, pushedState)
        else
          stack.push(pushedState)
        return to

    popState = (currentState, stack) ->
      return stack.pop() or "start"

    basicRules = [
      {
        token: "comment"
        regex: "%.*$"
      }
      {
        token: [
          "keyword"
          "lparen"
          "variable.parameter"
          "rparen"
          "lparen"
          "storage.type"
          "rparen"
        ]
        regex: "(\\\\(?:documentclass|usepackage|input))(?:(\\[)([^\\]]*)(\\]))?({)([^}]*)(})"
      }
      {
        token: [
          "storage.type"
          "lparen"
          "variable.parameter"
          "rparen"
        ]
        regex: "(\\\\(?:begin|end))({)(\\w*)(})"
      }
      {
        token: [
          "storage.type"
          "lparen.ref"
          "variable.parameter.ref"
          "rparen"
        ]
        regex: "(\\\\(?:ref))({)(\\w*)(})"
      }
      {
        token: [
          "keyword"
          "lparen"
          "variable.parameter"
          "rparen"
        ]
        regex: "(\\\\(?:label|v?ref|cite(?:[^{]*)))(?:({)([^}]*)(}))?"
      }
      {
        token : "string.math",
        regex : "\\\\\\[",
        next  : pushStateCheckout(EQUATION_STATE, "math_latex")
      }
      {
        token: "storage.type"
        regex: "\\\\[a-zA-Z]+"
      }
      {
        token: "lparen"
        regex: "[[({]"
      }
      {
        token: "rparen"
        regex: "[\\])}]"
      }
      {
        token: "constant.character.escape"
        regex: "\\\\[^a-zA-Z]?"
      }
      {
        token : "string.math",
        regex : "\\${1,2}",
        next  : pushStateCheckout(EQUATION_STATE, "math")
      }

    ]


    beginRule = (text = "\\w*", pushedState = "start") ->
      return {
        token: [
          "storage.type"
          "lparen"
          "variable.parameter"
          "rparen"
        ]
        regex: "(\\\\(?:begin))({)(" + text + ")(})"
        next: pushState(pushedState)
      }

    endRule = (text = "\\w*") ->
      return {
        token: [
          "storage.type"
          "lparen"
          "variable.parameter"
          "rparen"
        ]
        regex: "(\\\\(?:end))({)(" + text + ")(})"

        next: popState
      }

    # For unknown reasons  we can"t use constants in block below, because background_tokenizer
    # doesn"t like constants. It wants string literal
    @$rules =
      "start": [
        beginRule(LIST_REGEX, LIST_STATE)
        beginRule(EQUATION_REGEX, EQUATION_STATE)

        endRule(EQUATION_REGEX)
        endRule(LIST_REGEX)

      ]
      "equation": [
        beginRule(EQUATION_REGEX, EQUATION_STATE)
        beginRule(LIST_REGEX, LIST_STATE)

        endRule(EQUATION_REGEX)
        endRule(LIST_REGEX)

      ]
      "list": [
        beginRule(LIST_REGEX, LIST_STATE)
        beginRule(EQUATION_REGEX, EQUATION_STATE)

        endRule(EQUATION_REGEX)
        endRule(LIST_REGEX)
      ]
      "math" : [{
            token : "comment",
            regex : "%.*$"
        }, {
            token : "string.math",
            regex : "\\${1,2}",
            next  : popState
        }, {
          token: "storage.type.math"
          regex: "\\\\[a-zA-Z]+"
        }, {
          token: "constant.character.escape.math"
          regex: "\\\\[^a-zA-Z]?"
        }, {
            token : "error.math",
            regex : "^\\s*$",
            next : popState
        }, {
            defaultToken : "string.math"
        }
      ]
      "math_latex" : [{
            token : "comment",
            regex : "%.*$"
        }, {
            token : "string.math",
            regex : "\\\\]",
            next  : popState
        }, {
          token: "storage.type.math"
          regex: "\\\\[a-zA-Z]+"
        }, {
          token: "constant.character.escape.math"
          regex: "\\\\[^a-zA-Z]?"
        }, {
            token : "error.math",
            regex : "^\\s*$",
            next : popState
        }, {
            defaultToken : "string.math"
        }
      ]

    for key of @$rules
      for rule of basicRules
        @$rules[key].push(basicRules[rule])

    return

  oop.inherits(PapeeriaLatexHighlightRules, TextHighlightRules)
  exports.PapeeriaLatexHighlightRules = PapeeriaLatexHighlightRules
  return
)
