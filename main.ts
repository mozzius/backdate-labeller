import { LabelerServer } from "npm:@skyware/labeler";
import { Jetstream } from "npm:@skyware/jetstream";
import { load } from "jsr:@std/dotenv";

const {
  LABELER_DID,
  SIGNING_KEY,
} = await load();

const LABELS = {
  BACKDATED: "backdated",
  FORWARDDATED: "forwarddated",
};

const server = new LabelerServer({
  did: LABELER_DID,
  signingKey: SIGNING_KEY,
});

server.start(14831, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
  } else {
    console.log("Labeler server running on port 14831");
  }
});

let interval: ReturnType<typeof setInterval>;
let cursorFile;
try {
  cursorFile = Deno.readTextFileSync("cursor.txt");
} catch { /* it's fine */ }

if (cursorFile) console.log(`Initiate firehose at cursor ${cursorFile}`);
else console.log("Initiate firehose (no cursor)");

const jetstream = new Jetstream({
  wantedCollections: ["app.bsky.feed.post"],
  cursor: Number(cursorFile),
});

jetstream.on("open", () => {
  interval = setInterval(() => {
    const cursor = jetstream.cursor;
    if (cursor) {
      console.log(`${new Date().toISOString()}: ${cursor}`);
      Deno.writeTextFile("cursor.txt", cursor.toString());
    }
  }, 60000);
});

jetstream.on("error", (err) => console.error(err));

jetstream.on("close", () => clearInterval(interval));

jetstream.onCreate("app.bsky.feed.post", (op) => {
  const now = Date.now();
  try {
    const uri = `at://${op.did}/${op.commit.collection}/${op.commit.rkey}`;
    const claimedDate = new Date(op.commit.record.createdAt);
    const claimedTime = claimedDate.getTime();

    // we give a leeway of 10 minutes
    const leeway = 10 * 60 * 1000;

    const diff = claimedTime - now;

    if (Math.abs(diff) < leeway) return;

    if (claimedTime < now) {
      console.log("backdated by", millisToMins(diff), "minutes", "-", uri);
      server.createLabel({
        uri,
        val: LABELS.BACKDATED,
      });
    }

    if (claimedTime > now) {
      console.log("fowarddated", millisToMins(diff), "minutes", "-", uri);
      server.createLabel({
        uri,
        val: LABELS.FORWARDDATED,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

jetstream.start();

function millisToMins(millis: number) {
  return Math.floor(millis / 60000);
}
