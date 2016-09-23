#target photoshop

var SIZE_VALUES = [48, 24, 24, 16];
var SIZE_FACTORS = [1, 1.5, 2, 3, 4];
var DEFAULT_KEYS = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
var PRESETS = ["Launcher","Action Bar", "Notification", "Small"];
var EXTENSION = ".png";
var DOC = app.activeDocument;
var PATH = app.activeDocument.path;
var FOLDER_NAMES = ["mipmap-", "drawable-"];
var NAMES = ["ic_launcher.png", DOC.name.substring(0, DOC.name.length - 4) + EXTENSION];

var w = new Window("dialog { preferredSize: [350, -1], alignChildren: 'center' }", "Extract assets");
w.orientation = "column";

// - PANEL PRESETS -
var g1_3 = w.add("panel {orientation : 'row', preferredSize: [350, -1] }");
var tSet = g1_3.add("statictext", undefined, "Preset:"); tSet.preferredSize = [60,-1];
// edit text for name
var etSet = g1_3.add("dropdownlist", undefined, PRESETS);
etSet.preferredSize = [200, -1];
etSet.selection = 0;
etSet.onChange = selectPreset;

// - PANEL NAMES -
var g1 = w.add("panel { orientation: 'column', alignChildren: 'left', preferredSize: [350, -1] }");

// - GROUP NAMES -
var g1_1 = g1.add("group {orientation : 'row' }");
var tName = g1_1.add("statictext", undefined, "File name:"); tName.preferredSize = [60,-1];
// edit text for name
var etName = g1_1.add("edittext { preferredSize: [200, -1] }"); 

// - PANEL SIZES -
var g2 = w.add("panel { orientation: 'column', preferredSize: [350, -1], alignChildren: 'left' }");
g2.alignChildren = "left";
var g2_0 = g2.add("group { orientation: 'row', alignChildren: 'left' }");
g2_0.add("statictext { preferredSize: [20, -1] }");
g2_0.add("statictext { preferredSize: [80, -1] }").text = "Folder name";
g2_0.add("statictext { preferredSize: [80, -1] }").text = "Postfix";
g2_0.add("statictext { preferredSize: [80, -1] }").text = "Size";
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
var g5 = w.add("group { orientation: 'row' }");
var bSave = g5.add("button",undefined,"Save");
var cancel = g5.add("button",undefined,"Cancel");

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
    var folder = Folder.selectDialog("Select a folder");
    var history = DOC.activeHistoryState;
    if(folder != null) {
        save(folder);
    }
    try {
        DOC.activeHistoryState = history;
    } catch(err) {
        alert("Failed to restore document state");
    }
}

function save(root) {
    var name = etName.text;
    
    try {
        activeDocument.mergeVisibleLayers();
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
                var size = etSizes[i].text.replace(/\D/, "");
                if (size == "" || size <= 0) {
                    alert("Invalid size: " + size);
                    return;
                } 
                DOC.resizeImage(UnitValue(size, "px"), 
                    UnitValue(etSizes[i].text,"px"), null, ResampleMethod.BICUBIC);

                file = new File(path + "/" + name);
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

    showMessage ("Done", "Assets saved to \""+ root + "\"");
    w.hide();
}

function showMessage(title, text) {
    var v =new Window("dialog { orientation: 'column', alignChildrens: 'center' }", title);
    v.add("statictext",undefined,text);
    v.add("button",undefined,"OK");
    v.show();
}