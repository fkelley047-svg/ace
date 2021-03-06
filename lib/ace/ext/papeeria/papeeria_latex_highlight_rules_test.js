if (typeof process !== "undefined") {
    require("amd-loader");
    require("../../test/mockdom");
}

define(function(require, exports, module) {
    var Tokenizer = require("ace/tokenizer").Tokenizer;
    var RulesModule = require("ace/ext/papeeria/papeeria_latex_highlight_rules");
    var PapeeriaLatexHighlightRules = RulesModule.PapeeriaLatexHighlightRules;
    var EQUATION_TOKENTYPE = RulesModule.EQUATION_TOKENTYPE;
    var MATH_ENVIRONMENT_DISPLAYED_NUMBERED_STATE = RulesModule.MATH_ENVIRONMENT_DISPLAYED_NUMBERED_STATE;
    var MATH_ENVIRONMENT_DISPLAYED_STATE = RulesModule.MATH_ENVIRONMENT_DISPLAYED_STATE;
    var MATH_TEX_INLINE_STATE = RulesModule.MATH_TEX_INLINE_STATE;
    var MATH_TEX_DISPLAYED_STATE = RulesModule.MATH_TEX_DISPLAYED_STATE;
    var MATH_LATEX_INLINE_STATE = RulesModule.MATH_LATEX_INLINE_STATE;
    var MATH_LATEX_DISPLAYED_STATE = RulesModule.MATH_LATEX_DISPLAYED_STATE;
    var assert = require("ace/test/assertions");

    var isType = function(token, type) {
        return token.type.split(".").indexOf(type) > -1
    };

    var mathConstants = {};
    mathConstants[MATH_ENVIRONMENT_DISPLAYED_NUMBERED_STATE] = {
        "start"  : "\\begin{equation}",
        "end"    :"\\end{equation}",
        "length" :4
    };
    mathConstants[MATH_ENVIRONMENT_DISPLAYED_STATE] = {
        "start"  : "\\begin{equation*}",
        "end"    : "\\end{equation*}",
        "length" : 4
    };
    mathConstants[MATH_TEX_INLINE_STATE] = {
        "start"  : "$",
        "end"    : "$",
        "length" : 1
    };
    mathConstants[MATH_TEX_DISPLAYED_STATE] = {
        "start"  : "$$",
        "end"    : "$$",
        "length" : 1
    };
    mathConstants[MATH_LATEX_INLINE_STATE] = {
        "start"  : "\\(",
        "end"    : "\\)",
        "length" : 1
    };
    mathConstants[MATH_LATEX_DISPLAYED_STATE] = {
        "start"  : "\\[",
        "end"    : "\\]",
        "length" : 1
    };

    module.exports = {
        "test: entering equation state": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            // we do not append closing string in this test, because we only
            // test entering the equation state here
            var basicString = " x^2 \\text{hey} \\alpha \\$ % this is a comment";
            for (var state in mathConstants) {
                var stateConstants = mathConstants[state];
                var testString = stateConstants.start + basicString;
                var result = tokenizer.getLineTokens(testString);
                var tokens = result.tokens;
                var state = result.state;
                assert.ok(state.length);
                for (var i = stateConstants.length; i < tokens.length; i++) {
                    assert(isType(tokens[i], EQUATION_TOKENTYPE), state);
                }
            }
        },

        "test: exiting equation state": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            for (var state in mathConstants) {
                var stateConstants = mathConstants[state];
                var testString = stateConstants.end;
                var result = tokenizer.getLineTokens(testString, [state]);
                assert.equal(result.state, "start");
            }
        },

        "test: mismatching ends": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);

            for (var startState in mathConstants) {
                var startConstants = mathConstants[startState];
                for (var endState in mathConstants) {
                    var endConstants = mathConstants[endState];
                    if (endConstants.end.startsWith(startConstants.end)) {
                        continue;
                    }

                    var testString = startConstants.start + " " + endConstants.end;
                    var result = tokenizer.getLineTokens(testString);
                    assert.equal(result.state[result.state.length - 1], startState);
                }
            }
        },

        "test: nested equation starts": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);

            for (var initState in mathConstants) {
                var initStateConstants = mathConstants[initState];
                for (var innerState in mathConstants) {
                    // second condition is for skipping testing `$$`
                    // inside the equation state delimited with `$`
                    // because `$$` will and should be parsed as an
                    // end of this state (and then one more `$`)
                    if (innerState === initState || (initState === MATH_TEX_INLINE_STATE && innerState === MATH_TEX_DISPLAYED_STATE)) {
                        continue;
                    }
                    var innerStateConstants = mathConstants[innerState];

                    var result = tokenizer.getLineTokens(innerStateConstants.start, initState);
                    assert.equal(result.state, initState);
                }
            }
        },

        "test: $ \\alpha $$ \\beta $": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            var result = tokenizer.getLineTokens("$\\alpha$$\\beta$", "start");
            var tokens = result.tokens;

            assert(!isType(tokens[0], "equation"));
            assert(isType(tokens[1], "equation"));
            assert(!isType(tokens[2], "equation"));
            assert(!isType(tokens[3], "equation"));
            assert(isType(tokens[4], "equation"));
            assert(!isType(tokens[5], "equation"));
        },

        "test: nested lists: enumerate inside itemize": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            var result = tokenizer.getLineTokens("\\begin{itemize} \\item \\begin{enumerate} \\item hey", "start");
            var tokens = result.tokens;
            var state = result.state;

            assert.ok(state.length);
            assert.equal(state[state.length - 1], "list.enumerate");
        },

        "test: nested lists: itemize inside enumerate": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            var result = tokenizer.getLineTokens("\\begin{enumerate} \\item \\begin{itemize} \\item hey", "start");
            var tokens = result.tokens;
            var state = result.state;

            assert.ok(state.length);
            assert.equal(state[state.length - 1], "list.itemize");
        },

        "test: mismatching ends in lists: enumerate inside itemize": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            var result = tokenizer.getLineTokens("\\begin{itemize} \\end{enumerate} \\item", "start");
            var tokens = result.tokens;
            var state = result.state;

            assert.ok(state.length);
            assert.equal(state[state.length - 1], "list.itemize");
        },

        "test: mismatching ends in lists: itemize inside enumerate": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            var result = tokenizer.getLineTokens("\\begin{enumerate} \\end{itemize} \\item", "start");
            var tokens = result.tokens;
            var state = result.state;

            assert.ok(state.length);
            assert.equal(state[state.length - 1], "list.enumerate");
        },

        "test: equations in lists": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);

            for (var state in mathConstants) {
                stateConstants = mathConstants[state];
                var result = tokenizer.getLineTokens(stateConstants.start + " \\alpha", "list.itemize");
                assert.equal(result.state[result.state.length - 1], state);
            }
        },

        "test: cite tag empty": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            var result = tokenizer.getLineTokens("\\cite{}", "start");
            var tokens = result.tokens;

            assert(isType(tokens[1], "cite"))
            assert(isType(tokens[1], "lparen"))
        },

        "test: cite tag filled": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            var result = tokenizer.getLineTokens("\\cite{foo, bar}", "start");
            var tokens = result.tokens;

            assert(isType(tokens[2], "cite"))
            assert(isType(tokens[2], "parameter"))
            assert.equal("foo, bar", tokens[2].value)
        },

        "test: cite tag closes": function() {
            var rules = new PapeeriaLatexHighlightRules().getRules();
            var tokenizer = new Tokenizer(rules);
            var result = tokenizer.getLineTokens("\\cite{foo, bar} baz", "start");
            var tokens = result.tokens;

            assert(!isType(tokens[4], "cite"))
            assert.equal(" baz", tokens[4].value)
        }
    };
});
