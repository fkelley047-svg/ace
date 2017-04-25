foo = null # ACE builder wants some meaningful JS code here to use ace.define instead of just define
define((require, exports, module) ->
  LatexParsingContext = require("ace/ext/papeeria/latex_parsing_context")
  Autocomplete = require("ace/autocomplete")
  util = require("ace/autocomplete/util")
  lang = require("../../lib/lang")

  class BiblioFilesCompleter extends Autocomplete.Autocomplete
    constructor:(@createCallback, @insertCallback, @createLabel) ->
      super()

    setFiles: (files) => @files = files

    _setCompletions: =>
      matches = @files.map((file) => {
        name: file.name
        meta: file.path
        action: => @_doInsert(file)
      })
      matches.push({
        name: @createLabel
        meta: ""
        action: => @_doCreate()
      })
      @completions = new Autocomplete.FilteredList(matches)

    _doInsert: (file) =>
      @insertCallback?(file)
      @detach()

    _doCreate: =>
      @createCallback?((=> @editor.completer = null), @_doInsert)

    updateCompletions: (keepPopupPosition) =>
      @_setCompletions()
      prefix = util.getCompletionPrefix(@editor)
      @openPopup(@editor, prefix, keepPopupPosition)

    insertMatch: (editor, data) =>
      data ?= @popup.getData(@popup.getRow())
      if not data? or not data.action?
        @detach()
        return
      data.action()

    detach: =>
      @editor.completer = new Autocomplete.Autocomplete()
      super()


  class BiblioCompleter
    constructor: (@enabledMendeley, @searchLabel, @importLabel, @importSource, @searchCallback) ->
      @isDisposable = true

    getCompletions: (editor, session, pos, prefix, callback) =>
      token = session.getTokenAt(pos.row, pos.column)

      if LatexParsingContext.isType(token, "cite")
        defaultResult = [{
          name: @searchLabel
          snippet: @searchLabel + prefix
          meta: ""
          score: 1000
          meta_score: 10
          completer: this
          action: (editor) => @_doSearch(editor)
        }]
        # We don't show Import option to free users
        if @enabledMendeley?
          defaultResult.push({
            name: @importLabel
            snippet: @importLabel + prefix
            meta: @importSource
            score: 1000
            meta_score: 10
            completer: this
            action: (editor) => @importCallback?()
          })

        callback(null, defaultResult)
        return

      callback(null, [])
      return

    # Will be called when users choose an Import option
    setImportCallback: (callback) => @importCallback = callback

    _doSearch: (editor) =>
      prefix = util.getCompletionPrefix(editor)
      @searchCallback?({
        query: prefix
        # this callback will be called when user clicks on the search result to insert a bibtex entry
        # so it just opens a passed popup if any and closes an existing one otherwise
        insertCallback: (completer) =>
          completer?.showPopup(editor)
      })

    insertMatch: (editor, data) =>
      editor.completer.detach()
      editor.completer = null
      if data? and data.action?
        data.action(editor)


  return {
    BiblioCompleter: BiblioCompleter
    BiblioFilesCompleter: BiblioFilesCompleter
  }
)
