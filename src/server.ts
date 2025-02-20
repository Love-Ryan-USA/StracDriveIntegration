import fastify, {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fs from "fs";
import open from "open";
import oauth2Client, { drive } from "./auth.js";

declare module "fastify" {
  export interface FastifyInstance {
    oauth2Client: typeof oauth2Client;
  }
}

const app = fastify();

app.decorate("oauth2Client", oauth2Client);

app.register(async (server: FastifyInstance, options: FastifyPluginOptions) => {
  server.get("/", (request: FastifyRequest, reply: FastifyReply) => {
    const stream = fs.createReadStream("src/index.html");
    reply.code(200).type("text/html").send(stream);
  });

  server.get(
    "/authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const scopes = ["https://www.googleapis.com/auth/drive"];
      const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
      });
      await open(authorizeUrl);
      reply.redirect("/");
    }
  );

  type callbackParams = { Querystring: { code: "string" } };
  server.get<callbackParams>(
    "/oauth2callback",
    async (req: FastifyRequest<callbackParams>, res: FastifyReply) => {
      const code = req.query.code;
      const { tokens } = await server.oauth2Client.getToken(code);
      server.oauth2Client.setCredentials(tokens);
      console.log(tokens);
      server.log.info("API found the tokens: " + tokens);
      res.code(200).send("Token received and set");
    }
  );

  server.get("/listFiles", async (req: FastifyRequest, reply: FastifyReply) => {
    const { data } = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken,files(id,name)",
    });
    reply.code(200).send(data.files);
  });
});

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });
    console.log(`Server listening on port: ${3000}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
