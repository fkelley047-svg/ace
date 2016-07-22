define((require, exports, module) ->
  exports.setupPreviewer = (editor, popoverHandler) ->
    katex = null
    popoverHandler = popoverHandler ? new require("ace/ext/papeeria/popover-handler")

    initKaTeX = (onLoaded) ->
      # Adding CSS for demo formula
      cssDemoPath = require.toUrl("./katex-demo.css")
      linkDemo = $("<link>").attr(
        rel: "stylesheet"
        href: cssDemoPath
      )
      $("head").append(linkDemo)

      # Adding DOM element to place formula into
      a = $("<a>").attr(
        href: "#"
        id: "formula"
        "data-toggle": "popover"
      )
      $("body").append(a)

      require(["ace/ext/katex"], (katexInner) ->
        katex = katexInner
        onLoaded()
        return
      )
      return

    onLoaded = ->
      options = {
        html: true
        placement: "bottom"
        trigger: "manual"
        title: "Formula"
        container: "#editor"
      }
      try
        options.content = katex.renderToString(
          editor.getSelectedText(),
          {displayMode: true}
        )
      catch e
        options.content = e
      finally
        popoverHandler.show($("#formula", options))
        return

    callback = (editor) ->
      if $("#editor > .popover").is(":visible")
        destroyPopover()
      else
        createPopover(editor)
      return

    destroyPopover = -> popoverHandler.hide($("#formula"))

    createPopover = (editor) ->
      unless katex?
        initKaTeX(onLoaded)
        return
      onLoaded()

    editor.commands.addCommand(
      name: "previewLaTeXFormula"
      bindKey: {win: "Alt-p", mac: "Alt-p"}
      exec: callback
    )
    return
  return
)
