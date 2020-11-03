var appConsts = {
	version: "0.4.0"
	}

var theEditor;  //ace-editor object
var editorSerialnum = 0;
var idCurrentEditor = undefined;
var whenLastUserAction = new Date ();
var savedEditorStatus = {
	};
var flEditorChanged = false;

function editorChanged () {
	flEditorChanged = true;
	whenLastUserAction = new Date ();
	}
function getText () {
	var s = theEditor.getValue ();
	s = replaceAll (s, "\r", "\n"); //so source listings are readable in Chrome
	return (s);
	}
function setText (s) {
	if (s === undefined) {
		s = "";
		}
	theEditor.setValue (s);
	}
function saveEditorStatus () {
	savedEditorStatus.text = getText ();
	savedEditorStatus.selectionRange = theEditor.getSelectionRange ();
	savedEditorStatus.folds = theEditor.session.getAllFolds ().map (function (fold) {
		return {
			start       : fold.start,
			end         : fold.end,
			placeholder : fold.placeholder
			};
		});
	localStorage.savedEditorStatus = jsonStringify (savedEditorStatus);
	
	if (savedEditorStatus.ctUpdates === undefined) {
		savedEditorStatus.ctUpdates = 1;
		}
	else {
		savedEditorStatus.ctUpdates++
		}
	
	console.log ("saveEditorStatus: localStorage.savedEditorStatus == " + localStorage.savedEditorStatus);
	}
function restoreEditorStatus () {
	if (savedEditorStatus.selectionRange !== undefined) {
		theEditor.getSelection ().setSelectionRange (savedEditorStatus.selectionRange);
		}
	if (savedEditorStatus.folds !== undefined) {
		var Range = ace.require ("ace/range").Range;
		try {
			savedEditorStatus.folds.forEach (function (fold) {
				theEditor.session.addFold (fold.placeholder, Range.fromPoints (fold.start, fold.end));
				});
			} 
		catch (err) {
			}
		}
	if (savedEditorStatus.urlMockupPage !== undefined) {
		updateMockupPageDisplay (savedEditorStatus.urlMockupPage);
		}
	if (savedEditorStatus.text !== undefined) {
		setText (savedEditorStatus.text);
		}
	}
function startEditor () {
	if (localStorage.savedEditorStatus !== undefined) {
		savedEditorStatus = JSON.parse (localStorage.savedEditorStatus);
		console.log ("startEditor: savedEditorStatus == " + jsonStringify (savedEditorStatus));
		}
	theEditor = ace.edit ("idEditor");
	theEditor.setTheme ("ace/theme/github");
	theEditor.setShowPrintMargin (false);
	theEditor.getSession ().setMode ("ace/mode/html");
	theEditor.$blockScrolling = true;
	theEditor.container.style.lineHeight = 1.4;
	theEditor.setFontSize ("13px");
	
	restoreEditorStatus ();
	
	var session = theEditor.getSession ();
	session.on ("changeFold", function (e) {
		editorChanged ();
		});
	session.selection.on ("changeSelection", function (e) {
		editorChanged ();
		});
	session.on ("changeAnnotation", function () {
		var annotations = session.getAnnotations()||[], i = len = annotations.length;
		while (i--) {
			if(/doctype first\. Expected/.test(annotations[i].text)) {
				annotations.splice(i, 1);
				}
			}
		if(len>annotations.length) {
			session.setAnnotations(annotations);
			}
		});
	theEditor.on ("change", function () {
		editorChanged ();
		});
	}
function showEditor (flDisplay) {
	var val;
	if (flDisplay) {
		val = "table-cell";
		}
	else {
		val = "none";
		}
	$("#idEditorContainer").css ("display", val);
	}
function everySecond () {
	if (secondsSince (whenLastUserAction) > 0.5) {
		if (flEditorChanged) {
			flEditorChanged = false;
			saveEditorStatus ();
			}
		}
	}
function startup () {
	console.log ("startup");
	startEditor ();
	showEditor (true);
	self.setInterval (everySecond, 1000); 
	}
