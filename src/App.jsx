import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Folder, Target, MessageCircle, Plus, Trash2,
  ChevronRight, ChevronLeft, Send, Loader2, Rocket,
  CheckCircle2, Circle, Megaphone, PenTool, Palette, Handshake, X, LogIn, Pencil, Check,
  Download, Pin, PinOff, Bookmark, Archive, ArchiveRestore, Search, ArrowUp, ArrowDown,
  RefreshCw, Clock3, Activity, LogOut
} from "lucide-react";
import { supabase, COACH_CHAT_URL } from "./supabaseClient";

/* =========================================================
   Where people go to pay if they land here without a plan.
   Update this if your paywall URL ever changes.
========================================================= */
const PAYWALL_URL = "https://hustlefile.io/hustle-paywall.html";

/* =========================================================
   How many recent messages get sent to the coach on each turn.
   Full history still lives in the database and is shown in the UI
   (and stays fully searchable) - this only caps what's re-sent to
   the API, so a long-running thread's cost doesn't grow unbounded.
========================================================= */
const MAX_HISTORY_MESSAGES = 20;

/* =========================================================
   QUESTIONS
========================================================= */
const QUESTIONS = [
  {
    key: "skills", tag: "Q1 — Background Check", title: "What skills do you already have?", multi: true,
    hint: "Pick as many as apply.",
    options: [
      { v: "design", k: "Visual", l: "Design & graphics" },
      { v: "video", k: "Visual", l: "Video editing" },
      { v: "writing", k: "Verbal", l: "Writing & storytelling" },
      { v: "gaming", k: "Player", l: "Gaming skill / deep game knowledge" },
      { v: "marketing", k: "Growth", l: "Social media & marketing" },
      { v: "coding", k: "Builder", l: "Coding & software" },
      { v: "oncam", k: "Presence", l: "Voice, streaming, or on-camera" },
      { v: "community", k: "People", l: "Community management" },
      { v: "sales", k: "Deals", l: "Sales & negotiation" },
      { v: "strategy", k: "Operator", l: "Business & strategy" }
    ]
  },
  {
    key: "budget", tag: "Q2 — Bankroll", title: "How much money can you invest to start?", multi: false,
    options: [
      { v: 0, k: "Tier I", l: "Under $50" },
      { v: 1, k: "Tier II", l: "$50 - $200" },
      { v: 2, k: "Tier III", l: "$200 - $1,000" },
      { v: 3, k: "Tier IV", l: "$1,000+" }
    ]
  },
  {
    key: "hours", tag: "Q3 — Time on the Clock", title: "How many hours a week can you actually work this?", multi: false,
    options: [
      { v: 0, k: "Light", l: "Under 5 hrs/week" },
      { v: 1, k: "Part-time", l: "5 - 10 hrs/week" },
      { v: 2, k: "Serious", l: "10 - 20 hrs/week" },
      { v: 3, k: "Full send", l: "20+ hrs/week" }
    ]
  },
  {
    key: "category", tag: "Q4 — Trade", title: "What do you actually want to sell?", multi: false,
    options: [
      { v: "product", k: "Make", l: "Products" },
      { v: "service", k: "Do", l: "Services" },
      { v: "content", k: "Create", l: "Content" },
      { v: "software", k: "Build", l: "Software" },
      { v: "not-sure", k: "Open", l: "Not sure - show me what fits" }
    ]
  },
  {
    key: "goal", tag: "Q5 — The Getaway Plan", title: "Fast income, or a scalable business?", multi: false,
    options: [
      { v: "fast", k: "Now", l: "Fast income - cash within days" },
      { v: "scalable", k: "Later", l: "Scalable business - build for months ahead" }
    ]
  },
  {
    key: "audience", tag: "Q6 — Known Associates", title: "Do you already have an audience?", multi: false,
    options: [
      { v: "none", k: "Zero", l: "No, starting from zero" },
      { v: "small", k: "Small", l: "A small following (under 1,000)" },
      { v: "yes", k: "Built-in", l: "Yes, an established audience" }
    ]
  }
];

const BUDGET_LABELS = ["Under $50", "$50-$200", "$200-$1,000", "$1,000+"];
const HOURS_LABELS = ["Under 5 hrs/wk", "5-10 hrs/wk", "10-20 hrs/wk", "20+ hrs/wk"];
const CATEGORY_LABEL = { product: "Product", service: "Service", content: "Content", software: "Software" };

const WEEK_TEMPLATE = [
  { label: "Week 1 - Foundation", items: ["Complete the 7-day checklist", "Finalize your offer and pricing", "Set up every tool you need before selling"] },
  { label: "Week 2 - First Customers", items: ["Run outreach across every customer channel", "Land 2-3 paying customers at intro pricing", "Collect a testimonial from each"] },
  { label: "Week 3 - Systemize", items: ["Turn your process into a repeatable checklist", "Raise prices slightly for new customers", "Test one new acquisition channel"] },
  { label: "Week 4 - Scale Toward Nov 19", items: ["Increase output or client capacity", "Build a content/inventory buffer for launch-week demand", "Set a post-launch pricing plan before the surge hits"] }
];

