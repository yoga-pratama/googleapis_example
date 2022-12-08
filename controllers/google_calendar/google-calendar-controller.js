const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

const insertEvent = async (req, res, next) => {
  const insData = req.body;

  let isAuthorize = await authorize().catch(console.error);

  if (isAuthorize != null) {
    const calendar = google.calendar({ version: "v3", isAuthorize });
    const event = {
      summary: insData.summary,
      location: insData.location,
      description: insData.description,
      start: {
        dateTime: insData.start_date,
        timeZone: insData.timezone,
      },
      end: {
        dateTime: insData.end_date,
        timeZone: insData.timezone,
      },
      conferenceData: {
        createRequest: {
          conferenceSolutionKey: { type: "hangoutsMeet" },
          requestId: uuidv4(),
        },
      },
      attendees: insData.attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    calendar.events.insert(
      {
        auth: isAuthorize,
        calendarId: "primary",
        resource: event,
        sendUpdates: "all",
        conferenceDataVersion: 1,
      },
      function (err, event) {
        if (err) {
          console.log(
            "There was an error contacting the Calendar service: " + err
          );
          return res.status(400).json({ success: false, message: err });
        }
        console.log("Event created: %s");
        return res
          .status(400)
          .json({ success: true, message: "Event created" });
      }
    );
  } else {
    return res.status(400).json({ success: false, message: "Not Authorize" });
  }
};

const updateEvent = async (req, res, next) => {
  const insData = req.body;

  let isAuthorize = await authorize().catch(console.error);

  if (isAuthorize != null) {
    const calendar = google.calendar({ version: "v3", isAuthorize });
    const event = {
      summary: insData.summary,
      location: insData.location,
      description: insData.description,
      start: {
        dateTime: insData.start_date,
        timeZone: insData.timezone,
      },
      end: {
        dateTime: insData.end_date,
        timeZone: insData.timezone,
      },
      conferenceData: {
        createRequest: {
          conferenceSolutionKey: { type: "hangoutsMeet" },
          requestId: uuidv4(),
        },
      },
      attendees: insData.attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    calendar.events.update(
      {
        auth: isAuthorize,
        calendarId: "primary",
        eventId: insData.event_id,
        resource: event,
        sendUpdates: "all",
        conferenceDataVersion: 1,
      },
      function (err, event) {
        if (err) {
          console.log(
            "There was an error contacting the Calendar service: " + err
          );
          return res.status(400).json({ success: false, message: err });
        }
        console.log("Event created: %s");
        return res
          .status(400)
          .json({ success: true, message: "Event updated" });
      }
    );
  } else {
    return res.status(400).json({ success: false, message: "Not Authorize" });
  }
};

const deleteEvent = async (req, res, next) => {
  const insData = req.body;

  let isAuthorize = await authorize().catch(console.error);
  if (isAuthorize != null) {
    const calendar = google.calendar({ version: "v3", isAuthorize });

    calendar.events.delete(
      {
        auth: isAuthorize,
        calendarId: "primary",
        eventId: insData.event_id,
        sendUpdates: "all",
        sendNotifications : true,
      },
      function (err, event) {
        if (err) {
          console.log(
            "There was an error contacting the Calendar service: " + err
          );
          return res.status(400).json({ success: false, message: err });
        }
        console.log("Event deleted: %s");
        return res
          .status(200)
          .json({ success: true, message: "Event deleted" });
      }
    );
  } else {
    return res.status(400).json({ success: false, message: "Not Authorize" });
  }
};

const listEvent = async (req, res, next) => {
  let isAuthorize = await authorize().catch(console.error);

  if (isAuthorize != null) {
    const calendar = google.calendar({ version: "v3", isAuthorize });

    try {
      const resp = await calendar.events.get;
      const response = await calendar.events.list({
        auth: isAuthorize,
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });
      const events = response.data.items;
      if (!events || events.length === 0) {
        console.log("No upcoming events found.");
        return res
          .status(200)
          .json({ success: true, message: "no events founds" });
      }

      return res
        .status(200)
        .json({ success: true, message: "success", data: events });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ success: false, message: error });
    }
  }
};

exports.listEvent = listEvent;
exports.insertEvent = insertEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
