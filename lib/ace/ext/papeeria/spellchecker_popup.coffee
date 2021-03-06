foo = null  # force ace to use ace.define
define((require, exports, module) ->

  Autocomplete = require('ace/autocomplete')
  Spellchecker = require('ace/ext/papeeria/spellchecker')

  # Returns Range object that describes the current word position.
  # @param {Editor} editor: editor object.
  # @return {Range}: current word range.
  getCurrentWordRange = (editor) ->
    session = editor.getSession()
    row = editor.getCursorPosition().row
    col = editor.getCursorPosition().column
    return session.getWordRange(row, col)

  # Convert an array of string to popup-eligible structure.
  # @param {Array} corrections: array of strings with substitution options.
  # @return {Array}: array of JSONs, actually.
  convertCorrectionList = (corrections) ->
    # TODO: get server to provide corrections' source
    return ({caption: item, value: item, meta: "", score: corrections.length - i} for item, i in corrections)

  # Get the word under the cursor.
  # @param {Editor} editor: editor object.
  # @return {String}: the current word.
  extractWord = (editor) ->
    session = editor.getSession()
    wordRange = getCurrentWordRange(editor)
    return session.getTextRange(wordRange)

  mySpellcheckerPopup = null


  # Sets up spellchecker popup and implements some routines
  # to work on current in the editor.
  setup = (editor) ->
    mySpellcheckerPopup = new SpellcheckerCompleter()
    # Bind SpellcheckerCompleter.showPopup to Alt-Enter editor shortcut.
    command =
      name: "spellCheckPopup"
      exec: ->
        editor.completer = mySpellcheckerPopup
        editor.completer.showPopup(editor)
      bindKey: "Alt-Enter"
    editor.commands.addCommand(command)


  # Autocomplete class extension since it behaves almost the same way.
  # All we need is to override methods responsible for getting data for
  # popup and inserting chosen correction instead of the current word.
  class SpellcheckerCompleter extends Autocomplete.Autocomplete
    constructor: ->
      @isDisposable = true
      super()

    # "Gather" completions extracting current word
    # and take it's corrections list as "completions"
    gatherCompletions: (editor, callback) =>
      # For some reason Autocomplete needs this base object, so
      # I propose just not to touch it.
      session = editor.getSession()
      position = editor.getCursorPosition()
      @base = session.doc.createAnchor(position.row, position.column)
      word = extractWord(editor)
      Spellchecker.getInstance().getCorrections(word, (correctionsList) ->
        callback(null, {
          prefix: ""
          matches: convertCorrectionList(correctionsList)
          finished: true
        })
      )
      return true

    # Insert "matching" word instead of the current one.
    # In fact we substitute current word with data,
    # not just insert something.
    insertMatch: (data, options) =>
      data ?= @popup.getData(@popup.getRow())
      wordRange = getCurrentWordRange(@editor)
      @editor.getSession().replace(wordRange, data.value || data)
      @detach()

  return {
    setup: setup
  }
)
