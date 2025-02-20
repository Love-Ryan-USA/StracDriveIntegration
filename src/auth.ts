import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  redirectUri: (process.env.baseUrl ?? "") + (process.env.redirectUrl ?? ""),
});

google.options({ auth: oauth2Client });

export default oauth2Client;
export const drive = google.drive("v3");
