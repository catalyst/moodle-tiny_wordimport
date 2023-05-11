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
 * Tiny tiny_wordimport for Moodle.
 *
 * @module      tiny_wordimport/wordimport
 * @copyright   2023 André Menrath <andre.menrath@uni-graz.at>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// import {add as addToast} from 'core/toast';
import {getContextId} from 'editor_tiny/options';
import uploadFile from 'editor_tiny/uploader';
import {displayFilepicker} from 'editor_tiny/utils';
import {getProcessedDocxContent} from './repository';
import {
    displayUploadNotification,
    updateNotificationProgress
} from './ui';

/**
 * Handler that inserts a dragged and dropped docx word file into the editor.
 *
 * It will upload the file as a draftfile and then use the converter of the
 * booktool_wordimport plugin to retrieve the html to insert.
 *
 * @param {TinyMCE.editor} editor
 * @param {DataTransfer} file
 */
export const droppedWordFileHandler = async(editor, file) => {
    try {
        const draftId = await uploadDraggedFile(editor, file);
        const content = await getProcessedDocxContent(draftId, getContextId(editor), file.name);
        insertRawHtml(editor, content);
    } catch (error) {
        // TODO: display errors properly
        window.console.log(error);
    }
};

/**
 * Handle the action for the Word Import
 *
 * @param {TinyMCE.editor} editor The tinyMCE editor instance.
 */
export const importWordFileHandler = async(editor) => {
    try {
        const file = await displayFilepicker(editor, 'docx');
        const content = await getProcessedDocxContent(file.id, getContextId(editor), file.file);
        insertRawHtml(editor, content);
    } catch (error) {
        // TODO: display errors properly
        window.console.log(error);
    }
};

/**
 * Insert raw html content into the editor at the current cursor position
 *
 * @param {TinyMCE.editor} editor The tinyMCE editor instance.
 * @param {string} content The raw html content to be inserted in the editor
 */
const insertRawHtml = (editor, content) => {
    // Get the current selection.
    const selection = editor.selection;
    // Get the current range.
    const range = selection.getRng();
    // Insert raw HTML content at the current cursor position.
    range.insertNode(range.createContextualFragment(content.html));
};

/**
 * Upload a dragged and dropped file to moodle as a draftfile.
 *
 * @param {TinyMCE.editor} editor
 * @param {DataTransfer} file
 */
const uploadDraggedFile = async(editor, file) => {
    const blob = await readAsArrayBuffer(file);
    const notification = displayUploadNotification(editor);
    const draftFileUrl = await uploadFile(
        editor, 'docx', blob, file.name, (progress) => updateNotificationProgress(notification, progress)
    );
    notification.close();
    return extractDraftId(draftFileUrl);
};

const readAsArrayBuffer = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => resolve(new Blob([reader.result], { type: file.type }));
    });
};

const extractDraftId = (draftFileUrl) => {
    return draftFileUrl.match(/\/draft\/(\d+)\//)[1];
};
