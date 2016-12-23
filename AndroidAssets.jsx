/*
 * Copyright 2016 Igor Talankin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#target photoshop

const SIZE_VALUES = [48, 24, 24, 16];
const SIZE_FACTORS = [1, 1.5, 2, 3, 4];
const DEFAULT_KEYS = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
const PRESETS = ["Launcher","Action Bar", "Notification", "Small"];
const EXTENSION = ".png";
const DOC = app.activeDocument;
const FOLDER_NAMES = ["mipmap-", "drawable-"];

var docname = DOC.name;
var index;
if (docname == null || (index = docname.lastIndexOf(".")) <= 0) {
    if (docname.length == 0) {
        docname = "my_icon";
    }
} else {
    docname = docname.substring(0, index);
}
const NAMES = ["ic_launcher.png", getNiceName(docname)];

const PREF_NAME = stringIDToTypeID("AndroidAssetsPreferences");
const PREF_LAST_USED_PRESET = stringIDToTypeID("last_used_preset");
const PREF_LAST_OUTPUT_DIR = stringIDToTypeID("last_output_dir");

var prefs = readPrefs();

var w = new Window("dialog { preferredSize: [350, -1], alignChildren: 'center' }", "Android Assets");
w.orientation = "column";

// - PANEL PRESETS -
var g1_3 = w.add("panel {orientation : 'row', preferredSize: [350, -1] }");
var tSet = g1_3.add("statictext", undefined, "Preset:"); tSet.preferredSize = [60,-1];
// edit text for name
var etSet = g1_3.add("dropdownlist", undefined, PRESETS);
etSet.preferredSize = [200, -1];
etSet.selection = prefs == null ? 1 : prefs[1];
etSet.onChange = selectPreset;

// - PANEL NAMES -
var g1 = w.add("panel { orientation: 'column', alignChildren: 'left', preferredSize: [350, -1] }");

// - GROUP NAMES -
var g1_1 = g1.add("group {orientation : 'row' }");
var tName = g1_1.add("statictext", undefined, "File name:"); tName.preferredSize = [-1,-1];
// edit text for name
var etName = g1_1.add("edittext { preferredSize: [200, -1] }");

// - PANEL SIZES -
var g2 = w.add("panel { orientation: 'column', preferredSize: [350, -1], alignChildren: 'left' }");
g2.alignChildren = "left";
var g2_0 = g2.add("group { orientation: 'row', alignChildren: 'left' }");
g2_0.add("statictext { preferredSize: [20, -1] }");
g2_0.add("statictext { preferredSize: [80, -1] }").text = "Folder name";
g2_0.add("statictext { preferredSize: [80, -1] }").text = "Postfix";
g2_0.add("statictext { preferredSize: [80, -1] }").text = "Width*";
var cbSizes = [];
var etPostfixes = [];
var etPrefixes = [];
var etSizes = [];
for(var i = 0; i < 5; i++) {
    var g = g2.add("group { orientation: 'row' }");
    cbSizes[i] = g.add("checkbox { preferredSize: [20, -1] }");
    cbSizes[i].value = true;
    cbSizes[i].onClick = onCheckboxChange;
    etPrefixes[i] = g.add("edittext { preferredSize: [80, -1] }");
    etPrefixes[i].text = (etSet.selection.index == 0) ? FOLDER_NAMES[0] : FOLDER_NAMES[1];
    etPostfixes[i] = g.add("edittext { preferredSize: [80, -1] }");
    etPostfixes[i].text = DEFAULT_KEYS[i];
    etSizes[i] = g.add("edittext { preferredSize: [80, -1] }");
    if (i == 0) {
        etSizes[0].onChange = onTextChange
    }
}

// - GROUP 5 -
var g5 = w.add("group { orientation: 'column' }");
g5.add("statictext { preferredSize: [-1, -1] }").text = 
        "* Height will be calculated automatically, saving the aspect ratio.";

// - GROUP 6 -
var g6 = w.add("group { orientation: 'row' }");
var bSave = g6.add("button",undefined,"Save");
var cancel = g6.add("button",undefined,"Cancel");

selectPreset();
bSave.onClick = onSave;
w.show();

function onTextChange() {
    var size = etSizes[0].text.replace(/\D/g, "");
    if (size == "") {
        size = 0;
    }
    etSizes[0].text = size;
    for(var i = 1; i < 5; i++) {
        etSizes[i].text = Math.round(size * SIZE_FACTORS[i]);
    }
}

function onCheckboxChange() {
    for(var i = 0; i < 5; i++) {
        var flag = cbSizes[i].value;
        etPrefixes[i].enabled = flag;
        etPostfixes[i].enabled = flag;
        etSizes[i].enabled = flag;
    }
}

function selectPreset() {
    var index = etSet.selection.index;
    if(index == 0) {
        etName.text = NAMES[0];
    } else {
        etName.text = NAMES[1];
    }
    etSizes[0].text = SIZE_VALUES[index];
    onTextChange();
    for (var i = 0; i < 5; i++) {
        etPrefixes[i].text = index == 0 ? FOLDER_NAMES[0] : FOLDER_NAMES[1];
    }
}

function onSave() {
    var folder;
    var title = "Select a folder";
    if (prefs != null) {
        try {
            folder = Folder(prefs[0]).selectDlg(title);
        } catch(err) {
            folder = Folder.selectDialog(title);
        }
    } else {
        folder = Folder.selectDialog(title);
    }
    var history = DOC.activeHistoryState;
    if (folder != null) {
        save(folder);
    }
    try {
        DOC.activeHistoryState = history;
    } catch(err) {
        showMessage("Error", "Failed to restore document state");
    }
}

function save(root) {
    var fname = getNiceName(etName.text);
    
    try {
        DOC.mergeVisibleLayers();
    } catch(err) {
        // its ok
    }

    // saving options
    var options = new ExportOptionsSaveForWeb();
    options.format = SaveDocumentType.PNG;
    options.quality = 100;
    options.PNG8 = false;
    
    var folder;
    var file;
    try {
        for(var i = 4; i >= 0; i--) {
            if(cbSizes[i].value) {
                var path = root + "/" + etPrefixes[i].text + etPostfixes[i].text;
                
                folder = new Folder(path);
                // check destination folder exits
                if(!folder.exists) {
                    // create it if not
                    folder.create();
                }

                // resize images
                var width = etSizes[i].text.replace(/\D/, "");
                if (width == "" || width <= 0) {
                    showMessage("Error", "Invalid size: " + width);
                    return;
                }
                var ratio = DOC.height / DOC.width;
                DOC.resizeImage(UnitValue(width, "px"), UnitValue(width * ratio,"px"), null, ResampleMethod.BICUBIC);

                file = new File(path + "/" + fname);
                // check destination file
                if(file.exists) {
                    // remove it as well
                    file.remove();
                }
                DOC.exportDocument(file, ExportType.SAVEFORWEB, options);
            }
        }
    } catch(err) {
        showMessage("Error", err.message);
        return;
    }

    savePrefs(etSet.selection.index, folder.path);
    var prefs = readPrefs();

    showMessage("Done", "Assets saved to \""+ root + "\"");
    w.hide();
}

function showMessage(title, text) {
    var v =new Window("dialog { orientation: 'column', alignChildrens: 'center' }", title);
    v.add("statictext",undefined,text);
    v.add("button",undefined,"OK");
    v.show();
}

function savePrefs(preset, dir) {
    var desc = new ActionDescriptor();
    desc.putString(PREF_LAST_OUTPUT_DIR, dir);
    desc.putInteger(PREF_LAST_USED_PRESET, preset);
    app.putCustomOptions(PREF_NAME, desc, true);
}

function readPrefs() {
    try {
        var desc = app.getCustomOptions(PREF_NAME);
        return [desc.getString(PREF_LAST_OUTPUT_DIR), desc.getInteger(PREF_LAST_USED_PRESET)];
    } catch(err) {
        return null;
    }
}

function getNiceName(s) {
    s = s.replace(/^\d/, "ic_"); // replace first char if it is digit
    s = s.replace(/[ \\\/\-=*:]/g, "_"); // replace 'bad' chars
    var sl = s.toLocaleLowerCase();
    // append extension
    if (sl.length < 4 || sl.lastIndexOf(EXTENSION) != s.length - 4) {
        s = s + EXTENSION;
    }
    return s;
}