/* =========================================================
   OPPORTUNITY DATABASE  (unchanged from the quiz)
========================================================= */
const OPPS = [
  { id: "thumbnails", name: "GTA 6 Thumbnail & Channel Art Studio", tagline: "Design scroll-stopping thumbnails and channel art for the flood of new GTA 6 creators who cannot design their own.", category: "service", skills: ["design"], minBudget: 0, minHours: 0, goal: "fast", audience: "not-needed", offer: "Three thumbnail concepts for a single video, delivered in 24-48 hours, with one round of revisions included.", pricing: ["3 thumbnails for $25, or a 5-pack for $60", "A 10-thumbnail monthly retainer for $150", "Retainer clients at $250/mo plus a $75 channel-art refresh", "Package deals for multi-channel networks at $400+/mo"], tools: ["Canva Pro or Photoshop", "A folder of licensed GTA 6 screenshots and official key art only", "Stock face/expression packs for reaction-style thumbnails", "A simple Stripe or PayPal checkout link", "Trello or Notion to track orders"], checklist: ["Pick 3 software tools and build one practice thumbnail from a public GTA 6 trailer screenshot", "Design 5 sample thumbnails across different styles to build a portfolio", "Post the portfolio in 2 GTA-focused Discord servers and on X", "Set your starter price and create a simple order form", "DM 15 small-to-mid GTA content creators offering a free first thumbnail for a testimonial", "Deliver the free samples fast and ask directly for a paid follow-up order", "Publish your rates publicly and open a waitlist for launch week"], findCustomers: ["Reply to GTA creator videos with a redesigned thumbnail mockup attached", "GTA 6 Discord servers with a creator-services channel", "Fiverr/Upwork gig listing for gaming thumbnail design", "Facebook groups for YouTube gaming creators", "Cold DMs to channels between 500-20,000 subscribers"], risks: ["Thumbnail work is commoditized - differentiate on turnaround speed and a consistent style, not just price", "Do not use ripped or leaked assets; stick to official trailers, screenshots, and your own renders", "Cap revisions at one round or a $25 job becomes a $100 job", "Demand will spike hard around launch week - decide your capacity limit now"] },
  { id: "clips", name: "GTA 6 Clips & Highlight Editing Service", tagline: "Turn streamers' raw GTA 6 footage into short-form clips for TikTok, Shorts, and Reels.", category: "service", skills: ["video"], minBudget: 0, minHours: 1, goal: "fast", audience: "not-needed", offer: "Five vertical highlight clips cut from one hour of raw footage, with captions and a hook in the first 2 seconds.", pricing: ["5 clips for $40", "10 clips/week retainer for $120/mo", "20 clips/week plus a posting calendar for $300/mo", "Full channel management from $600/mo"], tools: ["CapCut or Premiere Pro", "An auto-captioning tool", "A shared drive for raw footage handoff", "A board to track turnaround per client"], checklist: ["Cut 3 demo clips from public GTA Online or GTA 6 trailer footage", "Post the demo reel on TikTok and Instagram with GTA hashtags", "Message 20 small streamers under 5,000 followers offering a free trial batch", "Build a simple one-page pricing sheet", "Deliver the free trial batch within 48 hours", "Ask every trial client directly for a paid recurring slot", "Set a weekly intake cutoff so your schedule does not collapse"], findCustomers: ["Comment on GTA streamers' VODs offering a free sample clip", "Twitch GTA category, message active streamers directly", "GTA subreddits and creator subreddits (follow self-promo rules)", "Referrals from other editors who are at capacity", "Discord servers for streamers looking for editors"], risks: ["Streamers churn - use month-to-month contracts, not big upfront commitments", "Fast turnaround is the entire value prop; missed deadlines kill repeat business", "Do not promise viral results - promise consistent output", "Raw footage files are large; make sure your delivery workflow can handle it"] },
  { id: "channel", name: "GTA 6 Commentary & Let's Play Channel", tagline: "Build a YouTube or TikTok channel around GTA 6 gameplay, reactions, or story commentary, and monetize the audience itself.", category: "content", skills: ["gaming", "oncam", "writing"], minBudget: 0, minHours: 2, goal: "scalable", audience: "helps", offer: "A themed content series (story-mode commentary, heist strategy breakdowns, or lore videos) posted on a fixed schedule.", pricing: ["Free to start - monetize via ads and affiliate links once you have traction", "Small brand deals from $100-$500 per integration", "Channel memberships from $3-$15/month", "Sponsorship packages $500+ once you're established"], tools: ["A capture setup (capture card or OBS)", "A basic mic and editing software", "A content calendar", "Analytics dashboards"], checklist: ["Pick one specific content angle, not general GTA 6 content", "Record and publish your first 3 videos", "Design a consistent thumbnail template and channel banner", "Post in 3 GTA subreddits and Discords following self-promo rules", "Set a fixed posting schedule and commit to it publicly", "Cross-post every video as a short-form clip", "Reach out to 5 small sponsors once you hit 1,000 subscribers"], findCustomers: ["Organic search discovery on YouTube/TikTok", "Reddit communities - contribute genuinely, do not just post links", "Collabs with similarly-sized creators", "Short-form clips as a funnel to the long-form channel", "Meaningful comments on bigger GTA creators' videos"], risks: ["Slowest path to income here - budget 2-3 months before real monetization", "Respect Rockstar/Take-Two's content and monetization policies", "Algorithm dependency means income is never fully predictable", "Burnout risk from a rigid schedule; build a content buffer before launch week"] },
  { id: "guides", name: "GTA 6 Strategy Guide & Walkthrough Site", tagline: "A fast, well-organized reference site for GTA 6 missions, collectibles, and mechanics, monetized with ads and affiliate links.", category: "content", skills: ["writing", "coding"], minBudget: 1, minHours: 2, goal: "scalable", audience: "not-needed", offer: "A structured guide hub (walkthroughs, map/collectible locations, build tips) optimized to rank in search.", pricing: ["Free to read - display ads once traffic builds", "Affiliate commissions from gaming gear, 5-15% per sale", "Sponsored guide placements, $150-$500 once traffic is established", "A premium ad-free membership at $3-$5/month"], tools: ["A lightweight site builder", "Google Search Console and basic SEO tooling", "An ad network or affiliate program", "A content calendar for patch updates"], checklist: ["Register a domain and stand up a bare-bones site", "Write and publish 5 cornerstone guide pages using confirmed information only", "Set up Search Console and submit your sitemap", "Interlink every guide page", "Join one relevant affiliate program", "Publish an evergreen release-date hub page to catch pre-launch search traffic", "Set a weekly publishing cadence you can sustain through launch week"], findCustomers: ["Search traffic is the entire acquisition strategy - invest early in SEO", "Pin your best guides where allowed in subreddits and Discords", "Build an email list from day one", "Partner with a creator who can link your guides"], risks: ["Google's algorithm can swing traffic wildly - do not rely on search alone", "Never publish unverified leaks as fact", "Slow-build model - expect near-zero income for 4-8 weeks", "Ad income needs real traffic volume before it is meaningful"] },
  { id: "discord", name: "Paid GTA 6 Squad-Finder & Community", tagline: "Run a premium Discord community that matches players for heists, crews, and events, and sells access or perks.", category: "service", skills: ["community", "marketing"], minBudget: 0, minHours: 1, goal: "scalable", audience: "helps", offer: "A free community with a paid tier that unlocks priority squad-matching, exclusive events, and early-access info drops.", pricing: ["Free base server, $4.99/month premium tier", "Founding member lifetime access for $19.99", "Sponsored server partnerships, $100-$300/mo", "Event ticketing, $2-$5 per ticket"], tools: ["Discord with a role/payment bot", "A payment processor integration", "Branding graphics for the server", "A moderation team as it grows"], checklist: ["Set up the server with clear channels: general, LFG, events, support", "Write server rules before opening invites", "Recruit 20 founding members for free", "Run one small matchmaking event to prove the concept", "Set up the paid tier and grandfather founding members into a discount", "Announce the premium tier publicly with a clear perks list", "Recruit 1-2 volunteer moderators before 500 members"], findCustomers: ["Cross-promote in other GTA Discord servers with permission", "Short clips showing matchmaking in action", "Reddit posts framed as looking-for-crew content, not ads", "Partner with a small streamer to co-host events"], risks: ["Requires constant moderation - budget real time for this", "Discord monetization tools change often; verify current options", "Lives or dies on active moderators", "Do not overpromise matchmaking quality before you have enough members"] },
  { id: "coaching", name: "One-on-One GTA 6 Coaching Sessions", tagline: "Sell your game knowledge directly: heist strategy, PvP tactics, or speedrun technique, taught live.", category: "service", skills: ["gaming", "sales"], minBudget: 0, minHours: 0, goal: "fast", audience: "not-needed", offer: "A 45-minute one-on-one coaching call focused on one specific skill the client wants to improve.", pricing: ["A single 45-minute session for $20", "A 3-session bundle for $50", "Group coaching (up to 4 people) at $12/person", "VIP monthly retainer at $80/month"], tools: ["A booking link", "Discord or Zoom for the session", "A payment link", "A short intake form"], checklist: ["Write down the 3 specific skills you are most confident coaching", "Set up a free booking link and a payment link", "Offer 3 free trial sessions to build testimonials", "Post the offer in GTA Discords and Reddit where allowed", "Collect a short testimonial from each trial client", "Publish your rates and open real bookings", "Ask every satisfied client for one referral"], findCustomers: ["GTA Discord servers with a coaching or LFG channel", "Fiverr gig listing under gaming coaching", "Short clips demonstrating a technique with a booking link", "Word of mouth from your own crew"], risks: ["Reputation is the entire product - a bad session kills referrals fast", "Time-for-money does not scale; treat this as fast cash, not a ceiling", "Be upfront about what you can and cannot teach", "Session no-shows eat your week - consider requiring payment upfront"] },
  { id: "socialmgmt", name: "Social Media Management for GTA Creators", tagline: "Run the posting, captions, and community replies for GTA content creators who are too busy playing to post consistently.", category: "service", skills: ["marketing", "writing"], minBudget: 0, minHours: 2, goal: "scalable", audience: "not-needed", offer: "Done-for-you social posting: captions, scheduling, and basic community replies across 1-2 platforms.", pricing: ["One platform managed for $150/mo", "Two platforms plus a content calendar for $300/mo", "Full-service with a monthly analytics report for $500/mo", "Launch-week surge package at a premium rate"], tools: ["A scheduling tool", "A shared content calendar", "Canva for quick graphics", "A monthly reporting template"], checklist: ["Build a one-page service menu with clear deliverables and pricing", "Offer a free 1-week trial to 3 small creators", "Set up a reusable content calendar template", "Deliver the trial week and document engagement results", "Turn every trial into a pitch call for the paid retainer", "Systemize your process into a repeatable checklist", "Set a client cap based on your available hours"], findCustomers: ["DM creators who post inconsistently but have an engaged audience", "Gaming creator Discord and Facebook groups", "Referrals from clients to their network", "Offer a free social audit as a low-pressure opener"], risks: ["Client churn is common - diversify across several small clients", "Be explicit about what management includes to avoid scope creep", "Get a clear brand/tone brief before posting anything", "Algorithm changes affect results outside your control - set expectations"] },
  { id: "digitalmerch", name: "Digital Merch: Wallpapers, Icon Packs & Printables", tagline: "Design and sell downloadable GTA 6-inspired digital goods: wallpapers, Discord icon packs, planner printables.", category: "product", skills: ["design"], minBudget: 0, minHours: 0, goal: "scalable", audience: "not-needed", offer: "A themed digital bundle (10 wallpapers, or a Discord icon/emoji pack) sold as an instant download.", pricing: ["A single bundle for $4.99", "A complete collection bundle for $12.99", "Custom one-off commissions from $15", "A monthly new-drop subscription at $3/month"], tools: ["Design software", "A storefront such as Gumroad or Etsy", "A simple watermarking process for previews", "Social accounts to showcase the art"], checklist: ["Design one complete themed bundle using original artwork only", "Set up a storefront and list the bundle", "Post watermarked previews on Pinterest, Instagram, and X", "Join 2-3 GTA fan communities and share where self-promotion is welcome", "Run a launch discount for the first week", "Design a second bundle based on what sold best", "Set up an email capture for new-drop notifications"], findCustomers: ["Pinterest for wallpaper/aesthetic discovery", "Etsy search traffic", "Instagram and TikTok showing assets in use", "GTA fan Discords and subreddits with an art-sharing channel"], risks: ["Use only original artwork - never resell ripped textures or official key art", "Marketplace fees eat into thin margins - price accordingly", "Low price points mean volume matters; slow build without an audience", "Trend-driven demand spikes around launch and fades - plan your catalog accordingly"] },
  { id: "printmerch", name: "Print-on-Demand GTA-Inspired Merch", tagline: "Original, fan-art apparel and posters inspired by the Vice City aesthetic, sold via print-on-demand with zero inventory risk.", category: "product", skills: ["design", "strategy"], minBudget: 1, minHours: 1, goal: "scalable", audience: "helps", offer: "A small original-design apparel line evoking the Vice City neon aesthetic, without using Rockstar's logos or copyrighted art.", pricing: ["T-shirts priced $24.99", "Posters priced $18.99", "A limited launch-week drop at a small premium with scarcity", "Bundle deals at $38"], tools: ["A print-on-demand platform connected to a storefront", "Design software for original artwork", "A small ad-testing budget if available", "Basic mockup generator tools"], checklist: ["Sketch 5 original design concepts with no copyrighted logos or characters", "Set up a POD storefront", "Order one physical sample to check print quality", "Shoot simple product photos or mockups", "Launch with 3 designs and an introductory discount", "Post the drop across GTA fan communities", "Track which design sells best and expand that line first"], findCustomers: ["Etsy search traffic for gaming-inspired apparel", "Instagram/TikTok outfit content featuring the merch", "GTA fan communities that allow merch shares", "Small paid ad tests once you know your best-seller"], risks: ["Trademark territory - avoid logos or character likenesses; sell inspired originals only", "POD margins are thin; model shipping costs carefully", "More upfront capital and lead time than digital-only options", "Order samples before promoting broadly to check quality"] },
  { id: "app", name: "GTA 6 Build & Loadout Companion Tool", tagline: "A lightweight web or mobile app that helps players optimize character builds, weapon loadouts, or heist planning.", category: "software", skills: ["coding"], minBudget: 0, minHours: 2, goal: "scalable", audience: "not-needed", offer: "A free companion tool with a small premium tier for advanced features.", pricing: ["Free core tool with ads early on", "A $2.99 one-time upgrade to remove ads / unlock features", "A $1.99/month subscription for cloud-synced builds", "Sponsorship or affiliate placements once usage is meaningful"], tools: ["A frontend framework or simple static site", "Free-tier hosting", "A lightweight backend only if you need saved data", "Usage analytics"], checklist: ["Pick one narrow, useful feature instead of everything", "Build and ship a working prototype", "Get 5 people from GTA communities to test it", "Fix the top 3 pieces of feedback", "Publish it with a simple landing page", "Post it as a genuinely useful free tool, not a sales pitch", "Add monetization only after you have real regular users"], findCustomers: ["Reddit and Discord communities that welcome fan-made tools", "Launch communities for an initial traffic spike", "Search traffic once indexed", "Streamers who might mention a genuinely useful free tool"], risks: ["Do not build the full feature set before validating demand", "Fan tools need maintenance as the game patches", "Free tools need real usage before revenue is meaningful - slowest path here", "Never build anything that reads game memory or automates play"] },
  { id: "promptpack", name: "Creator Toolkit: Titles, Scripts & Prompt Packs", tagline: "Package your understanding of what works in GTA content into a toolkit sold to other creators.", category: "software", skills: ["coding", "writing"], minBudget: 0, minHours: 1, goal: "scalable", audience: "not-needed", offer: "A downloadable toolkit: proven video title formulas, script outlines for common formats, and a thumbnail brief template.", pricing: ["The toolkit for $9.99", "A creator starter kit bundle for $35", "A monthly trend-pack subscription at $5/month", "A private consulting add-on at $30/30 minutes"], tools: ["A doc/PDF builder", "A storefront such as Gumroad", "Research time watching top-performing videos", "An email list tool for future updates"], checklist: ["Study 30 top-performing videos in the niche for recurring patterns", "Draft the first version of the toolkit", "Get 3 creators to review it for free in exchange for feedback", "Revise based on feedback and finalize it", "List it with a clear before/after example", "Share it directly with small creators who post inconsistently", "Update the pack monthly to keep it relevant"], findCustomers: ["Small-to-mid creators who underperform relative to effort", "Creator-focused Discord servers and subreddits", "Threads breaking down what is working in the niche", "Bundling with the thumbnail or social-management services above"], risks: ["Sells best to people who already believe content works - prove the concept first", "Low price point works best as an add-on, not a standalone business", "Templates go stale fast without updates", "Be honest about what it can and cannot guarantee"] },
  { id: "streamsetup", name: "Livestream Production & Overlay Design", tagline: "Build custom stream overlays, alerts, and scene setups for GTA 6 streamers who want a professional look.", category: "service", skills: ["design", "coding"], minBudget: 1, minHours: 1, goal: "fast", audience: "not-needed", offer: "A full custom stream package: overlay, alert graphics, panels, and OBS scene setup, ready to drop in.", pricing: ["A basic overlay pack for $60", "A full package with a setup call for $150", "Ongoing seasonal refreshes at $40/refresh", "Rush 48-hour delivery for a $25 premium"], tools: ["Design software", "OBS or Streamlabs for testing", "Alert integration tooling", "A portfolio site or page"], checklist: ["Design one complete overlay package as a portfolio piece with an original theme", "Set it up in OBS yourself to confirm it works technically", "Post the portfolio piece in streamer-focused Discords and subreddits", "Offer 2 free setups in exchange for a shoutout or testimonial", "Package your pricing into 2-3 clear tiers", "Deliver the free setups with a walkthrough call included", "Open paid bookings with a calendar link"], findCustomers: ["Streamers in the GTA category with outdated overlays", "Streamer-focused Discord servers and subreddits", "Fiverr listing for stream overlay design", "Referrals from streamers you've already worked with"], risks: ["Technical setup issues eat more time than the design itself - budget for support", "Mostly one-time purchases per client - build in refresh packages for repeat revenue", "Design trends shift fast; keep a modern portfolio", "Be clear about what's included versus billable extras"] },
  { id: "newsletter", name: "GTA 6 Insider Newsletter & Membership", tagline: "A recurring newsletter or membership delivering curated GTA 6 news, patch breakdowns, and strategy tips.", category: "content", skills: ["writing", "community"], minBudget: 0, minHours: 2, goal: "scalable", audience: "helps", offer: "A weekly email digest of confirmed GTA 6 news and strategy tips, free to subscribe, with a paid tier for deeper breakdowns.", pricing: ["Free tier, funded later by sponsors", "A paid tier at $5/month for members-only content", "Annual membership at $45/year", "Sponsor placements, $75-$250 per issue once the list has reach"], tools: ["An email platform with a free tier", "A content calendar tied to news cycles and patches", "A simple sign-up landing page", "Social accounts to promote each issue"], checklist: ["Pick your specific angle instead of trying to cover everything", "Set up the platform and a clean sign-up page", "Write and send your first 2 issues before promoting hard", "Share issue highlights as standalone posts to drive sign-ups", "Set a consistent send schedule and stick to it", "Introduce the paid tier once you have ~200+ engaged subscribers", "Reach out to 3 relevant sponsors once your list has real numbers"], findCustomers: ["Reddit and Discord communities, sharing genuinely useful excerpts", "Cross-promotion swaps with similar-sized newsletters", "A sign-up prompt embedded in your other GTA content", "SEO for GTA 6 news roundup searches"], risks: ["Growing an email list takes real, consistent time - not a fast-income option", "Only report confirmed information; unverified leaks damage credibility", "Newsletter fatigue is real - keep a strict, sustainable schedule", "Sponsorship revenue only comes once the list has reach - budget a runway"] },
  { id: "longform", name: "Long-Form Video Editing Service", tagline: "Edit raw GTA 6 gameplay and commentary footage into polished long-form videos ready to publish.", category: "service", skills: ["video"], minBudget: 0, minHours: 1, goal: "fast", audience: "not-needed", offer: "One full long-form video edited - cuts, pacing, captions, and basic sound - delivered in 48-72 hours.", pricing: ["One video edited for $50", "4 videos a month for $180", "8 videos a month for $320", "Full channel editing plus thumbnails bundle from $500/mo"], tools: ["Premiere Pro or DaVinci Resolve", "An auto-captioning tool", "A shared drive for footage handoff", "A simple revision-tracking doc"], checklist: ["Edit one demo video from public GTA footage to show your pacing and style", "Post the demo as a before/after comparison on X and in editor communities", "Message 15 mid-size creators (10k-100k) offering a discounted first edit", "Set a clear turnaround time and stick to it on the first few jobs", "Deliver the discounted edits fast and ask for a testimonial", "Turn the best trial clients into a monthly retainer", "Set a weekly video cap so quality does not slip as you take on more"], findCustomers: ["Creator Discord servers with an editor-for-hire channel", "Reply to small GTA creators' videos with editing feedback and an offer", "Fiverr/Upwork listing for long-form gaming video editing", "Referrals from clients to other creators in their circle"], risks: ["Long-form editing takes real hours per video - price for your actual time, not just footage length", "Footage delivery delays from clients can stall your whole week - set clear deadlines upfront", "Style mismatches happen; get a reference video from the client before starting", "Raw footage files are large - confirm your storage and upload speed can keep up"] },
  { id: "brandingstudio", name: "Channel Branding & Motion Graphics Studio", tagline: "Full visual identity packages - logos, banners, and animated intros - for GTA 6 creators and RP servers.", category: "service", skills: ["design"], minBudget: 1, minHours: 1, goal: "fast", audience: "not-needed", offer: "A complete branding package: logo, channel banner, an animated intro/outro, and a matching lower-third template.", pricing: ["A logo and banner combo for $75", "Add an animated intro/outro for $150 total", "Full branding kit (logo, banner, intro, outro, lower-third) for $250", "Ongoing motion graphics retainer at $200/mo for RP servers needing new assets regularly"], tools: ["Adobe Illustrator or Canva Pro for logos and banners", "After Effects or a template-based motion tool for animation", "A style-reference intake form for clients", "A portfolio site or Behance page"], checklist: ["Design one complete branding kit as a portfolio piece using an original theme", "Build the animated intro yourself and test it in OBS or an editing timeline", "Post the portfolio piece in creator and RP-server Discords", "Offer 2 discounted kits to small creators or servers for testimonials", "Package pricing into clear tiers before taking real orders", "Deliver the discounted kits with a short walkthrough of how to use the assets", "Open paid bookings with a simple intake form"], findCustomers: ["RP server Discords looking for a professional look", "Small creators with default or outdated branding", "Fiverr listing under channel branding or logo design", "Referrals from RP server owners to other server owners"], risks: ["Branding is often a one-time purchase - build in seasonal refresh packages for repeat revenue", "Animation software has a real learning curve; budget time to get comfortable before promising fast turnarounds", "Scope creep is common here - define exactly what revisions are included upfront", "RP servers often want free work in exchange for exposure - decide your policy on this ahead of time"] },
  { id: "discordsetup", name: "Discord Server Setup & Design Service", tagline: "Fully configured, branded Discord servers - channels, roles, bots, and emojis - ready to launch in 48 hours.", category: "service", skills: ["community", "design"], minBudget: 0, minHours: 0, goal: "fast", audience: "not-needed", offer: "A complete Discord server build: organized channels, role structure, moderation bots, custom emojis, and a branded banner.", pricing: ["A basic server setup for $40", "Add custom emojis and role icons for $65 total", "A full branded build (setup plus banner plus emoji pack) for $120", "Ongoing server management retainer at $150/mo"], tools: ["A Discord account with server admin experience", "Bot recommendations for moderation, leveling, and welcome flows", "Canva for emoji and banner design", "A client intake questionnaire for server goals"], checklist: ["Build one complete demo server for a fictional GTA RP community as a portfolio piece", "Screen-record a walkthrough of the server to show structure and features", "Post the demo in server-owner and RP community Discords", "Offer 2 free or discounted setups for new or struggling servers", "Collect a testimonial from each after launch", "Package your offer into clear tiers", "Open paid bookings with a short intake form covering server goals and size"], findCustomers: ["New RP server owners posting in GTA subreddits looking for help", "Discord server-owner communities and forums", "Word of mouth from server owners you've already helped", "Fiverr listing under Discord server setup"], risks: ["Discord's bot and feature landscape changes often - keep your recommendations current", "A server is only as good as its moderation after launch - be clear you are not signing up for ongoing moderation unless paid separately", "Free trial servers can turn into unpaid ongoing support requests - set a clear end date for included help", "Server owners sometimes want to copy a competitor's structure exactly - clarify original work upfront"] },
  { id: "vascript", name: "VA & Scriptwriting Service for Creators", tagline: "Weekly video scripts plus inbox and schedule management so creators can focus only on filming.", category: "service", skills: ["writing", "strategy"], minBudget: 0, minHours: 1, goal: "fast", audience: "not-needed", offer: "A weekly script for one video plus light admin support - replying to comments, scheduling uploads, and organizing collab requests.", pricing: ["One script for $30", "4 scripts a month for $100", "Scripts plus weekly admin support for $250/mo", "Full creator-ops retainer (scripts, admin, scheduling) from $400/mo"], tools: ["A shared doc for scripts and notes", "A scheduling tool for posting and replies", "A simple intake form for each video's topic and tone", "A task tracker shared with the client"], checklist: ["Write 2 sample scripts in different GTA content styles to show range", "Post the samples in creator communities as portfolio proof", "Message 15 creators who post inconsistently offering a free first script", "Deliver the free scripts fast with a short turnaround", "Ask each trial client directly for a paid weekly arrangement", "Build a repeatable intake process so new scripts take less time each week", "Set a client cap based on your available hours before adding admin work"], findCustomers: ["Creators who talk about being overwhelmed with editing and posting", "Creator-focused Discord servers and subreddits", "Fiverr/Upwork listing for scriptwriting or creator VA work", "Referrals from clients to creators in their network"], risks: ["Matching someone else's voice in a script takes real back-and-forth at first - budget extra time for the first few", "VA-style work can quietly expand into unpaid extra tasks - keep a written scope of what is included", "Inconsistent creators are also inconsistent clients - get a deposit or retainer instead of pay-per-script for reliability", "This is relationship-dependent work; losing one big client can be a real income hit if you rely on just one"] },
  { id: "plannerbundle", name: "GTA 6 Productivity Templates & Planners", tagline: "Digital planners and printable challenge cards themed around GTA RP and content planning.", category: "product", skills: ["design", "strategy"], minBudget: 0, minHours: 0, goal: "scalable", audience: "not-needed", offer: "A themed digital bundle - a Notion content-planning template plus printable RP challenge cards - sold as an instant download.", pricing: ["A single template for $6.99", "The full planner bundle for $14.99", "A custom-branded version for a creator's own audience for $40", "A monthly new-template subscription at $4/month"], tools: ["Notion for template building", "Canva for printable card design", "A storefront such as Gumroad or Etsy", "Social accounts to showcase the templates in use"], checklist: ["Build one complete Notion template and one printable card set", "Set up a storefront and list both", "Post screen recordings of the template in use on TikTok and Pinterest", "Share in GTA RP and content-creator communities where self-promotion is welcome", "Run a launch discount for the first week", "Build a second template based on what sold best", "Set up an email list for new template announcements"], findCustomers: ["Pinterest for planner and template discovery", "RP community Discords and subreddits", "Content-creator productivity communities", "TikTok showing the template being used day-to-day"], risks: ["Notion template markets are crowded - a specific RP or GTA angle is your actual differentiator, keep it sharp", "Low price points mean volume matters - this is a slow build without some audience to launch to", "Templates need occasional updates as Notion's features change", "Printable products depend on decent print quality - test print your own designs before selling them"] },
  { id: "templateshop", name: "Design Template Shop", tagline: "Editable thumbnail PSDs, Canva templates, and font/icon packs sold to creators who cannot design their own.", category: "product", skills: ["design"], minBudget: 0, minHours: 0, goal: "scalable", audience: "not-needed", offer: "A bundle of editable thumbnail templates (PSD and Canva formats) plus a matching icon pack, ready to drop a creator's own footage into.", pricing: ["A 5-template pack for $9.99", "The full bundle (templates plus icon pack) for $19.99", "A custom template built to a creator's exact channel style for $35", "A monthly new-template subscription at $5/month"], tools: ["Photoshop for PSD templates", "Canva Pro for the Canva-native versions", "A storefront such as Gumroad or Etsy", "A screen-recording tool to show templates in use"], checklist: ["Build one complete template pack covering a popular GTA content style", "Set up a storefront and list the pack with a clear before/after preview", "Post a quick video showing how fast a thumbnail comes together using the template", "Share in design and creator communities where self-promotion is welcome", "Run a launch discount for the first week", "Build a second pack in a different visual style based on what sold", "Set up an email list for new template drops"], findCustomers: ["Etsy and Gumroad search traffic for thumbnail templates", "Small creators who post asking for design help", "Pinterest for template previews", "Creator Discord servers with a resources channel"], risks: ["Templates only sell if they genuinely save time - test that your own workflow is actually faster with them", "Marketplace fees eat into these low price points - account for that when pricing", "Trends in thumbnail style shift; refresh packs periodically or sales taper off", "PSD files require the buyer to own Photoshop - offer a Canva version too or you cut out a chunk of your market"] },
  { id: "soundpacks", name: "Sound Effect & Alert Bundle Packs", tagline: "Original sound effect and stream alert audio packs themed around the GTA 6 world, sold to streamers and editors.", category: "product", skills: ["video"], minBudget: 0, minHours: 0, goal: "scalable", audience: "not-needed", offer: "A themed audio bundle - stream alert sounds, transition whooshes, and UI click sounds - sold as an instant download.", pricing: ["A basic 10-sound pack for $7.99", "The full bundle (alerts plus transitions plus UI sounds) for $16.99", "A custom alert set built for one streamer's brand for $30", "A monthly new-pack subscription at $4/month"], tools: ["Audio editing software - Audacity is free, or Adobe Audition", "Original or properly licensed sound sources, never ripped game audio", "A storefront such as Gumroad", "A short demo reel to showcase the sounds"], checklist: ["Build one complete sound pack using only original or licensed audio sources", "Create a short demo video playing through each sound with captions", "Set up a storefront and list the pack", "Share the demo in streamer and editor communities where self-promotion is welcome", "Run a launch discount for the first week", "Build a second pack in a different style based on what sold", "Set up an email list for new pack announcements"], findCustomers: ["Streamlabs/StreamElements alert marketplaces if they accept outside submissions", "Streamer-focused Discord servers and subreddits", "Gumroad and Etsy search traffic", "Editor communities looking for transition sound effects"], risks: ["Never use ripped game audio - stick to original recordings or properly licensed sound libraries", "Audio is an easy category to pirate - watermark demos and accept some loss as a cost of doing business", "This is a smaller, more niche market than visual products - pair it with a visual pack for better bundle sales", "Sound design quality is easy for buyers to judge instantly - keep a genuinely polished demo"] },
  { id: "animatedwallpaper", name: "Animated Wallpaper & Live Overlay Pack", tagline: "Motion wallpapers and live desktop/stream overlays inspired by the Vice City aesthetic, sold as digital downloads.", category: "product", skills: ["design", "video"], minBudget: 1, minHours: 1, goal: "scalable", audience: "not-needed", offer: "A pack of short looping animated wallpapers and matching live stream overlay elements, sold as an instant download bundle.", pricing: ["A single animated wallpaper for $6.99", "A 5-pack bundle for $22.99", "A custom-branded animated overlay for one streamer for $60", "A monthly new-drop subscription at $6/month"], tools: ["After Effects or a template-based motion tool", "Wallpaper Engine or similar for the animated wallpaper format", "A storefront such as Gumroad", "Screen recordings to preview the motion before purchase"], checklist: ["Build one complete animated wallpaper using an original Vice-City-inspired theme", "Export a matching static preview and a short video preview for listings", "Set up a storefront and list the pack", "Share preview videos on TikTok, Pinterest, and in fan communities", "Run a launch discount for the first week", "Build a second design in a different color palette based on what sold", "Set up an email list for new drops"], findCustomers: ["Wallpaper Engine's own marketplace if it accepts outside creators", "Pinterest and TikTok for aesthetic and vibe-based discovery", "Streamer communities looking for a live overlay refresh", "GTA fan Discords and subreddits with an art-sharing channel"], risks: ["Animated products take meaningfully longer to produce than static ones - price for that time difference", "File sizes and formats vary by platform (Wallpaper Engine vs. OBS vs. phone) - be clear what a buyer is actually getting", "Use only original artwork - never Rockstar's actual key art or logos", "Motion design software has a real learning curve if you are starting from zero"] },
  { id: "newshub", name: "GTA 6 News & Community Hub Website", tagline: "A fast-moving news and discussion hub covering GTA 6 updates, patches, and community happenings, monetized with ads and sponsorships.", category: "content", skills: ["writing", "coding"], minBudget: 1, minHours: 2, goal: "scalable", audience: "not-needed", offer: "A regularly updated news hub - short posts on confirmed updates, community roundups, and discussion threads - built to keep people coming back daily.", pricing: ["Free to read - display ads once traffic builds", "Sponsored news placements from partner brands, $100-$300 per post once traffic is established", "Affiliate commissions from gaming gear and services", "A premium ad-free membership at $3-$5/month"], tools: ["A lightweight CMS or site builder", "Google Search Console and basic SEO tooling", "An ad network once you qualify", "A short daily research routine across official and community sources"], checklist: ["Register a domain and stand up a bare-bones site", "Publish 5 news posts covering confirmed updates only", "Set up Search Console and submit your sitemap", "Post each article's highlights in relevant subreddits and Discords following self-promo rules", "Set a daily or near-daily posting cadence you can sustain", "Join one ad network or affiliate program once you have baseline traffic", "Build an email list from day one so traffic is not fully dependent on search"], findCustomers: ["Search traffic for breaking GTA 6 news terms", "Reddit and Discord communities, sharing genuinely useful posts not just links", "Cross-promotion with GTA content creators who can link your site", "Social accounts posting news highlights with a link back"], risks: ["This is a daily-effort business - news sites die from inconsistency more than any other cause", "Only report confirmed information; publishing unverified leaks as fact damages credibility fast", "This overlaps with the Strategy Guide business - pick one lane (news vs. walkthroughs) or clearly split your content calendar between both", "Ad income requires real traffic volume before it is meaningful - budget a runway"] },
  { id: "directorysite", name: "Community Directory & Listings Site", tagline: "A searchable directory of RP servers, GTA creators, and gaming jobs, monetized through featured listings.", category: "software", skills: ["coding", "strategy"], minBudget: 1, minHours: 2, goal: "scalable", audience: "not-needed", offer: "A directory website where RP servers, creators, or freelancers can list themselves for free, with a paid tier for featured placement.", pricing: ["Free basic listings to build the directory", "Featured listing placement for $10-$25/month", "A one-time premium listing upgrade for $30", "Sponsored placement for brands targeting the GTA community, $100+/month"], tools: ["A directory-style website template or lightweight CMS", "A simple submission form for new listings", "Basic moderation tooling to review submissions", "Payment processing for featured listings"], checklist: ["Pick one specific directory focus - RP servers, creators, or gaming jobs, not all three at once", "Manually add 20 real listings to seed the directory before asking anyone to submit their own", "Build a simple public submission form", "Post the directory in relevant communities as a genuinely useful free resource", "Moderate submissions for quality before they go live", "Introduce the featured-listing tier once the directory has real traffic", "Reach out to a few relevant sponsors once you have real numbers"], findCustomers: ["The communities you are listing - RP servers, creators, or job seekers", "Reddit and Discord posts framed as a free resource, not a pitch", "Word of mouth once server owners see a listing bring them new members", "Cross-promotion with the servers or creators already listed"], risks: ["A directory is worthless until it has enough listings to be useful - budget real time for the cold-start problem", "Requires ongoing moderation to keep listings current and remove dead servers", "Featured-listing revenue only comes once you have real traffic - this is a slow build", "Directories can get outcompeted fast by a better-known one - a specific niche focus is your actual protection"] },
  { id: "marketplaceplatform", name: "Creator & Freelancer Marketplace Platform", tagline: "A marketplace connecting GTA creators with editors, designers, and other freelancers, taking a cut of each booking.", category: "software", skills: ["coding", "strategy"], minBudget: 2, minHours: 2, goal: "scalable", audience: "helps", offer: "A booking marketplace where freelancers list gigs (editing, thumbnails, branding) and creators can browse, message, and pay through the platform.", pricing: ["Free to list - platform takes a 10-15% cut of each booking", "A featured freelancer listing for $15/month", "A verified badge for an extra one-time $20", "Enterprise and agency accounts with multiple freelancers, custom pricing"], tools: ["A marketplace-style web app or no-code platform with payment support", "Stripe Connect or similar for splitting payments between the platform and freelancers", "A review and rating system for trust", "A basic dispute-resolution process for bookings gone wrong"], checklist: ["Recruit 10 freelancers you already know to list their services for free at launch", "Recruit 10 creators looking for that exact kind of help", "Manually facilitate the first few bookings yourself to work out the kinks", "Set your commission structure and be transparent about it upfront", "Build a simple rating system so trust builds over time", "Open public sign-ups once the first bookings have gone smoothly", "Set a moderation process for quality control on both sides"], findCustomers: ["Freelancer-side: editor and designer communities looking for consistent work", "Creator-side: the same communities where creators already ask for recommendations", "Word of mouth once a few successful bookings happen", "Cross-promotion with any of the individual service businesses above"], risks: ["Marketplaces are genuinely hard to start - you need both sides (supply and demand) at once or neither shows up", "Payment splitting and disputes add real legal and operational complexity - do not skip proper terms of service", "This requires the most upfront build time and budget of anything in this guide - it is a real software project, not a weekend build", "Trust and safety issues will happen - have a plan before they do, not after"] },
  { id: "aithumbnailtool", name: "AI-Powered Thumbnail Generator", tagline: "A web tool that generates thumbnail concepts from a creator's own footage and a short prompt, sold as a subscription.", category: "software", skills: ["coding", "design"], minBudget: 1, minHours: 2, goal: "scalable", audience: "not-needed", offer: "A simple web app where a creator uploads a screenshot and a title idea, and gets back several AI-generated thumbnail concepts to refine.", pricing: ["Free tier with limited generations per month", "A $9.99/month subscription for unlimited generations", "A one-time credit pack for casual users, $5 for 20 generations", "White-label licensing to agencies or larger creator networks, custom pricing"], tools: ["An AI image generation API", "A simple web frontend and lightweight backend", "Payment processing for subscriptions", "Usage tracking to enforce free-tier limits"], checklist: ["Build a narrow working prototype focused on one thumbnail style first", "Get 10 people from creator communities to test it and give feedback", "Fix the top pieces of feedback before opening it more broadly", "Publish it with a simple landing page and clear before/after examples", "Post it as a genuinely useful free tool in creator communities", "Introduce the paid tier once you have real regular users", "Keep refining the output quality - this is the entire value proposition"], findCustomers: ["Creator communities where people frequently ask for thumbnail help", "Comparison posts against manual thumbnail design services", "Search traffic for AI thumbnail generator terms", "Partnerships with thumbnail designers who want to offer a faster first-draft option"], risks: ["AI image generation API costs scale with usage - model your unit economics before pricing the subscription", "Output quality is the whole product - if results look generic or bad, this fails fast", "This is a genuine software build, not a weekend project - budget real development time", "The AI tools space here moves fast; a bigger platform could add this feature and undercut a standalone tool"] },
  { id: "aititlegen", name: "AI Title & Prompt Generator Tool", tagline: "A simple tool that generates video title options and content prompts for GTA creators based on trending patterns.", category: "software", skills: ["coding", "writing"], minBudget: 0, minHours: 1, goal: "scalable", audience: "not-needed", offer: "A web tool where a creator describes their video and gets back a list of title options and a few content angle prompts, based on what is currently performing well.", pricing: ["Free tier with a daily generation limit", "A $4.99/month subscription for unlimited use", "A downloadable prompt pack version for $9.99 one-time for people who prefer not to subscribe", "Bundle deal with the Creator Toolkit business"], tools: ["An AI text generation API", "A simple web frontend", "A running list of what titles and formats are currently performing well in the niche", "Payment processing for the subscription tier"], checklist: ["Study 30 top-performing GTA videos for recurring title patterns before building anything", "Build a narrow working prototype - just title generation first", "Get 10 creators to test it and give feedback", "Add the content-prompt feature based on what testers actually wanted", "Publish it with a simple landing page", "Share it directly with small creators who post inconsistently", "Introduce the paid tier once you have real regular users"], findCustomers: ["Creator communities where people ask for title help or feedback", "Small creators with good content but weak titles and thumbnails", "Bundling with the Creator Toolkit or thumbnail businesses", "Search traffic for AI YouTube title generator terms"], risks: ["Generic AI-generated titles are easy to spot - the value is in tuning it specifically to this niche, not just wrapping a generic AI prompt", "API costs scale with usage - keep the free tier limited enough to protect margins", "This is a crowded category generally - the GTA-specific angle is your actual differentiator", "Requires ongoing updates as what is trending in the niche shifts"] },
  { id: "localization", name: "Translation, Dubbing & Localization Service", tagline: "Translate, subtitle, or dub GTA 6 content so creators can reach audiences in other languages.", category: "service", skills: ["writing", "video"], minBudget: 0, minHours: 1, goal: "fast", audience: "not-needed", offer: "Accurate subtitles or a dubbed voiceover track for one video, translated into a language you are fluent in.", pricing: ["Subtitles for one video in one language for $25", "Subtitles in 3 languages for $60", "A dubbed voiceover track for one video for $80", "A monthly retainer for a creator localizing every upload, from $200/mo"], tools: ["Subtitle editing software such as Aegisub, many free options exist", "Basic recording equipment for dubbing work", "Translation reference tools for accuracy, not just literal translation", "A shared drive for file handoff"], checklist: ["Translate and subtitle one demo video to show quality and timing accuracy", "Post the demo in creator communities where your target language audience is active", "Message 15 creators with an audience overlap in your language offering a discounted first job", "Deliver fast on the discounted jobs to build trust", "Ask each trial client for a paid ongoing arrangement", "Specialize in 1-2 language pairs rather than promising every language", "Set a per-video turnaround time you can consistently hit"], findCustomers: ["Creators with viewers commenting in a language they do not speak", "Language-specific gaming communities looking for content in their language", "Fiverr/Upwork listing for gaming translation or subtitling", "Referrals from clients to other creators wanting the same language pair"], risks: ["Translation quality matters more than speed here - a bad translation damages the creator's reputation with that audience", "Dubbing requires real voice ability - be honest about what you can deliver versus subtitles only", "This is a real skill-gated business; do not offer language pairs you are not genuinely fluent in", "Niche language pairs have a smaller total client pool - price accordingly or offer multiple pairs"] },
  { id: "gaminggear", name: "Gaming Gear Shop & Custom PC Builds", tagline: "Sell gaming desk accessories and offer custom PC builds optimized for running GTA 6 well.", category: "product", skills: ["strategy", "sales"], minBudget: 2, minHours: 1, goal: "scalable", audience: "not-needed", offer: "A small curated shop of gaming desk accessories, plus a build consultation service for players wanting a PC that runs GTA 6 smoothly on their budget.", pricing: ["Small accessories (mousepads, cable organizers) from $15-$40", "A build consultation and parts list for $40", "A fully assembled custom build, parts cost plus a $150-$300 build fee", "Ongoing tech support retainer for RP server tech needs, $50/mo"], tools: ["A dropshipping or print-on-demand platform for accessories, or a small inventory to start", "PC-building knowledge and a parts-pricing tracker", "A simple booking system for consultations", "A storefront such as Shopify or Etsy"], checklist: ["Start with a small curated accessory line rather than trying to stock everything", "Order and test samples before listing anything for sale", "Offer 2 free build consultations to build a track record and testimonials", "Post build examples and before/after frame-rate comparisons in gaming communities", "Set clear pricing for consultations versus full builds", "Open paid bookings once you have a couple of real testimonials", "Track parts pricing regularly since PC component costs shift often"], findCustomers: ["r/buildapc and gaming hardware communities", "GTA-focused Discords where people ask what PC they need", "Local marketplace listings for build services", "Word of mouth from satisfied build clients"], risks: ["Custom PC building carries real liability if a build fails - be clear about warranty and support expectations upfront", "This requires more starting capital than most businesses in this guide, especially for holding any inventory", "Hardware pricing and availability shift constantly - do not quote a build price that goes stale by the time you source parts", "Physical products mean shipping, returns, and support overhead that digital businesses do not have"] },
  { id: "creatoragency", name: "Full-Service Creator Agency", tagline: "An all-in-one agency handling thumbnails, editing, and channel management for GTA creators who want to fully hand off production.", category: "service", skills: ["strategy", "marketing", "sales"], minBudget: 1, minHours: 3, goal: "scalable", audience: "helps", offer: "A bundled service - thumbnails, video editing, and social posting - so a creator can just film and hand everything else off.", pricing: ["A starter bundle (thumbnails plus one platform posting) for $250/mo", "Thumbnails plus editing for $450/mo", "The full bundle (thumbnails, editing, social, and a monthly strategy call) for $700/mo", "Custom enterprise packages for larger creators or small networks, from $1,200/mo"], tools: ["A small team or trusted subcontractors as you scale beyond what you can do alone", "A shared project management board", "The same tools from the individual thumbnail, editing, and social businesses, combined", "A monthly reporting template for clients"], checklist: ["Start by offering this bundle to 1-2 clients you already have from individual services, not cold", "Build a repeatable production process before taking on more than a couple of clients", "Document your workflow so you could hand pieces off to a subcontractor later", "Set a clear monthly retainer structure with defined deliverables", "Deliver consistently for the first clients to build case studies", "Use those case studies to pitch mid-size creators directly", "Set a client cap based on your actual production capacity, not wishful thinking"], findCustomers: ["Your own existing individual-service clients who want to consolidate vendors", "Mid-size creators (50k-500k) who are ready to stop DIY-ing production", "Referrals from other agency clients", "Case studies posted in creator business communities"], risks: ["This is the highest-commitment business in this guide - it only works if the individual pieces are already dialed in", "Client churn on a bundled retainer is expensive to replace - protect your best relationships carefully", "Scaling past what you can personally do requires hiring or subcontracting, which adds real management overhead", "Overpromising the bundle before your individual skills are strong is the most common failure mode - build the parts first"] },
  { id: "rpsoftware", name: "RP Community Management Software", tagline: "Scheduling, roster, and event management software built specifically for GTA RP server staff.", category: "software", skills: ["coding"], minBudget: 1, minHours: 2, goal: "scalable", audience: "not-needed", offer: "A web tool RP server staff use to manage character rosters, schedule in-character events, and track staff shifts, replacing a messy spreadsheet.", pricing: ["Free tier for small servers", "A $9.99/month tier for larger servers with more roster slots and events", "A one-time white-label setup for a server's own branding, $50", "Custom feature development for large servers, quoted per project"], tools: ["A web app framework and lightweight backend", "Free-tier hosting to start", "Discord API integration so staff do not have to leave Discord to use it", "Direct feedback from a few real RP servers during development"], checklist: ["Talk to 5 real RP server staff about what they currently use and where it breaks down", "Build one narrow feature first - roster tracking or event scheduling, not both at once", "Get 3 servers to test the free tier and give feedback", "Fix the top pieces of feedback before adding more features", "Publish it with a simple landing page aimed specifically at RP server staff", "Post it in RP server owner and staff communities as a genuinely useful free tool", "Introduce the paid tier once a handful of servers are actively using it"], findCustomers: ["RP server owner and staff Discord communities", "GTA RP subreddits where server management pain points get discussed", "Word of mouth between server staff who move between servers", "Direct outreach to well-known RP servers once you have a working product"], risks: ["This only works if you deeply understand how RP servers actually operate - talk to real server staff before building anything", "Free tier users may never convert if the paid features are not clearly worth it - test pricing early", "RP server staff turnover is high, meaning your point of contact at a server can change unexpectedly", "This is a genuine software build requiring ongoing maintenance, not a one-time project"] }
];

