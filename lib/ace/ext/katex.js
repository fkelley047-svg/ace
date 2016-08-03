define(function(require, exports, module) {
    var katex = require("ace/ext/katex/katex");
    var cssKatexPath = require.toUrl("./katex/katex.min.css");
    var linkKatex = $("<link>").attr({
      rel: "stylesheet",
      href: cssKatexPath
    });
    $("head").append(linkKatex);
    module.exports = katex;
});