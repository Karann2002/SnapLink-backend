// Example: notificationController.js
const Notification = require("../models/notifications");

const createNotification = async ({ recipient, sender, type, text, senderPic, senderName }) => {
  try {
    const notification = new Notification({
      recipient,   // user who should receive it
      sender,      // user who triggered it
      type,        // like | comment | follow | message
      text,        // optional (for comments/messages)
      senderPic,   // optional profile pic
      senderName   // optional name
    });

    await notification.save();

    return notification;
  } catch (err) {
    console.error("Error saving notification:", err);
    throw err;
  }
};

module.exports = { createNotification };