/* =========================================================
   COACHES
========================================================= */
const COACHES = [
  { key: "business", label: "Business Coach", icon: Rocket, blurb: "Strategy, priorities, and the hard calls.", system: "You are the Business Coach inside The Hustle File, a GTA 6-themed business headquarters app (Vice City Bureau of Commerce). Speak like a sharp, practical operator: direct, honest, no filler. Help the user prioritize, make decisions, and think through tradeoffs for their specific business. Give concrete next steps, not generic motivation. Keep replies tight - a few short paragraphs or a short list, unless the user asks for more depth.", samples: ["What should I focus on this week?", "Is this business idea actually worth pursuing?", "How do I know if I'm ready to raise my prices?"] },
  { key: "marketing", label: "Marketing Coach", icon: Megaphone, blurb: "Audience growth and the right channels.", system: "You are the Marketing Coach inside The Hustle File, a GTA 6-themed business headquarters app. Focus on audience growth, channel selection, positioning, and campaign ideas specific to the user's business. Be concrete: name actual platforms, formats, and angles rather than generic advice. Keep replies tight and actionable.", samples: ["Where should I post to find my first customers?", "How do I get people to notice a brand-new page?", "What should my first piece of content actually be?"] },
  { key: "sales", label: "Sales Coach", icon: Handshake, blurb: "Pricing, outreach, and closing.", system: "You are the Sales Coach inside The Hustle File, a GTA 6-themed business headquarters app. Focus on pricing strategy, outreach scripts, objection handling, and closing for the user's specific business. When useful, write out an actual message or script they could send today. Keep replies tight and practical.", samples: ["Write me a message I can send to a potential client", "What do I say if someone thinks my price is too high?", "How do I ask for a testimonial after finishing a job?"] },
  { key: "content", label: "Content Coach", icon: PenTool, blurb: "Ideas, hooks, and scripts.", system: "You are the Content Coach inside The Hustle File, a GTA 6-themed business headquarters app. Focus on content ideas, hooks, scripts, and posting cadence for the user's specific business. Offer specific, usable ideas rather than broad categories. Keep replies tight and practical.", samples: ["Give me 5 content ideas for this business", "What's a strong hook for my first video?", "How often should I actually be posting?"] },
  { key: "branding", label: "Branding Coach", icon: Palette, blurb: "Name, voice, and positioning.", system: "You are the Branding Coach inside The Hustle File, a GTA 6-themed business headquarters app. Focus on naming, visual identity direction, tone of voice, and differentiation for the user's specific business. Be specific and opinionated rather than listing generic options. Keep replies tight and practical.", samples: ["Help me come up with a name for this business", "How do I stand out from others doing the same thing?", "What should my brand's overall vibe be?"] }
];

