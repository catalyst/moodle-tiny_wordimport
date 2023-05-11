// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Commands helper for the Moodle tiny_wordimport plugin.
 *
 * @module      plugintype_pluginname/commands
 * @copyright   2023 André Menrath <andre.menrath@uni-graz.at>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


import {get_string as getString} from 'core/str';
import {getButtonImage} from 'editor_tiny/utils';
import uploadFile from 'editor_tiny/uploader';
import {add as addToast} from 'core/toast';

import {
    getFilePicker,
    getContextId
} from 'editor_tiny/options';

import {
    allowedFileType,
    component,
    wordimportButtonName,
    wordimportMenuItemName,
    icon
} from './common';

import {getProcessedDocxContent} from './repository';


/**
 * Helper to display a filepicker and return a Promise.
 *
 * The Promise will resolve when a file is selected, or reject if the file type is not found.
 *
 * @param {TinyMCE} editor
 * @param {string} filetype
 * @returns {Promise<object>} The file object returned by the filepicker
 */
export const displayFilepicker = (editor, filetype) => new Promise((resolve, reject) => {
    var configuration = getFilePicker(editor, filetype);
    if (configuration) {
        const options = {
            ...configuration,
            formcallback: resolve,
        };
        M.core_filepicker.show(Y, options);
        return;
    }
    reject(`Unknown filetype ${filetype}`);
});


const insertRawHtml = (editor, content) => {
    // Get the current selection.
    const selection = editor.selection;
    // Get the current range.
    const range = selection.getRng();
    // Insert raw HTML content at the current cursor position.
    range.insertNode(range.createContextualFragment(content.html));
};

/**
 * Handle the action for the Word Import
 * @param {TinyMCE.editor} editor The tinyMCE editor instance.
 */
const handleAction = async(editor) => {
    // TODO: get rid of this hack.
    displayFilepicker(editor, 'docx').then(async(params) => {
        // Call the external webservice which wraps the converter functions from booktool_wordimport to get the content as HTML.
        window.console.log(params);
        const content = await getProcessedDocxContent(params.id, getContextId(editor), params.file);
        insertRawHtml(editor, content);
        return;
    }).catch();
};


/**
 * Get the setup function for the buttons.
 *
 * This is performed in an async function which ultimately returns the registration function as the
 * Tiny.AddOnManager.Add() function does not support async functions.
 *
 * @returns {function} The registration function to call within the Plugin.add function.
 */
export const getSetup = async() => {
    const [
        wordimportButtonNameTitle,
        wordimportMenuItemNameTitle,
        buttonImage,
    ] = await Promise.all([
        getString('button_wordimport', component),
        getString('menuitem_wordimport', component),
        getButtonImage('icon', component),
    ]);

    return (editor) => {
        // Register the Moodle SVG as an icon suitable for use as a TinyMCE toolbar button.
        editor.ui.registry.addIcon(icon, buttonImage.html);

        // Register the wordimport Toolbar Button.
        editor.ui.registry.addButton(wordimportButtonName, {
            icon,
            tooltip: wordimportButtonNameTitle,
            onAction: () => handleAction(editor),
        });

        // Add the wordimport Menu Item.
        // This allows it to be added to a standard menu, or a context menu.
        editor.ui.registry.addMenuItem(wordimportMenuItemName, {
            icon,
            text: wordimportMenuItemNameTitle,
            onAction: () => handleAction(editor),
        });

        editor.on('dragdrop drop', async(e) => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length === 1) {
                const file = e.dataTransfer.files[0];
                if (file.type === allowedFileType) {
                    e.preventDefault();
                    try {
                        const reader = new FileReader();
                        reader.readAsArrayBuffer(file);
                        reader.onload = async() => {
                            const blob = new Blob([reader.result], {type: file.type});
                            var notification = editor.notificationManager.open({
                                text: editor.translate('Uploading document...'),
                                type: 'info',
                                timeout: -1,
                                progressBar: true
                            });
                            window.console.log(notification);
                            const draftFileURL = await uploadFile(editor, 'docx', blob, file.name, (progress) => {
                                notification.progressBar.value(progress);
                            });
                            notification.close();
                            // Because uploadFile returns only the url (see `response.newfile.url`) we need to extract the draftid.
                            const draftid = draftFileURL.match(/\/draft\/(\d+)\//)[1];
                            const content = await getProcessedDocxContent(draftid, getContextId(editor), file.name);
                            insertRawHtml(editor, content);
                        };
                    } catch (error) {
                        addToast(await getString('uploadfailed', component, {error}), {
                            type: 'error',
                        });
                    }
                }
            }
        });

    };
};
