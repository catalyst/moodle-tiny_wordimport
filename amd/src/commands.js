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

import {getButtonImage} from 'editor_tiny/utils';
import {get_string as getString} from 'core/str';
import {
    component,
    wordimportButtonName,
    wordimportMenuItemName,
    icon
} from './common';
import {getProcessedDocxContent} from './repository';

import {getFilePicker} from 'editor_tiny/options';

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
    // TODO: get rid of this hack.
    configuration.accepted_types = [".docx"];
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

/**
 * Handle the action for the Word Import
 * @param {TinyMCE.editor} editor The tinyMCE editor instance.
 */
const handleAction = async(editor) => {
    // TODO: get rid of this hack.
    displayFilepicker(editor, 'image').then(async(params) => {
        window.console.log(params);
        const content = await getProcessedDocxContent(params.id, params.file);
        window.console.log(content);
        editor.setContent(content.html, {format: 'raw'});
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

    };
};