/* =========================================================
   HELPERS
========================================================= */
function scoreOpp(opp, answers) {
  let score = 0;
  const overlap = opp.skills.filter((s) => answers.skills.includes(s)).length;
  score += overlap * 4;
  if (overlap === 0) score -= 3;
  if (answers.budget >= opp.minBudget) score += 3;
  else score -= (opp.minBudget - answers.budget) * 5;
  if (answers.hours >= opp.minHours) score += 3;
  else score -= (opp.minHours - answers.hours) * 4;
  if (answers.category !== "not-sure") score += opp.category === answers.category ? 5 : -2;
  if (opp.goal === "either") score += 1;
  else score += opp.goal === answers.goal ? 4 : -2;
  const audLevel = answers.audience === "yes" ? 2 : answers.audience === "small" ? 1 : 0;
  if (opp.audience === "required") score += audLevel > 0 ? 4 : -6;
  else if (opp.audience === "helps") score += audLevel === 2 ? 3 : audLevel === 1 ? 1.5 : 0;
  return score;
}
function rankedOpps(answers) {
  return OPPS.map((o) => ({ o, s: scoreOpp(o, answers) })).sort((a, b) => b.s - a.s);
}
function fitPct(opp, answers) {
  const budgetFit = answers.budget >= opp.minBudget ? 100 : Math.max(20, 100 - (opp.minBudget - answers.budget) * 35);
  const hoursFit = answers.hours >= opp.minHours ? 100 : Math.max(20, 100 - (opp.minHours - answers.hours) * 30);
  const overlap = opp.skills.filter((s) => answers.skills.includes(s)).length;
  const skillFit = Math.min(100, 40 + overlap * 30);
  return { budgetFit, hoursFit, skillFit };
}
function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + "d ago";
  return formatDate(iso);
}
function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function COACH_LABEL(key) {
  const c = COACHES.find((x) => x.key === key);
  return c ? c.label : key;
}
function exportProjectText(project) {
  const lines = [];
  lines.push("THE HUSTLE FILE - CASE FILE " + project.caseId);
  lines.push(project.name.toUpperCase());
  lines.push("Category: " + CATEGORY_LABEL[project.category]);
  lines.push(""); lines.push(project.tagline); lines.push("");
  lines.push("1. RECOMMENDED OFFER"); lines.push(project.offer); lines.push("");
  lines.push("2. SUGGESTED PRICING"); lines.push(project.pricingText); lines.push("");
  lines.push("3. REQUIRED TOOLS"); project.tools.forEach((t) => lines.push("- " + t)); lines.push("");
  lines.push("4. SEVEN-DAY STARTUP CHECKLIST");
  project.checklist.forEach((c, i) => lines.push("Day " + (i + 1) + ": " + c)); lines.push("");
  lines.push("5. THIRTY-DAY ACTION PLAN");
  WEEK_TEMPLATE.forEach((wk) => { lines.push(wk.label + ":"); wk.items.forEach((it) => lines.push("  - " + it)); }); lines.push("");
  lines.push("6. WHERE TO FIND CUSTOMERS"); project.findCustomers.forEach((f) => lines.push("- " + f)); lines.push("");
  lines.push("7. RISKS & MISTAKES TO AVOID"); project.risks.forEach((r) => lines.push("- " + r));
  if (project.notes && project.notes.length) {
    lines.push(""); lines.push("KEY DECISIONS LOG");
    project.notes.forEach((n) => lines.push("[" + COACH_LABEL(n.coach) + " - " + formatDate(n.createdAt) + "] " + n.text));
  }
  lines.push(""); lines.push("Goals: " + project.goals.filter((g) => g.done).length + " / " + project.goals.length + " complete");
  lines.push(""); lines.push("Generated by The Hustle File - Vice City Bureau of Commerce.");
  return lines.join("\n");
}
function projectContextBlock(project) {
  if (!project) return "";
  const doneCount = project.goals.filter((g) => g.done).length;
  const lines = [
    "Here is the user's active business case file. Use it for specific, grounded advice - do not give generic answers that ignore it.",
    "Business: " + project.name,
    "Category: " + CATEGORY_LABEL[project.category],
    "One-line pitch: " + project.tagline,
    "Core offer: " + project.offer,
    "Suggested pricing: " + project.pricingText,
    "Budget available: " + BUDGET_LABELS[project.answers.budget],
    "Time available: " + HOURS_LABELS[project.answers.hours],
    "Primary goal: " + (project.answers.goal === "fast" ? "fast income" : "scalable business"),
    "Progress so far: " + doneCount + " of " + project.goals.length + " goals completed."
  ];
  if (project.notes && project.notes.length) {
    lines.push("Pinned decisions from other coaching sessions on this business (treat these as settled unless the user revisits them):");
    project.notes.slice(0, 8).forEach((n) => lines.push("- (" + COACH_LABEL(n.coach) + ") " + n.text));
  }
  return lines.join("\n");
}

