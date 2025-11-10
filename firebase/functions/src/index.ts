/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import { initializeApp } from "firebase-admin/app";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import axios from "axios";

initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Define some parameters
const slackToken = defineSecret('SLACK_TOKEN');

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const sendSlackNotification = onRequest({ secrets: [slackToken] }, async (request, response) => {
  try {
    const message = "CCT message";
    const channelId = 'C09KC1DG7BL';

    const slackMessage = `${message}`;

    const response_data = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channelId,
      text: slackMessage,
      mrkdwn: true,
    }, {
      headers: {
        'Authorization': `Bearer ${slackToken.value()}`,
        'Content-Type': 'application/json',
      }
    });

    logger.info("Slack message sent", {
      success: response_data.data.ok,
      channel: channelId
    });

    response.json({
      success: true,
      slackResponse: response_data.data
    });

  } catch (error) {
    logger.error("Error sending Slack message", error);
    response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Firebase Auth trigger for user registration
export const onUserSignUp = beforeUserCreated({ secrets: [slackToken] }, async (event) => {
  try {
    const user = event.data;

    // Check if user exists
    if (!user) {
      logger.error("No user data found in event");
      return;
    }

    const channelId = 'C09KC1DG7BL';

    // Extract user information with null checks
    const userEmail = user.email || 'No email provided';
    const userName = user.displayName || 'No name provided';
    const userId = user.uid || 'Unknown ID';
    const registrationTime = new Date().toISOString();

    // Create a formatted Slack message
    const slackMessage = `🎉 *New User Registration!*
    
📧 *Email:* ${userEmail}
👤 *Name:* ${userName}
🆔 *User ID:* ${userId}
⏰ *Registration Time:* ${registrationTime}

Welcome to the platform! 🚀`;

    // Send notification to Slack
    const response_data = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channelId,
      text: slackMessage,
      mrkdwn: true,
    }, {
      headers: {
        'Authorization': `Bearer ${slackToken.value()}`,
        'Content-Type': 'application/json',
      }
    });

    // Log the result
    logger.info("User registration Slack notification sent", {
      success: response_data.data.ok,
      userId: userId,
      userEmail: userEmail,
      channel: channelId
    });

    if (!response_data.data.ok) {
      logger.error(`Slack API error: ${response_data.data.error}`);
    }

  } catch (error) {
    const user = event.data;
    logger.error("Error sending user registration Slack notification", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user?.uid || 'Unknown',
      userEmail: user?.email || 'Unknown'
    });
  }
});
