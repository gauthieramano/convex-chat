import { api, internal } from "./_generated/api";
import { mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";

const WIKI_URL =
  "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=";

/** Search for the string after `"/wiki "` */
const WIKI_REGEX = /^\/wiki\s(.+)/;

function getSummaryFromJson(data: any) {
  console.log(JSON.stringify(data, null, 2));

  const firstPageId = Object.keys(data.query.pages)[0];

  return data.query.pages[firstPageId].extract;
}

export const sendMessage = mutation({
  args: {
    user: v.string(),
    body: v.string(),
  },

  handler: async (ctx, args) => {
    console.log("This TypeScript function is running on the server.");

    await ctx.db.insert("messages", args);

    const wikiRegexResult = args.body.match(WIKI_REGEX);

    if (wikiRegexResult) {
      const topic = { topic: wikiRegexResult[1] };

      await ctx.scheduler.runAfter(0, internal.chat.fetchWikiSummary, topic);
    }
  },
});

export const fetchMessages = query({
  args: {
    nameFilter: v.string(),
  },

  handler: async (ctx, args) => {
    // Get most recent messages first
    const messages = args.nameFilter
      ? await ctx.db
          .query("messages")
          .withIndex("by_user", (q) => q.eq("user", args.nameFilter))
          .order("desc")
          .take(50)
      : await ctx.db.query("messages").order("desc").take(50);

    // Reverse the list so that it's in a chronological order.
    return messages.reverse();
  },
});

export const fetchWikiSummary = internalAction({
  args: { topic: v.string() },

  handler: async (ctx, args) => {
    const response = await fetch(`${WIKI_URL}${args.topic}`);
    const body = getSummaryFromJson(await response.json());

    const message = { user: "Wikipedia", body };

    await ctx.scheduler.runAfter(0, api.chat.sendMessage, message);
  },
});
