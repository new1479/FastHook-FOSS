// Fast-Hook By N3w

import express, { Express, Request, Response } from "express";
import { port, mongo_url } from "./config.json";
import favicon from "serve-favicon"
import { connect } from "mongoose";
import helmet from "helmet";
import { join } from "path"

import routes from "./bot/main"
const app: Express = express();

app.use(express.static(join(__dirname, "static")));
app.use(favicon(__dirname + "/static/fhook.ico"));
app.use(express.json({ limit: "1mb" }));
app.use(helmet({ xPoweredBy: false }));
app.disable("x-powered-by");

app.get("/", (req: Request, res: Response) => {
    return res.send("Hello World!");
});

app.get("/discord", (req: Request, res: Response) => {
    return res.status(301).redirect(`https://discord.gg/p5sZpNrtfB`);
});

app.use("/api", routes);

app.get("*", (req: Request, res: Response) => {
    return res.status(404).json({
        status: "404",
        content: "Page Not Found."
    });
});

connect(mongo_url).then(() => {
    console.log(`Database server online!`);

    app.listen(port, () => {
        console.log(`Listening to ${port}`);
    });
});