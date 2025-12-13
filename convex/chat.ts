import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { internalAction, mutation, query } from "./_generated/server";

type WikiPage = {
  pageid: string;
  ns: number;
  title: string;
  extract: string;
};

type WikiMissing = {
  ns: number;
  title: string;
  missing: "";
};

type WikiData = {
  batchcomplete: string;
  query: {
    normalized: { from: string; to: string }[];
    pages: { [pageId: string]: WikiPage | WikiMissing };
  };
};

const MESSAGES_QUANTITY = 50;

const WIKI_URL =
  "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=";

/** Search for the string after `"/wiki "` */
const WIKI_REGEX = /^\/wiki\s(.+)/;

const isWikiData = (data: unknown): data is WikiData =>
  (data as WikiData).query?.pages !== undefined;

const isWikiPage = (page: WikiPage | WikiMissing): page is WikiPage =>
  (page as WikiPage).pageid !== undefined;

const getExtract = (data: WikiData) => {
  console.log(JSON.stringify(data, null, 0));

  const firstPageId = Object.keys(data.query.pages)[0];
  const page = data.query.pages[firstPageId];

  return isWikiPage(page) ? page.extract : "No content found";
};

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
          .take(MESSAGES_QUANTITY)
      : await ctx.db.query("messages").order("desc").take(MESSAGES_QUANTITY);

    // Reverse the list so that it's in a chronological order.
    return messages.reverse();
  },
});

export const fetchWikiSummary = internalAction({
  args: { topic: v.string() },

  handler: async (ctx, args) => {
    const response = await fetch(`${WIKI_URL}${args.topic}`);
    const json = await response.json();

    const message = isWikiData(json)
      ? { user: "Wikipedia", body: getExtract(json) }
      : { user: "System", body: "Error: Unexpected response from Wiki" };

    await ctx.scheduler.runAfter(0, api.chat.sendMessage, message);
  },
});