/* =========================================================
   DB <-> CLIENT MAPPING
========================================================= */
function mapProjectRow(row, goalRows, noteRows) {
  return {
    id: row.id,
    caseId: row.case_id,
    oppId: row.opp_id,
    createdAt: row.created_at,
    renamed: row.renamed,
    archived: row.archived,
    pinned: row.pinned,
    sortOrder: row.sort_order,
    name: row.name,
    tagline: row.tagline,
    category: row.category,
    offer: row.offer,
    pricingText: row.pricing_text,
    tools: row.tools || [],
    checklist: row.checklist || [],
    findCustomers: row.find_customers || [],
    risks: row.risks || [],
    answers: row.answers || {},
    goals: (goalRows || []).map((g) => ({ id: g.id, text: g.text, done: g.done, source: g.source, group: g.group_name, dueDate: g.due_date })),
    notes: (noteRows || []).map((n) => ({ id: n.id, coach: n.coach, text: n.text, createdAt: n.created_at }))
  };
}
function projectInsertPayload(opp, answers, userId) {
  return {
    user_id: userId,
    case_id: "VC-" + Math.floor(100000 + Math.random() * 899999),
    opp_id: opp.id,
    name: opp.name,
    tagline: opp.tagline,
    category: opp.category,
    offer: opp.offer,
    pricing_text: opp.pricing[answers.budget],
    tools: opp.tools,
    checklist: opp.checklist,
    find_customers: opp.findCustomers,
    risks: opp.risks,
    answers,
    renamed: false, archived: false, pinned: false, sort_order: 0
  };
}
function goalInsertsForOpp(projectId, opp, baseIso) {
  const rows = [];
  opp.checklist.forEach((c, i) => rows.push({ project_id: projectId, text: "Day " + (i + 1) + ": " + c, done: false, source: "auto", group_name: "7day", due_date: addDays(baseIso, i + 1) }));
  WEEK_TEMPLATE.forEach((wk, wi) => wk.items.forEach((it) => rows.push({ project_id: projectId, text: wk.label + ": " + it, done: false, source: "auto", group_name: "30day", due_date: addDays(baseIso, (wi + 1) * 7) })));
  return rows;
}

/* =========================================================
   MAIN APP
========================================================= */
export default function App() {
  const [booted, setBooted] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subStatus, setSubStatus] = useState(null); // null = checking, 'active', 'inactive'
  const [authError, setAuthError] = useState("");

  const [projects, setProjects] = useState([]);
  const [screen, setScreen] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [qStep, setQStep] = useState(0);
  const [answers, setAnswers] = useState({ skills: [], budget: null, hours: null, category: null, goal: null, audience: null });
  const [resultOpp, setResultOpp] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);

  const [coachChats, setCoachChats] = useState({});
  const [activeCoach, setActiveCoach] = useState("business");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatProjectId, setChatProjectId] = useState(null);
  const chatEndRef = useRef(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [customGoalText, setCustomGoalText] = useState("");
  const [customGoalDate, setCustomGoalDate] = useState("");
  const [goalsProjectId, setGoalsProjectId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [renamingGoalId, setRenamingGoalId] = useState(null);
  const [goalRenameText, setGoalRenameText] = useState("");
  const [goalRenameDate, setGoalRenameDate] = useState("");
  const [activity, setActivity] = useState([]);

  /* ---------- boot: fonts + auth session ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooted(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null); setSubStatus(null); setProjects([]); setActivity([]);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  /* ---------- once logged in: load profile, subscription, projects ---------- */
  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      setProfile(prof || { name: "Operator", email: session.user.email });
      await checkSubscription();
      await loadProjects();
      await loadActivity();
    })();
  }, [session]);

  async function checkSubscription() {
    setSubStatus(null);
    const { data } = await supabase.from("subscriptions").select("status").eq("email", session.user.email).maybeSingle();
    setSubStatus(data && data.status === "active" ? "active" : "inactive");
  }

  async function loadProjects() {
    const { data: rows } = await supabase.from("projects").select("*").eq("user_id", session.user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    const list = rows || [];
    const ids = list.map((r) => r.id);
    let goalRows = [], noteRows = [];
    if (ids.length) {
      const { data: g } = await supabase.from("goals").select("*").in("project_id", ids);
      goalRows = g || [];
      const { data: n } = await supabase.from("notes").select("*").in("project_id", ids);
      noteRows = n || [];
    }
    const goalsBy = {}; goalRows.forEach((g) => { (goalsBy[g.project_id] ||= []).push(g); });
    const notesBy = {}; noteRows.forEach((n) => { (notesBy[n.project_id] ||= []).push(n); });
    const mapped = list.map((row) => mapProjectRow(row, goalsBy[row.id], notesBy[row.id]));
    setProjects(mapped);
    if (mapped.length && !selectedProjectId) {
      setSelectedProjectId(mapped[0].id); setGoalsProjectId(mapped[0].id); setChatProjectId(mapped[0].id);
    }
  }

  async function loadActivity() {
    const { data } = await supabase.from("activity").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(30);
    setActivity((data || []).map((a) => ({ id: a.id, text: a.text, ts: a.created_at })));
  }

  async function logActivity(text) {
    const { data } = await supabase.from("activity").insert({ user_id: session.user.id, text }).select().single();
    if (data) setActivity((prev) => [{ id: data.id, text: data.text, ts: data.created_at }, ...prev].slice(0, 30));
  }

  /* ---------- auth actions ---------- */
  async function signUp(email, password, name) {
    setAuthError("");
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) { setAuthError(error.message); return false; }
    return true;
  }
  async function signIn(email, password) {
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  }
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "https://hustlefile.io/";
  }

  /* ---------- quiz flow ---------- */
  function startQuiz() {
    setQStep(0);
    setAnswers({ skills: [], budget: null, hours: null, category: null, goal: null, audience: null });
    setResultOpp(null);
    setEditingProjectId(null);
    setScreen("quiz");
  }
  function editAnswers(projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setQStep(0);
    setAnswers({ ...project.answers });
    setResultOpp(null);
    setEditingProjectId(projectId);
    setScreen("quiz");
  }
  function isAnswered(q) {
    const v = answers[q.key];
    return q.multi ? Array.isArray(v) && v.length > 0 : v !== null && v !== undefined;
  }
  function pickOption(q, val) {
    setAnswers((prev) => {
      if (q.multi) {
        const cur = prev.skills.slice();
        const idx = cur.indexOf(val);
        if (idx > -1) cur.splice(idx, 1); else cur.push(val);
        return { ...prev, skills: cur };
      }
      return { ...prev, [q.key]: val };
    });
  }
  function nextStep() {
    if (qStep < QUESTIONS.length - 1) { setQStep(qStep + 1); }
    else { const ranked = rankedOpps(answers); setResultOpp(ranked[0].o); }
  }

  async function saveProjectFromResult() {
    if (editingProjectId) {
      const existing = projects.find((p) => p.id === editingProjectId);
      if (!existing) { setEditingProjectId(null); return; }
      const sameOpp = existing.oppId === resultOpp.id;
      const updates = { answers, pricing_text: resultOpp.pricing[answers.budget] };
      if (!sameOpp) {
        Object.assign(updates, {
          opp_id: resultOpp.id, category: resultOpp.category, tagline: resultOpp.tagline, offer: resultOpp.offer,
          tools: resultOpp.tools, checklist: resultOpp.checklist, find_customers: resultOpp.findCustomers, risks: resultOpp.risks
        });
        if (!existing.renamed) updates.name = resultOpp.name;
      }
      await supabase.from("projects").update(updates).eq("id", existing.id);
      if (!sameOpp) {
        await supabase.from("goals").delete().eq("project_id", existing.id).eq("source", "auto");
        const newGoals = goalInsertsForOpp(existing.id, resultOpp, new Date().toISOString());
        await supabase.from("goals").insert(newGoals);
      }
      await loadProjects();
      await logActivity("Updated case file: " + (updates.name || existing.name));
      setSelectedProjectId(existing.id); setGoalsProjectId(existing.id); setChatProjectId(existing.id);
      setEditingProjectId(null);
      setScreen("project-detail");
      return;
    }
    const payload = projectInsertPayload(resultOpp, answers, session.user.id);
    const { data: newProj, error } = await supabase.from("projects").insert(payload).select().single();
    if (error || !newProj) { console.error(error); return; }
    const goalRows = goalInsertsForOpp(newProj.id, resultOpp, newProj.created_at);
    await supabase.from("goals").insert(goalRows);
    await loadProjects();
    await logActivity("Started a new case file: " + newProj.name);
    setSelectedProjectId(newProj.id); setGoalsProjectId(newProj.id); setChatProjectId(newProj.id);
    setScreen("project-detail");
  }

  /* ---------- goals ---------- */
  async function toggleGoal(projectId, goalId) {
    const project = projects.find((p) => p.id === projectId);
    const goal = project && project.goals.find((g) => g.id === goalId);
    if (!goal) return;
    const willBeDone = !goal.done;
    await supabase.from("goals").update({ done: willBeDone }).eq("id", goalId);
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, goals: p.goals.map((g) => g.id === goalId ? { ...g, done: willBeDone } : g) }));
    if (willBeDone) logActivity("Completed a goal in " + project.name + ": " + goal.text);
  }
  async function renameGoal(projectId, goalId, newText, newDate) {
    const text = newText.trim();
    if (!text) { setRenamingGoalId(null); return; }
    const dueDate = newDate ? new Date(newDate).toISOString() : null;
    await supabase.from("goals").update({ text, due_date: dueDate }).eq("id", goalId).eq("source", "custom");
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, goals: p.goals.map((g) => g.id === goalId ? { ...g, text, dueDate } : g) }));
    setRenamingGoalId(null); setGoalRenameText(""); setGoalRenameDate("");
  }
  async function deleteGoal(projectId, goalId) {
    await supabase.from("goals").delete().eq("id", goalId).eq("source", "custom");
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, goals: p.goals.filter((g) => g.id !== goalId) }));
  }
  async function addCustomGoal(projectId) {
    const text = customGoalText.trim();
    if (!text) return;
    const dueDate = customGoalDate ? new Date(customGoalDate).toISOString() : null;
    const { data } = await supabase.from("goals").insert({ project_id: projectId, text, done: false, source: "custom", group_name: "custom", due_date: dueDate }).select().single();
    if (data) {
      setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, goals: [...p.goals, { id: data.id, text, done: false, source: "custom", group: "custom", dueDate }] }));
      const project = projects.find((p) => p.id === projectId);
      if (project) logActivity("Added a custom goal to " + project.name);
    }
    setCustomGoalText(""); setCustomGoalDate("");
  }

  /* ---------- project management ---------- */
  async function renameProject(projectId, newName) {
    const name = newName.trim();
    if (!name) { setRenamingId(null); return; }
    await supabase.from("projects").update({ name, renamed: true }).eq("id", projectId);
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, name, renamed: true }));
    logActivity("Renamed a project to " + name);
    setRenamingId(null); setRenameText("");
  }
  async function archiveProject(projectId) {
    const project = projects.find((p) => p.id === projectId);
    await supabase.from("projects").update({ archived: true }).eq("id", projectId);
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, archived: true }));
    if (project) logActivity("Archived " + project.name);
    setConfirmDeleteId(null); setScreen("projects");
  }
  async function restoreProject(projectId) {
    const project = projects.find((p) => p.id === projectId);
    await supabase.from("projects").update({ archived: false }).eq("id", projectId);
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, archived: false }));
    if (project) logActivity("Restored " + project.name);
  }
  async function permanentlyDeleteProject(projectId) {
    const project = projects.find((p) => p.id === projectId);
    await supabase.from("projects").delete().eq("id", projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (project) logActivity("Deleted " + project.name + " permanently");
    setConfirmDeleteId(null);
    setScreen("projects");
  }
  async function togglePin(projectId) {
    const project = projects.find((p) => p.id === projectId);
    const nextPinned = !project.pinned;
    await supabase.from("projects").update({ pinned: nextPinned }).eq("id", projectId);
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, pinned: nextPinned }));
    if (project) logActivity((nextPinned ? "Pinned " : "Unpinned ") + project.name);
  }
  async function moveProject(projectId, dir) {
    const visible = projects.filter((p) => !p.archived);
    const idx = visible.findIndex((p) => p.id === projectId);
    const swapWith = idx + dir;
    if (idx === -1 || swapWith < 0 || swapWith >= visible.length) return;
    const a = visible[idx], b = visible[swapWith];
    const aOrder = a.sortOrder, bOrder = b.sortOrder;
    await supabase.from("projects").update({ sort_order: bOrder }).eq("id", a.id);
    await supabase.from("projects").update({ sort_order: aOrder }).eq("id", b.id);
    await loadProjects();
  }
  async function addNote(projectId, coachKey, text) {
    const { data } = await supabase.from("notes").insert({ project_id: projectId, coach: coachKey, text }).select().single();
    if (data) {
      setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, notes: [{ id: data.id, coach: coachKey, text, createdAt: data.created_at }, ...(p.notes || [])] }));
      const project = projects.find((p) => p.id === projectId);
      if (project) logActivity("Pinned a decision from the " + COACH_LABEL(coachKey) + " for " + project.name);
    }
  }
  async function removeNote(projectId, noteId) {
    await supabase.from("notes").delete().eq("id", noteId);
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, notes: (p.notes || []).filter((n) => n.id !== noteId) }));
  }

  /* ---------- coach chats ---------- */
  async function ensureChatsLoaded(projectId) {
    if (!projectId || coachChats[projectId]) return;
    const { data } = await supabase.from("coach_messages").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
    const grouped = { business: [], marketing: [], sales: [], content: [], branding: [] };
    (data || []).forEach((m) => { if (grouped[m.coach]) grouped[m.coach].push({ id: m.id, role: m.role, content: m.content }); });
    setCoachChats((prev) => ({ ...prev, [projectId]: grouped }));
  }
  useEffect(() => { if (screen === "coaches" && chatProjectId) ensureChatsLoaded(chatProjectId); }, [screen, chatProjectId]);
  useEffect(() => { chatEndRef.current && chatEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [coachChats, activeCoach, chatProjectId, chatLoading]);

  async function sendChatMessage(overrideText) {
    const text = (overrideText || chatInput).trim();
    if (!text || chatLoading || !chatProjectId) return;
    const project = projects.find((p) => p.id === chatProjectId);
    const coach = COACHES.find((c) => c.key === activeCoach);
    const existing = (coachChats[chatProjectId] && coachChats[chatProjectId][activeCoach]) || [];

    const { data: userRow } = await supabase.from("coach_messages").insert({ project_id: chatProjectId, coach: activeCoach, role: "user", content: text }).select().single();
    const withUser = [...existing, { id: userRow ? userRow.id : "temp", role: "user", content: text }];
    setCoachChats((prev) => ({ ...prev, [chatProjectId]: { ...(prev[chatProjectId] || {}), [activeCoach]: withUser } }));
    setChatInput("");
    setChatLoading(true);

    try {
      const system = coach.system + "\n\n" + projectContextBlock(project);
      const recentHistory = withUser.slice(-MAX_HISTORY_MESSAGES);
      const res = await fetch(COACH_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({ system, messages: recentHistory.map((m) => ({ role: m.role, content: m.content })) })
      });
      const data = await res.json();
      const replyText = data.text || data.error || "I could not generate a reply just now - try again.";
      const { data: aRow } = await supabase.from("coach_messages").insert({ project_id: chatProjectId, coach: activeCoach, role: "assistant", content: replyText }).select().single();
      setCoachChats((prev) => ({ ...prev, [chatProjectId]: { ...(prev[chatProjectId] || {}), [activeCoach]: [...withUser, { id: aRow ? aRow.id : "temp2", role: "assistant", content: replyText }] } }));
    } catch (e) {
      setCoachChats((prev) => ({ ...prev, [chatProjectId]: { ...(prev[chatProjectId] || {}), [activeCoach]: [...withUser, { id: "err", role: "assistant", content: "Something went wrong reaching the coach. Please try again in a moment." }] } }));
    }
    setChatLoading(false);
  }

  /* ---------- render ---------- */
  if (!booted) return <Shell><div style={{ padding: 60, textAlign: "center", fontFamily: "IBM Plex Mono, monospace", color: "#00e6d8" }}>Opening the bureau...</div></Shell>;

  if (!session) return <Shell><AuthScreen onSignUp={signUp} onSignIn={signIn} error={authError} /></Shell>;

  if (!profile || subStatus === null) return <Shell><div style={{ padding: 60, textAlign: "center", fontFamily: "IBM Plex Mono, monospace", color: "#00e6d8" }}>Checking your access...</div></Shell>;

  if (subStatus !== "active") return <Shell><SubscriptionGate onRecheck={checkSubscription} onSignOut={signOut} /></Shell>;

  return (
    <Shell>
      <div style={{ display: "flex", minHeight: "640px" }}>
        <Sidebar screen={screen} setScreen={setScreen} onNewCase={startQuiz} profile={profile} projectsCount={projects.filter((p) => !p.archived).length} onSignOut={signOut} />
        <div style={{ flex: 1, padding: "26px 28px", minWidth: 0 }}>
          {screen === "dashboard" && <Dashboard profile={profile} projects={projects} activity={activity} goto={(s, pid) => { setScreen(s); if (pid) { setSelectedProjectId(pid); setGoalsProjectId(pid); setChatProjectId(pid); } }} startQuiz={startQuiz} />}
          {screen === "quiz" && (
            <QuizScreen qStep={qStep} answers={answers} resultOpp={resultOpp} editingProjectId={editingProjectId} pickOption={pickOption} nextStep={nextStep} back={() => setQStep(Math.max(0, qStep - 1))} saveResult={saveProjectFromResult} restart={startQuiz} isAnswered={isAnswered} />
          )}
          {screen === "projects" && (
            <ProjectsScreen projects={projects} openProject={(id) => { setSelectedProjectId(id); setScreen("project-detail"); }} confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId} archiveProject={archiveProject} restoreProject={restoreProject} permanentlyDeleteProject={permanentlyDeleteProject} togglePin={togglePin} moveProject={moveProject} editAnswers={editAnswers} startQuiz={startQuiz} renamingId={renamingId} setRenamingId={setRenamingId} renameText={renameText} setRenameText={setRenameText} renameProject={renameProject} />
          )}
          {screen === "project-detail" && (
            <ProjectDetail project={projects.find((p) => p.id === selectedProjectId)} onBack={() => setScreen("projects")} onGoals={(id) => { setGoalsProjectId(id); setScreen("goals"); }} onCoaches={(id) => { setChatProjectId(id); setScreen("coaches"); }} confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId} archiveProject={archiveProject} restoreProject={restoreProject} permanentlyDeleteProject={permanentlyDeleteProject} togglePin={togglePin} editAnswers={editAnswers} removeNote={removeNote} renamingId={renamingId} setRenamingId={setRenamingId} renameText={renameText} setRenameText={setRenameText} renameProject={renameProject} />
          )}
          {screen === "goals" && (
            <GoalsScreen projects={projects} goalsProjectId={goalsProjectId} setGoalsProjectId={setGoalsProjectId} toggleGoal={toggleGoal} customGoalText={customGoalText} setCustomGoalText={setCustomGoalText} customGoalDate={customGoalDate} setCustomGoalDate={setCustomGoalDate} addCustomGoal={addCustomGoal} startQuiz={startQuiz} renamingGoalId={renamingGoalId} setRenamingGoalId={setRenamingGoalId} goalRenameText={goalRenameText} setGoalRenameText={setGoalRenameText} goalRenameDate={goalRenameDate} setGoalRenameDate={setGoalRenameDate} renameGoal={renameGoal} deleteGoal={deleteGoal} />
          )}
          {screen === "coaches" && (
            <CoachesScreen projects={projects} chatProjectId={chatProjectId} setChatProjectId={setChatProjectId} activeCoach={activeCoach} setActiveCoach={setActiveCoach} coachChats={coachChats} chatInput={chatInput} setChatInput={setChatInput} sendChatMessage={sendChatMessage} chatLoading={chatLoading} chatEndRef={chatEndRef} startQuiz={startQuiz} addNote={addNote} />
          )}
        </div>
      </div>
    </Shell>
  );
}

