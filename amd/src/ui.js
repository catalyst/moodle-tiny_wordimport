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
 * @module      tiny_wordimport/ui
 * @copyright   2023 André Menrath <andre.menrath@uni-graz.at>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const NOTIFICATION_TIMEOUT_INDEFINITE = -1;

export const displayUploadNotification = (editor) => {
    return editor.notificationManager.open({
        text: editor.translate('Uploading document...'),
        type: 'info',
        timeout: NOTIFICATION_TIMEOUT_INDEFINITE,
        progressBar: true,
    });
};

export const updateNotificationProgress = (notification, progress) => {
    notification.progressBar.value(Math.round(progress));
};