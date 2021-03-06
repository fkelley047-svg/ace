if (typeof process !== "undefined") {
    require("amd-loader");
    require("../../test/mockdom");
}

define(function(require, exports, module) {
    var EditSession = require("ace/edit_session").EditSession;
    var Editor = require("ace/editor").Editor;
    var MockRenderer = require("ace/test/mockrenderer").MockRenderer;
    var Range = require("ace/range").Range
    var TokenIterator = require("ace/token_iterator").TokenIterator;
    var assert = require("ace/test/assertions");
    var KatexPreviewer = require("ace/ext/papeeria/katex-previewer.js")
    var EquationRangeHandler = KatexPreviewer.EquationRangeHandler;
    var ConstrainedTokenIterator = KatexPreviewer.ConstrainedTokenIterator;
    var ContextHandler = KatexPreviewer.ContextHandler;
    var RulesModule = require("ace/ext/papeeria/papeeria_latex_highlight_rules");
    var PapeeriaLatexHighlightRules = RulesModule.PapeeriaLatexHighlightRules;
    var EQUATION_TOKENTYPE = RulesModule.EQUATION_TOKENTYPE;
    var MATH_ENVIRONMENT_DISPLAYED_NUMBERED_STATE = RulesModule.MATH_ENVIRONMENT_DISPLAYED_NUMBERED_STATE;
    var MATH_ENVIRONMENT_DISPLAYED_STATE = RulesModule.MATH_ENVIRONMENT_DISPLAYED_STATE;
    var MATH_TEX_INLINE_STATE = RulesModule.MATH_TEX_INLINE_STATE;
    var MATH_TEX_DISPLAYED_STATE = RulesModule.MATH_TEX_DISPLAYED_STATE;
    var MATH_LATEX_INLINE_STATE = RulesModule.MATH_LATEX_INLINE_STATE;
    var MATH_LATEX_DISPLAYED_STATE = RulesModule.MATH_LATEX_DISPLAYED_STATE;

    var mathConstants = {};
    mathConstants[MATH_ENVIRONMENT_DISPLAYED_NUMBERED_STATE] = {
        "start"  : "\\begin{equation}",
        "end"    : "\\end{equation}",
    };
    mathConstants[MATH_ENVIRONMENT_DISPLAYED_STATE] = {
        "start"  : "\\begin{equation*}",
        "end"    : "\\end{equation*}",
    };
    mathConstants[MATH_TEX_INLINE_STATE] = {
        "start"  : "$",
        "end"    : "$",
    };
    mathConstants[MATH_TEX_DISPLAYED_STATE] = {
        "start"  : "$$",
        "end"    : "$$",
    };
    mathConstants[MATH_LATEX_INLINE_STATE] = {
        "start"  : "\\(",
        "end"    : "\\)",
    };
    mathConstants[MATH_LATEX_DISPLAYED_STATE] = {
        "start"  : "\\[",
        "end"    : "\\]",
    };

    var MockPopoverHandler = function() {
        this.options = {
            html: true,
            placement: "bottom",
            trigger: "manual"
        };

        this.show = function(title, content, position) {
            this.title = title;
            this.content = content;
            this.position = position;
            this.shown = true;
        };

        this.destroy = function() {
            this.title = null;
            this.content = null;
            this.position = null;
            this.shown = false;
        };

        this.setContent = function(title, content) {
            this.title = title;
            this.content = content;
        };

        this.setPosition = function(position) {
            this.position = position;
        };
    };


    module.exports = {
        "test: EquationRangeHandler, inside math": function() {
            var session = new EditSession([]);
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var content = "\\alpha";

            for (var state in mathConstants) {
                var stateConstants = mathConstants[state];
                var line = stateConstants.start + content + stateConstants.end;
                session.insert({ row: session.getLength(), column: 0 }, "\n" + line);
                var row = session.getLength() - 1;
                var equationStart = stateConstants.start.length;
                var equationEnd = equationStart + content.length;

                var equationRange = new EquationRangeHandler(editor).getEquationRange(row, equationStart + 1);

                assert(equationRange.correct);
                assert.range(equationRange.range, row, equationStart, row, equationEnd);
            }
        },

        "test: EquationRangeHandler, on the edge of end math": function() {
            var session = new EditSession([]);
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var content = "\\alpha";

            for (var state in mathConstants) {
                var stateConstants = mathConstants[state];
                var line = stateConstants.start + content + stateConstants.end;
                session.insert({ row: session.getLength(), column: 0 }, "\n" + line);
                var row = session.getLength() - 1;
                var equationStart = stateConstants.start.length;
                var equationEnd = equationStart + content.length;

                var equationRange = new EquationRangeHandler(editor).getEquationRange(row, equationEnd);

                assert(equationRange.correct);
                assert.range(equationRange.range, row, equationStart, row, equationEnd);
            }
        },

        "test: EquationRangeHandler, ending with empty line with some text after": function() {
            var session = new EditSession([]);
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var content = "\\alpha";

            for (var state in mathConstants) {
                var stateConstants = mathConstants[state];
                var line = stateConstants.start + content + "\n" + "\n" + "stuff";
                session.insert({ row: session.getLength(), column: 0 }, "\n" + line);
                var row = session.getLength() - 3;
                var equationStart = stateConstants.start.length;
                var equationEnd = equationStart + content.length;

                var equationRange = new EquationRangeHandler(editor).getEquationRange(row, equationStart + 1);

                assert(!equationRange.correct);
                assert.range(equationRange.range, row, equationStart, row, equationEnd);
            }
        },

        "test: EquationRangeHandler, ending with the end of a file": function() {
            var session = new EditSession([]);
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var content = "\\alpha";

            for (var state in mathConstants) {
                var stateConstants = mathConstants[state];
                var line = stateConstants.start + content;
                session.insert({ row: session.getLength(), column: 0 }, "\n" + line);
                var row = session.getLength() - 1;
                var equationStart = stateConstants.start.length;
                var equationEnd = equationStart + content.length;

                var equationRange = new EquationRangeHandler(editor).getEquationRange(row, equationStart + 1);

                assert(!equationRange.correct);
                assert.range(equationRange.range, row, equationStart, row, equationEnd);
            }
        },

        "test: ContextHandler.getWholeEquation, no labels": function() {
            var session = new EditSession(["\\begin{equation}\\text{hi there!}\\end{equation}"]);
            //                               0123456789012345 6789012345678901 23456789012345678
            //                               0         10         20        30         40
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 16, 0, 34);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 16);
            tokenIterator.stepForward();

            var labelsAndEquation = ContextHandler.getWholeEquation(session, tokenIterator);

            assert.deepEqual(labelsAndEquation.params, []);
            assert.equal(labelsAndEquation.equation, "\\text{hi there!}");
        },

        "test: ContextHandler.getWholeEquation, two labels": function() {
            var session = new EditSession(["\\begin{equation} \\label{label1} \\label{label2} \\text{hi there!} \\end{equation}"]);
            //                               01234567890123456 789012345678901 234567890123456 78901234567890123 456789012345678
            //                               0         10         20        30         40         50        60         70
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 16, 0, 64);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 16);
            tokenIterator.stepForward();

            var labelsAndEquation = ContextHandler.getWholeEquation(session, tokenIterator);

            assert.deepEqual(labelsAndEquation.params, ["label1", "label2"]);
            assert.equal(labelsAndEquation.equation, "   \\text{hi there!} ");
        },

        "test: ContextHandler.getWholeEquation, wrong label": function() {
            var session = new EditSession(["\\begin{equation} \\label{ \\text{hi there!} \\end{equation}"]);
            //                               01234567890123456 78901234 56789012345678901 234567890123456
            //                               0         10         20         30        40         50
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 16, 0, 42);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 16);
            tokenIterator.stepForward();

            var labelsAndEquation = ContextHandler.getWholeEquation(session, tokenIterator);

            assert.deepEqual(labelsAndEquation.params, []);
            assert.equal(labelsAndEquation.equation, " \\label{ \\text{hi there!} ");
        },

        "test: ConstrainedTokenIterator, basic forward": function() {
            var session = new EditSession(["\\newline \\newline \\newline"]);
            //                               012345678 901234567 890123456
            //                               0          10         20
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 5, 0, 20);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 15);
            assert.notEqual(tokenIterator.getCurrentToken(), null);

            tokenIterator.stepForward();
            assert.notEqual(tokenIterator.getCurrentToken(), null);

            tokenIterator.stepForward();
            assert.equal(tokenIterator.getCurrentToken(), null, JSON.stringify(tokenIterator.getCurrentToken()));
        },

        "test: ConstrainedTokenIterator, basic backward": function() {
            var session = new EditSession(["\\newline \\newline \\newline"]);
            //                               012345678 901234567 890123456
            //                               0          10         20
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 5, 0, 20);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 15);
            assert.notEqual(tokenIterator.getCurrentToken(), null);

            tokenIterator.stepBackward();
            assert.notEqual(tokenIterator.getCurrentToken(), null);

            tokenIterator.stepBackward();
            assert.equal(tokenIterator.getCurrentToken(), null, JSON.stringify(tokenIterator.getCurrentToken()));
        },

        "test: ConstrainedTokenIterator, forward several times": function() {
            var session = new EditSession(["\\newline \\newline \\newline \\newline"]);
            //                               012345678 901234567 890123456 789012345
            //                               0          10         20         30
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 5, 0, 20);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 15);
            assert.notEqual(tokenIterator.getCurrentToken(), null);

            tokenIterator.stepForward();
            assert.notEqual(tokenIterator.getCurrentToken(), null);

            tokenIterator.stepForward();
            assert.equal(tokenIterator.getCurrentToken(), null, JSON.stringify(tokenIterator.getCurrentToken()));

            tokenIterator.stepForward();
            assert.equal(tokenIterator.getCurrentToken(), null, JSON.stringify(tokenIterator.getCurrentToken()));

            tokenIterator.stepBackward();
            assert.equal(tokenIterator.getCurrentToken(), null, JSON.stringify(tokenIterator.getCurrentToken()));

            tokenIterator.stepBackward();
            assert.notEqual(tokenIterator.getCurrentToken(), null);
        },

        "test: ConstrainedTokenIterator, backward several times": function() {
            var session = new EditSession(["\\newline \\newline \\newline \\newline"]);
            //                               012345678 901234567 890123456 789012345
            //                               0          10         20         30
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 15, 0, 30);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 20);
            assert.notEqual(tokenIterator.getCurrentToken(), null);

            tokenIterator.stepBackward();
            assert.notEqual(tokenIterator.getCurrentToken(), null);

            tokenIterator.stepBackward();
            assert.equal(tokenIterator.getCurrentToken(), null, JSON.stringify(tokenIterator.getCurrentToken()));

            tokenIterator.stepBackward();
            assert.equal(tokenIterator.getCurrentToken(), null, JSON.stringify(tokenIterator.getCurrentToken()));

            tokenIterator.stepForward();
            assert.equal(tokenIterator.getCurrentToken(), null, JSON.stringify(tokenIterator.getCurrentToken()));

            tokenIterator.stepForward();
            assert.notEqual(tokenIterator.getCurrentToken(), null);
        },

        "test: ConstrainedTokenIterator, exact range": function() {
            var session = new EditSession(["\\newline \\newline \\newline"]);
            //                               012345678 901234567 890123456
            //                               0          10         20
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 9, 0, 17);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 10);
            assert.notEqual(tokenIterator.getCurrentToken(), null);
        },

        "test: ConstrainedTokenIterator, starting out of range": function() {
            var session = new EditSession(["\\newline"]);
            //                               012345678
            //                               0
            var editor = new Editor(new MockRenderer(), session);
            session.setMode("./mode/papeeria_latex");

            var range = new Range(0, 2, 0, 6);
            var tokenIterator = new ConstrainedTokenIterator(session, range, 0, 3);
            assert.equal(tokenIterator.getCurrentToken(), null);
        }
    }
});