/* =========================================================
   SHELL + STYLE
========================================================= */
function Shell({ children }) {
  return (
    <div style={{
      fontFamily: "'Work Sans', sans-serif", color: "#fff2e2", minHeight: "100vh",
      background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,47,126,0.22), transparent 60%), radial-gradient(ellipse 60% 40% at 85% 10%, rgba(0,230,216,0.15), transparent 60%), linear-gradient(180deg, #1a0b2e 0%, #2a1145 55%, #160a24 100%)"
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .hf-btn { font-family:'IBM Plex Mono', monospace; letter-spacing:0.08em; text-transform:uppercase; font-size:12.5px; padding:11px 20px; border-radius:2px; cursor:pointer; border:1px solid rgba(255,242,226,0.16); background:transparent; color:#fff2e2; transition:all .15s; }
        .hf-btn:hover { border-color:#fff2e2; }
        .hf-btn.primary { background:#00e6d8; border-color:#00e6d8; color:#160a24; font-weight:600; }
        .hf-btn.primary:hover { background:#3bf0e4; }
        .hf-btn.pink { background:#ff2f7e; border-color:#ff2f7e; color:#160a24; font-weight:600; }
        .hf-btn.pink:hover { background:#ff5b98; }
        .hf-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .hf-opt { border:1px solid rgba(255,242,226,0.16); background:rgba(255,255,255,0.02); color:#fff2e2; padding:13px 14px; border-radius:3px; cursor:pointer; font-size:14px; text-align:left; line-height:1.35; transition:all .15s; font-family:'Work Sans', sans-serif; }
        .hf-opt:hover { border-color:rgba(255,242,226,0.4); }
        .hf-opt.selected { border-color:#ff2f7e; background:rgba(255,47,126,0.12); box-shadow:inset 0 0 0 1px #ff2f7e; }
        .hf-card { background:linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015)); border:1px solid rgba(255,242,226,0.16); border-radius:6px; }
        .hf-input { background:rgba(0,0,0,0.2); border:1px solid rgba(255,242,226,0.2); color:#fff2e2; padding:11px 13px; border-radius:3px; font-family:'Work Sans', sans-serif; font-size:14px; width:100%; }
        .hf-input:focus { outline:none; border-color:#00e6d8; }
        .hf-scroll::-webkit-scrollbar { width:8px; }
        .hf-scroll::-webkit-scrollbar-thumb { background:rgba(255,242,226,0.2); border-radius:4px; }
        h1,h2,h3 { margin:0; }
      `}</style>
      {children}
    </div>
  );
}

/* =========================================================
   AUTH SCREEN
========================================================= */
function AuthScreen({ onSignUp, onSignIn, error }) {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    if (mode === "signup") { const ok = await onSignUp(email, password, name || "Operator"); if (ok) setSent(true); }
    else { await onSignIn(email, password); }
  }

  if (sent) {
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "90px 20px", textAlign: "center" }}>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#00e6d8", letterSpacing: "0.2em", marginBottom: 16 }}>&#9670; CHECK YOUR EMAIL</div>
        <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 30, textTransform: "uppercase", marginBottom: 14 }}>Almost In</h1>
        <p style={{ color: "rgba(255,242,226,0.78)", fontSize: 14.5, lineHeight: 1.6 }}>We sent a confirmation link to {email}. Click it, then come back here and log in.</p>
        <button className="hf-btn" style={{ marginTop: 20 }} onClick={() => { setSent(false); setMode("signin"); }}>Back to Log In</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.25em", fontSize: 12, color: "#00e6d8", textTransform: "uppercase", marginBottom: 16 }}>&#9670; Vice City Bureau of Commerce</div>
      <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 36, textTransform: "uppercase", lineHeight: 1, marginBottom: 14, background: "linear-gradient(180deg, #fff2e2 0%, #ffb020 55%, #ff2f7e 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {mode === "signup" ? "Open Your HQ" : "Welcome Back"}
      </h1>
      <p style={{ color: "rgba(255,242,226,0.75)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
        {mode === "signup" ? "Create your account to save case files, track goals, and talk to your coaches." : "Log in to pick up where you left off."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
        {mode === "signup" && <input className="hf-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />}
        <input className="hf-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="hf-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      </div>
      {error && <div style={{ color: "#ff2f7e", fontSize: 12.5, marginTop: 12, fontFamily: "IBM Plex Mono, monospace" }}>{error}</div>}
      <button className="hf-btn pink" style={{ marginTop: 20, width: "100%" }} onClick={submit}>
        <LogIn size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />{mode === "signup" ? "Create Account" : "Log In"}
      </button>
      <button className="hf-btn" style={{ marginTop: 10, width: "100%" }} onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
        {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
      </button>
    </div>
  );
}

/* =========================================================
   SUBSCRIPTION GATE
========================================================= */
function SubscriptionGate({ onRecheck, onSignOut }) {
  const [checking, setChecking] = useState(false);
  async function recheck() { setChecking(true); await onRecheck(); setChecking(false); }
  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "90px 20px", textAlign: "center" }}>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#ff2f7e", letterSpacing: "0.2em", marginBottom: 16 }}>&#9670; ACCESS LOCKED</div>
      <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: 32, textTransform: "uppercase", marginBottom: 14 }}>Unlock Your HQ</h1>
      <p style={{ color: "rgba(255,242,226,0.78)", fontSize: 14.5, lineHeight: 1.6, marginBottom: 26 }}>
        Your account is set up, but there's no active Operator Access on file yet. Subscribe to unlock your dashboard, saved case files, and the five AI coaches.
      </p>
      <a className="hf-btn pink" style={{ display: "inline-block", marginBottom: 12 }} href={PAYWALL_URL}>Go To Checkout</a>
      <div><button className="hf-btn" style={{ marginTop: 6 }} onClick={recheck} disabled={checking}>{checking ? "Checking..." : "I just subscribed - refresh"}</button></div>
      <div><button className="hf-btn" style={{ marginTop: 24, fontSize: 11 }} onClick={onSignOut}><LogOut size={11} style={{ verticalAlign: "-2px", marginRight: 5 }} />Sign out</button></div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */
function Sidebar({ screen, setScreen, onNewCase, profile, projectsCount, onSignOut }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "projects", label: "Projects", icon: Folder },
    { key: "goals", label: "Goals", icon: Target },
    { key: "coaches", label: "AI Coaches", icon: MessageCircle }
  ];
  return (
    <div style={{ width: 210, borderRight: "1px solid rgba(255,242,226,0.14)", padding: "22px 14px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ fontFamily: "Anton, sans-serif", fontSize: 18, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 4, color: "#fff2e2" }}>Hustle File</div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, color: "#00e6d8", letterSpacing: "0.1em", marginBottom: 22 }}>{(profile.name || "OPERATOR").toUpperCase()}'S HQ</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
        {items.map((it) => {
          const Icon = it.icon;
          const active = screen === it.key || (it.key === "projects" && screen === "project-detail");
          return (
            <button key={it.key} onClick={() => setScreen(it.key)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 3, border: "none", cursor: "pointer",
              background: active ? "rgba(255,47,126,0.14)" : "transparent", color: active ? "#ffb020" : "rgba(255,242,226,0.8)",
              fontFamily: "IBM Plex Mono, monospace", fontSize: 12, letterSpacing: "0.04em", textAlign: "left"
            }}>
              <Icon size={15} /> {it.label}{it.key === "projects" && projectsCount > 0 ? " (" + projectsCount + ")" : ""}
            </button>
          );
        })}
      </div>
      <button className="hf-btn pink" style={{ width: "100%", fontSize: 11 }} onClick={onNewCase}><Plus size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />New Case File</button>
      <div style={{ flex: 1 }} />
      <button className="hf-btn" style={{ width: "100%", fontSize: 10.5 }} onClick={onSignOut}><LogOut size={11} style={{ verticalAlign: "-2px", marginRight: 5 }} />Sign Out</button>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */
function Dashboard({ profile, projects, activity, goto, startQuiz }) {
  const active = projects.filter((p) => !p.archived);
  const totalGoals = active.reduce((s, p) => s + p.goals.length, 0);
  const doneGoals = active.reduce((s, p) => s + p.goals.filter((g) => g.done).length, 0);
  const pct = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0;
  const recent = [...active].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).slice(0, 4);
  return (
    <div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.15em", marginBottom: 6 }}>DASHBOARD</div>
      <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 30, textTransform: "uppercase", marginBottom: 22 }}>Welcome back, {profile.name}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Active Projects" value={active.length} />
        <StatCard label="Goals Completed" value={doneGoals + " / " + totalGoals} />
        <StatCard label="Overall Progress" value={pct + "%"} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 20, alignItems: "start" }}>
        <div>
          {active.length === 0 ? (
            <div className="hf-card" style={{ padding: 34, textAlign: "center" }}>
              <p style={{ color: "rgba(255,242,226,0.8)", marginBottom: 16 }}>No case files yet. Run the questionnaire to get your first personalized business plan.</p>
              <button className="hf-btn pink" onClick={startQuiz}>Open a Case File</button>
            </div>
          ) : (
            <>
              <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: 17, textTransform: "uppercase", marginBottom: 12 }}>Recent Projects</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {recent.map((p) => {
                  const d = p.goals.filter((g) => g.done).length, t = p.goals.length;
                  return (
                    <div key={p.id} className="hf-card" style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: "#00e6d8", letterSpacing: "0.1em", marginBottom: 3 }}>{CATEGORY_LABEL[p.category].toUpperCase()}{p.pinned ? " - PINNED" : ""}</div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,242,226,0.55)", marginTop: 2 }}>{d}/{t} goals complete</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="hf-btn" style={{ fontSize: 11 }} onClick={() => goto("project-detail", p.id)}>View <ChevronRight size={12} style={{ verticalAlign: "-2px" }} /></button>
                        <button className="hf-btn" style={{ fontSize: 11 }} onClick={() => goto("coaches", p.id)}>Coaches</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div>
          <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: 17, textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Activity size={15} color="#00e6d8" />Recent Activity</h3>
          <div className="hf-card" style={{ padding: activity.length ? "6px 16px" : 20 }}>
            {activity.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,242,226,0.5)", padding: "10px 0" }}>Nothing logged yet - your actions will show up here.</div>}
            {activity.slice(0, 8).map((a, i) => (
              <div key={a.id} style={{ padding: "10px 0", borderBottom: i < Math.min(activity.length, 8) - 1 ? "1px solid rgba(255,242,226,0.1)" : "none" }}>
                <div style={{ fontSize: 12.5, color: "rgba(255,242,226,0.85)", lineHeight: 1.4 }}>{a.text}</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, color: "rgba(255,242,226,0.4)", marginTop: 3 }}>{timeAgo(a.ts)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function StatCard({ label, value }) {
  return (
    <div className="hf-card" style={{ padding: "14px 16px" }}>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, color: "rgba(255,242,226,0.55)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: "Anton, sans-serif", fontSize: 26 }}>{value}</div>
    </div>
  );
}

/* =========================================================
   QUIZ SCREEN
========================================================= */
function QuizScreen({ qStep, answers, resultOpp, editingProjectId, pickOption, nextStep, back, saveResult, restart, isAnswered }) {
  if (resultOpp) {
    const fit = fitPct(resultOpp, answers);
    const price = resultOpp.pricing[answers.budget];
    return (
      <div className="hf-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(255,242,226,0.16)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.12em" }}>{editingProjectId ? "CASE FILE UPDATE" : "CASE FILE PREVIEW"}</div>
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 12, letterSpacing: "0.12em", color: "#ffb020", border: "2px solid #ffb020", padding: "4px 10px", borderRadius: 2, textTransform: "uppercase" }}>Approved</div>
        </div>
        <div style={{ padding: "24px" }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Recommended Business - {CATEGORY_LABEL[resultOpp.category]}</div>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 28, textTransform: "uppercase", marginBottom: 10 }}>{resultOpp.name}</h2>
          <p style={{ color: "rgba(255,242,226,0.8)", fontSize: 14.5, lineHeight: 1.6, marginBottom: 18 }}>{resultOpp.tagline}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
            <FitBar label="Skill Match" pct={fit.skillFit} />
            <FitBar label="Budget Fit" pct={fit.budgetFit} />
            <FitBar label="Time Fit" pct={fit.hoursFit} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 15, textTransform: "uppercase", marginBottom: 6 }}>Offer</div>
            <p style={{ color: "rgba(255,242,226,0.82)", fontSize: 14 }}>{resultOpp.offer}</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 15, textTransform: "uppercase", marginBottom: 6 }}>Suggested Pricing</div>
            <div style={{ display: "inline-block", fontFamily: "IBM Plex Mono, monospace", fontSize: 14, color: "#160a24", background: "#ffb020", padding: "7px 12px", borderRadius: 2, fontWeight: 600 }}>{price}</div>
          </div>
          <p style={{ fontSize: 12.5, color: "rgba(255,242,226,0.55)", marginBottom: 20 }}>
            {editingProjectId ? "This will update the saved case file with new pricing and answers. If the recommended business changed, the checklist and 30-day goals refresh too - your custom goals, name (if you renamed it), and coach chats stay put." : "Save this to Headquarters to unlock the full 7-day checklist, 30-day plan, goal tracking, and your five AI coaches for this business."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="hf-btn primary" onClick={saveResult}>{editingProjectId ? "Update Case File" : "Save to Headquarters"}</button>
            <button className="hf-btn" onClick={restart}>Start Over</button>
          </div>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[qStep];
  const selected = answers[q.key];
  return (
    <div>
      {editingProjectId && <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#ff2f7e", letterSpacing: "0.1em", marginBottom: 10 }}><RefreshCw size={11} style={{ verticalAlign: "-1px", marginRight: 5 }} />EDITING ANSWERS FOR AN EXISTING PROJECT</div>}
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {QUESTIONS.map((_, i) => (
          <div key={i} style={{ width: 34, height: 4, borderRadius: 2, background: i <= qStep ? "linear-gradient(90deg,#00e6d8,#ff2f7e)" : "rgba(255,242,226,0.15)" }} />
        ))}
      </div>
      <div className="hf-card" style={{ padding: "28px 26px" }}>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.12em", marginBottom: 6 }}>{q.tag}</div>
        <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 24, textTransform: "uppercase", marginBottom: 18, lineHeight: 1.15 }}>{q.title}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
          {q.options.map((o) => {
            const isSel = q.multi ? (selected || []).includes(o.v) : selected === o.v;
            return (
              <button key={String(o.v)} className={"hf-opt" + (isSel ? " selected" : "")} onClick={() => pickOption(q, o.v)}>
                <span style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: isSel ? "#ffb020" : "#00e6d8", marginBottom: 4 }}>{o.k}</span>{o.l}
              </button>
            );
          })}
        </div>
        {q.hint && <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "rgba(255,242,226,0.45)", textAlign: "center", marginTop: 14 }}>{q.hint}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button className="hf-btn" disabled={qStep === 0} onClick={back}><ChevronLeft size={12} style={{ verticalAlign: "-2px" }} /> Back</button>
          <button className="hf-btn primary" disabled={!isAnswered(q)} onClick={nextStep}>{qStep === QUESTIONS.length - 1 ? "Open Case File" : "Next"} <ChevronRight size={12} style={{ verticalAlign: "-2px" }} /></button>
        </div>
      </div>
    </div>
  );
}
function FitBar({ label, pct }) {
  return (
    <div style={{ border: "1px solid rgba(255,242,226,0.16)", borderRadius: 3, padding: "10px 12px", background: "rgba(0,0,0,0.15)" }}>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: "rgba(255,242,226,0.55)", marginBottom: 7, textTransform: "uppercase" }}>{label}</div>
      <div style={{ height: 6, background: "rgba(255,242,226,0.12)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg,#ff2f7e,#ffb020)" }} />
      </div>
    </div>
  );
}

/* =========================================================
   PROJECTS LIST
========================================================= */
function ProjectsScreen({ projects, openProject, confirmDeleteId, setConfirmDeleteId, archiveProject, restoreProject, permanentlyDeleteProject, togglePin, moveProject, editAnswers, startQuiz, renamingId, setRenamingId, renameText, setRenameText, renameProject }) {
  const [showArchived, setShowArchived] = useState(false);
  const visible = projects.filter((p) => !!p.archived === showArchived).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.15em" }}>PROJECTS</div>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 28, textTransform: "uppercase" }}>{showArchived ? "Archived Case Files" : "Saved Case Files"}</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={"hf-btn" + (showArchived ? " primary" : "")} onClick={() => setShowArchived(!showArchived)}><Archive size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />{showArchived ? "Back to Active" : "View Archived"}</button>
          {!showArchived && <button className="hf-btn pink" onClick={startQuiz}><Plus size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />New Case File</button>}
        </div>
      </div>
      {visible.length === 0 && <div className="hf-card" style={{ padding: 30, textAlign: "center", color: "rgba(255,242,226,0.7)" }}>{showArchived ? "No archived projects." : "No saved projects yet."}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
        {visible.map((p, i) => {
          const d = p.goals.filter((g) => g.done).length, t = p.goals.length;
          const pct = t ? Math.round((d / t) * 100) : 0;
          return (
            <div key={p.id} className="hf-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, border: p.pinned ? "1px solid #ffb020" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: "#00e6d8", letterSpacing: "0.1em" }}>{CATEGORY_LABEL[p.category].toUpperCase()} - {p.caseId}</div>
                {!showArchived && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button className="hf-btn" style={{ padding: "3px 5px" }} disabled={i === 0} onClick={() => moveProject(p.id, -1)} title="Move up"><ArrowUp size={11} /></button>
                    <button className="hf-btn" style={{ padding: "3px 5px" }} disabled={i === visible.length - 1} onClick={() => moveProject(p.id, 1)} title="Move down"><ArrowDown size={11} /></button>
                  </div>
                )}
              </div>
              {renamingId === p.id ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input className="hf-input" style={{ fontSize: 14, padding: "7px 9px" }} autoFocus value={renameText} onChange={(e) => setRenameText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") renameProject(p.id, renameText); if (e.key === "Escape") setRenamingId(null); }} />
                  <button className="hf-btn primary" style={{ padding: "7px 9px" }} onClick={() => renameProject(p.id, renameText)}><Check size={13} /></button>
                  <button className="hf-btn" style={{ padding: "7px 9px" }} onClick={() => setRenamingId(null)}><X size={13} /></button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ fontFamily: "Anton, sans-serif", fontSize: 17, textTransform: "uppercase", lineHeight: 1.2, flex: 1 }}>{p.name}</div>
                  {!showArchived && <button className="hf-btn" style={{ padding: "5px 7px", flexShrink: 0 }} onClick={() => { setRenamingId(p.id); setRenameText(p.name); }} title="Rename"><Pencil size={12} /></button>}
                </div>
              )}
              <div style={{ height: 5, background: "rgba(255,242,226,0.12)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg,#ff2f7e,#ffb020)" }} /></div>
              <div style={{ fontSize: 12, color: "rgba(255,242,226,0.55)" }}>{d}/{t} goals - {pct}%</div>
              {showArchived ? (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button className="hf-btn primary" style={{ fontSize: 11, flex: 1 }} onClick={() => restoreProject(p.id)}><ArchiveRestore size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} />Restore</button>
                  {confirmDeleteId === p.id ? (<><button className="hf-btn pink" style={{ fontSize: 11 }} onClick={() => permanentlyDeleteProject(p.id)}>Confirm</button><button className="hf-btn" style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(null)}><X size={12} /></button></>) : (<button className="hf-btn" style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(p.id)}><Trash2 size={12} /></button>)}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="hf-btn" style={{ fontSize: 11, flex: 1 }} onClick={() => openProject(p.id)}>View</button>
                    <button className="hf-btn" style={{ fontSize: 11 }} onClick={() => togglePin(p.id)} title={p.pinned ? "Unpin" : "Pin to top"}>{p.pinned ? <PinOff size={12} /> : <Pin size={12} />}</button>
                    <button className="hf-btn" style={{ fontSize: 11 }} onClick={() => editAnswers(p.id)} title="Edit answers"><RefreshCw size={12} /></button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {confirmDeleteId === p.id ? (<><button className="hf-btn pink" style={{ fontSize: 11, flex: 1 }} onClick={() => archiveProject(p.id)}>Confirm Archive</button><button className="hf-btn" style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(null)}><X size={12} /></button></>) : (<button className="hf-btn" style={{ fontSize: 11, flex: 1 }} onClick={() => setConfirmDeleteId(p.id)}><Archive size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} />Archive</button>)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   PROJECT DETAIL
========================================================= */
function ProjectDetail({ project, onBack, onGoals, onCoaches, confirmDeleteId, setConfirmDeleteId, archiveProject, restoreProject, permanentlyDeleteProject, togglePin, editAnswers, removeNote, renamingId, setRenamingId, renameText, setRenameText, renameProject }) {
  if (!project) return <div className="hf-card" style={{ padding: 30 }}><button className="hf-btn" onClick={onBack}>&larr; Back to Projects</button></div>;
  const d = project.goals.filter((g) => g.done).length, t = project.goals.length;
  const notes = project.notes || [];
  return (
    <div>
      <button className="hf-btn" style={{ marginBottom: 16 }} onClick={onBack}><ChevronLeft size={12} style={{ verticalAlign: "-2px" }} /> Back to Projects</button>
      {project.archived && (
        <div style={{ marginBottom: 14, padding: "10px 14px", border: "1px dashed rgba(255,242,226,0.3)", borderRadius: 4, fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "rgba(255,242,226,0.7)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span>This project is archived.</span>
          <button className="hf-btn primary" style={{ fontSize: 11 }} onClick={() => restoreProject(project.id)}><ArchiveRestore size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Restore</button>
        </div>
      )}
      <div className="hf-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(255,242,226,0.16)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.12em" }}>CASE FILE {project.caseId}{project.pinned ? " - PINNED" : ""}</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "rgba(255,242,226,0.5)", marginTop: 3 }}>{d}/{t} goals complete</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="hf-btn" style={{ fontSize: 11 }} onClick={() => onGoals(project.id)}><Target size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Goals</button>
            <button className="hf-btn" style={{ fontSize: 11 }} onClick={() => onCoaches(project.id)}><MessageCircle size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Coaches</button>
            <button className="hf-btn" style={{ fontSize: 11 }} onClick={() => downloadTextFile(project.name.replace(/\s+/g, "_") + "_case_file.txt", exportProjectText(project))}><Download size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Export</button>
            {!project.archived && (<><button className="hf-btn" style={{ fontSize: 11 }} onClick={() => editAnswers(project.id)}><RefreshCw size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Edit Answers</button><button className="hf-btn" style={{ fontSize: 11 }} onClick={() => togglePin(project.id)}>{project.pinned ? <PinOff size={12} /> : <Pin size={12} />}</button></>)}
            {confirmDeleteId === project.id ? (
              project.archived ? (<><button className="hf-btn pink" style={{ fontSize: 11 }} onClick={() => permanentlyDeleteProject(project.id)}>Confirm Delete</button><button className="hf-btn" style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(null)}><X size={12} /></button></>) : (<><button className="hf-btn pink" style={{ fontSize: 11 }} onClick={() => archiveProject(project.id)}>Confirm Archive</button><button className="hf-btn" style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(null)}><X size={12} /></button></>)
            ) : (<button className="hf-btn" style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(project.id)}>{project.archived ? <Trash2 size={12} /> : <Archive size={12} />}</button>)}
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>{CATEGORY_LABEL[project.category]}</div>
          {renamingId === project.id ? (
            <div style={{ display: "flex", gap: 8, marginBottom: 10, maxWidth: 480 }}>
              <input className="hf-input" style={{ fontSize: 18 }} autoFocus value={renameText} onChange={(e) => setRenameText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") renameProject(project.id, renameText); if (e.key === "Escape") setRenamingId(null); }} />
              <button className="hf-btn primary" onClick={() => renameProject(project.id, renameText)}><Check size={14} /></button>
              <button className="hf-btn" onClick={() => setRenamingId(null)}><X size={14} /></button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 30, textTransform: "uppercase" }}>{project.name}</h2>
              <button className="hf-btn" style={{ padding: "6px 9px" }} onClick={() => { setRenamingId(project.id); setRenameText(project.name); }} title="Rename"><Pencil size={13} /></button>
            </div>
          )}
          <p style={{ color: "rgba(255,242,226,0.8)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>{project.tagline}</p>
          <Section n="1" title="Recommended Offer"><p style={{ color: "rgba(255,242,226,0.82)", fontSize: 14.5 }}>{project.offer}</p></Section>
          <Section n="2" title="Suggested Pricing"><div style={{ display: "inline-block", fontFamily: "IBM Plex Mono, monospace", fontSize: 14, color: "#160a24", background: "#ffb020", padding: "7px 12px", borderRadius: 2, fontWeight: 600 }}>{project.pricingText}</div></Section>
          <Section n="3" title="Required Tools"><PlainList items={project.tools} /></Section>
          <Section n="4" title="7-Day Startup Checklist">
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {project.checklist.map((c, i) => (<li key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: i < project.checklist.length - 1 ? "1px solid rgba(255,242,226,0.14)" : "none", fontSize: 14, color: "rgba(255,242,226,0.85)" }}><span style={{ fontFamily: "IBM Plex Mono, monospace", color: "#00e6d8", fontSize: 12, minWidth: 50 }}>DAY {i + 1}</span><span>{c}</span></li>))}
            </ul>
          </Section>
          <Section n="5" title="30-Day Action Plan">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              {WEEK_TEMPLATE.map((wk, i) => (<div key={i} style={{ border: "1px solid rgba(255,242,226,0.16)", borderRadius: 3, padding: 14, background: "rgba(0,0,0,0.15)" }}><div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#ff2f7e", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{wk.label}</div><ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.6, color: "rgba(255,242,226,0.82)" }}>{wk.items.map((it, j) => <li key={j}>{it}</li>)}</ul></div>))}
            </div>
          </Section>
          <Section n="6" title="Where To Find Customers"><PlainList items={project.findCustomers} /></Section>
          <Section n="7" title="Risks & Mistakes To Avoid"><div style={{ border: "1px solid rgba(255,47,126,0.4)", background: "rgba(255,47,126,0.06)", borderRadius: 3, padding: "14px 16px" }}><ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: "rgba(255,242,226,0.88)" }}>{project.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></div></Section>
          {notes.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: 17, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}><Bookmark size={15} color="#ffb020" />Key Decisions Log</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notes.map((n) => (<div key={n.id} style={{ border: "1px solid rgba(255,242,226,0.16)", borderRadius: 3, padding: "10px 13px", background: "rgba(0,0,0,0.15)", display: "flex", justifyContent: "space-between", gap: 10 }}><div><div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, color: "#00e6d8", marginBottom: 4 }}>{COACH_LABEL(n.coach).toUpperCase()} - {formatDate(n.createdAt)}</div><div style={{ fontSize: 13.5, color: "rgba(255,242,226,0.85)", lineHeight: 1.5 }}>{n.text}</div></div><button className="hf-btn" style={{ padding: "5px 7px", flexShrink: 0, height: "fit-content" }} onClick={() => removeNote(project.id, n.id)}><Trash2 size={11} /></button></div>))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Section({ n, title, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: 17, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#160a24", background: "#00e6d8", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 2 }}>{n}</span>{title}
      </h3>
      {children}
    </div>
  );
}
function PlainList({ items }) {
  return <ul style={{ margin: 0, paddingLeft: 20, color: "rgba(255,242,226,0.82)", fontSize: 14, lineHeight: 1.7 }}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>;
}

/* =========================================================
   GOALS
========================================================= */
function GoalsScreen({ projects, goalsProjectId, setGoalsProjectId, toggleGoal, customGoalText, setCustomGoalText, customGoalDate, setCustomGoalDate, addCustomGoal, startQuiz, renamingGoalId, setRenamingGoalId, goalRenameText, setGoalRenameText, goalRenameDate, setGoalRenameDate, renameGoal, deleteGoal }) {
  if (projects.length === 0) {
    return (<div className="hf-card" style={{ padding: 30, textAlign: "center" }}><p style={{ color: "rgba(255,242,226,0.75)", marginBottom: 14 }}>Save a case file first to start tracking goals.</p><button className="hf-btn pink" onClick={startQuiz}>Open a Case File</button></div>);
  }
  const project = projects.find((p) => p.id === goalsProjectId) || projects[0];
  const groups = [{ key: "7day", label: "7-Day Checklist" }, { key: "30day", label: "30-Day Plan" }, { key: "custom", label: "Custom Goals" }];
  const d = project.goals.filter((g) => g.done).length, t = project.goals.length;
  const pct = t ? Math.round((d / t) * 100) : 0;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  return (
    <div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.15em", marginBottom: 6 }}>GOALS</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 26, textTransform: "uppercase" }}>Track Your Progress</h2>
        <select className="hf-input" style={{ width: "auto" }} value={project.id} onChange={(e) => setGoalsProjectId(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div className="hf-card" style={{ padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "rgba(255,242,226,0.6)", marginBottom: 8 }}><span>OVERALL PROGRESS</span><span>{d}/{t} - {pct}%</span></div>
        <div style={{ height: 7, background: "rgba(255,242,226,0.12)", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg,#ff2f7e,#ffb020)" }} /></div>
      </div>
      {groups.map((g) => {
        const goals = project.goals.filter((go) => go.group === g.key);
        if (g.key !== "custom" && goals.length === 0) return null;
        return (
          <div key={g.key} className="hf-card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 15, textTransform: "uppercase", marginBottom: 10 }}>{g.label}</div>
            {goals.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,242,226,0.5)", marginBottom: 10 }}>No custom goals yet.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {goals.map((go) => {
                if (renamingGoalId === go.id) {
                  return (
                    <div key={go.id} style={{ display: "flex", gap: 6, padding: "6px 4px", flexWrap: "wrap" }}>
                      <input className="hf-input" style={{ fontSize: 13.5, padding: "7px 9px", flex: 1, minWidth: 140 }} autoFocus value={goalRenameText} onChange={(e) => setGoalRenameText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") renameGoal(project.id, go.id, goalRenameText, goalRenameDate); if (e.key === "Escape") setRenamingGoalId(null); }} />
                      <input type="date" className="hf-input" style={{ fontSize: 12.5, padding: "7px 9px", width: 150 }} value={goalRenameDate} onChange={(e) => setGoalRenameDate(e.target.value)} />
                      <button className="hf-btn primary" style={{ padding: "7px 9px" }} onClick={() => renameGoal(project.id, go.id, goalRenameText, goalRenameDate)}><Check size={13} /></button>
                      <button className="hf-btn" style={{ padding: "7px 9px" }} onClick={() => setRenamingGoalId(null)}><X size={13} /></button>
                    </div>
                  );
                }
                const overdue = go.dueDate && !go.done && new Date(go.dueDate) < todayStart;
                return (
                  <div key={go.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "8px 4px", borderBottom: "1px solid rgba(255,242,226,0.08)" }}>
                    <button onClick={() => toggleGoal(project.id, go.id)} style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "none", border: "none", cursor: "pointer", textAlign: "left", flex: 1, padding: 0 }}>
                      {go.done ? <CheckCircle2 size={16} color="#ffb020" style={{ marginTop: 1, flexShrink: 0 }} /> : <Circle size={16} color="rgba(255,242,226,0.4)" style={{ marginTop: 1, flexShrink: 0 }} />}
                      <span>
                        <span style={{ fontSize: 13.5, color: go.done ? "rgba(255,242,226,0.45)" : "rgba(255,242,226,0.9)", textDecoration: go.done ? "line-through" : "none" }}>{go.text}</span>
                        {go.dueDate && (<span style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, marginTop: 3, color: overdue ? "#ff2f7e" : "rgba(255,242,226,0.4)" }}><Clock3 size={9} style={{ verticalAlign: "-1px", marginRight: 3 }} />{overdue ? "Overdue - was due " : "Due "}{formatDate(go.dueDate)}</span>)}
                      </span>
                    </button>
                    {go.source === "custom" && (<div style={{ display: "flex", gap: 4, flexShrink: 0 }}><button className="hf-btn" style={{ padding: "4px 6px" }} onClick={() => { setRenamingGoalId(go.id); setGoalRenameText(go.text); setGoalRenameDate(go.dueDate ? go.dueDate.slice(0, 10) : ""); }} title="Rename"><Pencil size={11} /></button><button className="hf-btn" style={{ padding: "4px 6px" }} onClick={() => deleteGoal(project.id, go.id)} title="Delete"><Trash2 size={11} /></button></div>)}
                  </div>
                );
              })}
            </div>
            {g.key === "custom" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <input className="hf-input" style={{ flex: 1, minWidth: 160 }} placeholder="Add a custom goal..." value={customGoalText} onChange={(e) => setCustomGoalText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomGoal(project.id)} />
                <input type="date" className="hf-input" style={{ width: 150 }} value={customGoalDate} onChange={(e) => setCustomGoalDate(e.target.value)} title="Optional due date" />
                <button className="hf-btn primary" onClick={() => addCustomGoal(project.id)}><Plus size={13} /></button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   COACHES
========================================================= */
function CoachesScreen({ projects, chatProjectId, setChatProjectId, activeCoach, setActiveCoach, coachChats, chatInput, setChatInput, sendChatMessage, chatLoading, chatEndRef, startQuiz, addNote }) {
  const [searchTerm, setSearchTerm] = useState("");
  if (projects.length === 0) {
    return (<div className="hf-card" style={{ padding: 30, textAlign: "center" }}><p style={{ color: "rgba(255,242,226,0.75)", marginBottom: 14 }}>Save a case file first to unlock your AI coaches.</p><button className="hf-btn pink" onClick={startQuiz}>Open a Case File</button></div>);
  }
  const project = projects.find((p) => p.id === chatProjectId) || projects[0];
  const history = (coachChats[project.id] && coachChats[project.id][activeCoach]) || [];
  const coach = COACHES.find((c) => c.key === activeCoach);
  const term = searchTerm.trim().toLowerCase();
  let matches = [];
  if (term) {
    COACHES.forEach((c) => { const h = (coachChats[project.id] && coachChats[project.id][c.key]) || []; h.forEach((m) => { if (m.content.toLowerCase().includes(term)) matches.push({ ...m, coachKey: c.key, coachLabel: c.label }); }); });
  }
  return (
    <div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#00e6d8", letterSpacing: "0.15em", marginBottom: 6 }}>AI COACHES</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 26, textTransform: "uppercase" }}>Talk To Your Team</h2>
        <select className="hf-input" style={{ width: "auto" }} value={project.id} onChange={(e) => { setChatProjectId(e.target.value); setSearchTerm(""); }}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
        {COACHES.map((c) => {
          const Icon = c.icon;
          const active = c.key === activeCoach;
          return (<button key={c.key} onClick={() => setActiveCoach(c.key)} className="hf-card" style={{ padding: 13, textAlign: "left", cursor: "pointer", border: active ? "1px solid #ff2f7e" : "1px solid rgba(255,242,226,0.16)", background: active ? "rgba(255,47,126,0.1)" : undefined }}><Icon size={17} color={active ? "#ffb020" : "#00e6d8"} style={{ marginBottom: 6 }} /><div style={{ fontFamily: "Anton, sans-serif", fontSize: 13, textTransform: "uppercase", color: "#fff2e2" }}>{c.label}</div><div style={{ fontSize: 11, color: "rgba(255,242,226,0.55)", marginTop: 3 }}>{c.blurb}</div></button>);
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, position: "relative" }}>
        <Search size={13} color="rgba(255,242,226,0.4)" style={{ position: "absolute", left: 12 }} />
        <input className="hf-input" style={{ paddingLeft: 32 }} placeholder="Search across all coach conversations for this project..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && <button className="hf-btn" style={{ padding: "8px 10px" }} onClick={() => setSearchTerm("")}><X size={12} /></button>}
      </div>
      {term ? (
        <div className="hf-card" style={{ padding: 16 }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "rgba(255,242,226,0.6)", marginBottom: 12 }}>{matches.length} result{matches.length === 1 ? "" : "s"} for "{searchTerm}"</div>
          {matches.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,242,226,0.5)" }}>No matches in any coach conversation for this project.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {matches.map((m, i) => (<div key={i} style={{ border: "1px solid rgba(255,242,226,0.14)", borderRadius: 3, padding: "10px 12px", background: "rgba(0,0,0,0.15)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, color: "#00e6d8" }}>{m.coachLabel.toUpperCase()} - {m.role === "user" ? "YOU" : "COACH"}</span><button className="hf-btn" style={{ fontSize: 10.5, padding: "4px 8px" }} onClick={() => { setActiveCoach(m.coachKey); setSearchTerm(""); }}>Jump to chat</button></div><div style={{ fontSize: 13, color: "rgba(255,242,226,0.85)", lineHeight: 1.5 }}>{m.content.length > 220 ? m.content.slice(0, 220) + "..." : m.content}</div></div>))}
          </div>
        </div>
      ) : (
        <div className="hf-card" style={{ display: "flex", flexDirection: "column", height: 440 }}>
          <div className="hf-scroll" style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {history.length === 0 && (
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,242,226,0.5)", fontFamily: "IBM Plex Mono, monospace", marginBottom: 12 }}>{coach.label} is ready. Ask about {project.name} - pricing, outreach, content, whatever's on your mind. Not sure where to start? Try one of these:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(coach.samples || []).map((s, i) => (
                    <button key={i} className="hf-btn" style={{ textAlign: "left", fontSize: 12.5, textTransform: "none", letterSpacing: "normal", fontFamily: "'Work Sans', sans-serif", padding: "10px 14px" }} onClick={() => sendChatMessage(s)} disabled={chatLoading}>
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
            )}
            {history.map((m, i) => (
              <div key={m.id || i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                <div style={{ background: m.role === "user" ? "rgba(0,230,216,0.14)" : "rgba(255,255,255,0.05)", border: "1px solid " + (m.role === "user" ? "rgba(0,230,216,0.35)" : "rgba(255,242,226,0.14)"), borderRadius: 8, padding: "10px 13px", fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,242,226,0.92)", whiteSpace: "pre-wrap" }}>{m.content}</div>
                {m.role === "assistant" && (<button className="hf-btn" style={{ fontSize: 10, padding: "3px 8px", marginTop: 4 }} onClick={() => addNote(project.id, activeCoach, m.content.length > 300 ? m.content.slice(0, 300) + "..." : m.content)} title="Pin to Key Decisions Log"><Bookmark size={10} style={{ verticalAlign: "-1px", marginRight: 4 }} />Pin decision</button>)}
              </div>
            ))}
            {chatLoading && <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11.5, color: "#00e6d8", display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={13} className="spin" style={{ animation: "spin 1s linear infinite" }} />{coach.label} is thinking...</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ borderTop: "1px solid rgba(255,242,226,0.14)", padding: 12, display: "flex", gap: 8 }}>
            <input className="hf-input" placeholder={"Ask the " + coach.label + "..."} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChatMessage()} disabled={chatLoading} />
            <button className="hf-btn primary" onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}><Send size={14} /></button>
          </div>
        </div>
      )}
      <style>{"@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }"}</style>
    </div>
  );
}
