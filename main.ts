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

const jetstream = new Jetstream({
  wantedCollections: ["app.bsky.feed.post"],
  // we DO NOT want to use a cursor, since we only want live posts
  // if you're forking this to make your own labeller, check out
  // https://github.com/mozzius/kiki-bouba-labeller/blob/main/src/main.ts
  endpoint: "wss://jetstream2.us-east.bsky.network/subscribe",
});

jetstream.on("error", (err) => console.error(err));

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
