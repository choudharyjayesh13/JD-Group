/* JD Bot — site-wide concierge. Answers questions, passes every lead to WhatsApp. */
(function () {
  var WA_GROUP = "918233334435", WA_RESORT = "918829809555";
  var sc = document.currentScript && document.currentScript.src || "assets/jd-bot.js";
  var BASE = sc.replace(/jd-bot\.js.*$/, ""); // .../assets/
  var pendingBooking = null;

  var css = ""
  + ".jdb-fab{position:fixed;bottom:20px;right:20px;z-index:9990;width:62px;height:62px;border-radius:50%;"
  + "border:2px solid rgba(255,255,255,.25);background:linear-gradient(135deg,#ff9a4d,#e2691f);cursor:pointer;"
  + "box-shadow:0 8px 26px rgba(0,0,0,.5),0 0 26px rgba(255,122,26,.35);display:flex;align-items:center;justify-content:center;font-size:1.75rem}"
  + ".jdb-fab .jdb-tip{position:absolute;right:74px;top:50%;transform:translateY(-50%);background:#0d1b14;color:#e9f2ec;"
  + "border:1px solid rgba(255,122,26,.4);border-radius:10px;padding:7px 12px;font:600 .74rem -apple-system,sans-serif;white-space:nowrap}"
  + ".jdb-panel{position:fixed;bottom:14px;right:14px;z-index:9991;width:min(400px,calc(100vw - 28px));"
  + "height:min(600px,calc(100vh - 60px));background:#08120d;border:1px solid rgba(255,122,26,.4);border-radius:20px;"
  + "display:none;flex-direction:column;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.65);"
  + "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e9f2ec;line-height:1.55}"
  + ".jdb-panel.open{display:flex}"
  + ".jdb-head{display:flex;align-items:center;gap:11px;padding:14px 16px;background:linear-gradient(135deg,rgba(255,122,26,.18),rgba(201,162,75,.08));border-bottom:1px solid rgba(120,180,145,.16)}"
  + ".jdb-head img{height:36px;width:36px}"
  + ".jdb-head b{font-size:1rem}"
  + ".jdb-head .jdb-st{display:block;font:600 .6rem 'SF Mono',Menlo,monospace;letter-spacing:.12em;color:#5fd08a}"
  + ".jdb-head button{margin-left:auto;background:none;border:none;color:#8aa396;font-size:1.5rem;cursor:pointer;padding:4px 8px}"
  + ".jdb-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}"
  + ".jdb-m{max-width:86%;padding:10px 14px;border-radius:16px;font-size:.88rem;white-space:pre-line}"
  + ".jdb-m.bot{background:#12241b;border:1px solid rgba(120,180,145,.16);border-bottom-left-radius:5px;align-self:flex-start}"
  + ".jdb-m.me{background:#ff7a1a;color:#160b03;border-bottom-right-radius:5px;align-self:flex-end;font-weight:500}"
  + ".jdb-m.bot .jdb-act{display:inline-block;margin:8px 6px 0 0;background:#25d366;color:#06130a;text-decoration:none;font-size:.76rem;font-weight:700;padding:8px 13px;border-radius:9px}"
  + ".jdb-m.bot .jdb-act.orange{background:#ff7a1a}"
  + ".jdb-chips{display:flex;flex-wrap:wrap;gap:7px;align-self:flex-start;max-width:92%}"
  + ".jdb-chips button{background:none;border:1px solid rgba(255,122,26,.5);color:#ff7a1a;border-radius:20px;padding:6px 13px;font-size:.76rem;cursor:pointer}"
  + ".jdb-in{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(120,180,145,.16);background:#0d1b14}"
  + ".jdb-in input{flex:1;background:#08120d;border:1px solid rgba(120,180,145,.16);border-radius:12px;color:#e9f2ec;padding:12px 14px;font-size:.9rem;outline:none}"
  + ".jdb-in button{background:#ff7a1a;border:none;border-radius:12px;color:#160b03;font-size:1.15rem;padding:0 16px;cursor:pointer}";

  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  var fab = document.createElement("button");
  fab.className = "jdb-fab"; fab.setAttribute("aria-label", "Chat with JD Bot");
  fab.innerHTML = '🤖<span class="jdb-tip">Ask JD Bot</span>';
  document.body.appendChild(fab);

  var panel = document.createElement("div");
  panel.className = "jdb-panel"; panel.setAttribute("role", "dialog");
  panel.innerHTML = '<div class="jdb-head"><img src="' + BASE + 'jd-logo.svg" alt="">'
    + '<div><b>JD Bot</b><span class="jdb-st">● ONLINE · ANSWERS &amp; BOOKS ANYTHING</span></div>'
    + '<button class="jdb-x" aria-label="Close">×</button></div>'
    + '<div class="jdb-log"></div>'
    + '<div class="jdb-in"><input type="text" placeholder="Ask me anything — rates, dates, events…" autocomplete="off">'
    + '<button class="jdb-send" aria-label="Send">➝</button></div>';
  document.body.appendChild(panel);

  var log = panel.querySelector(".jdb-log"), input = panel.querySelector("input");

  function wa(num, text) { return "https://wa.me/" + num + "?text=" + encodeURIComponent(text); }
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function say(html, acts, chips) {
    var m = document.createElement("div"); m.className = "jdb-m bot"; m.innerHTML = html;
    (acts || []).forEach(function (a) {
      var x = document.createElement("a"); x.className = "jdb-act" + (a.orange ? " orange" : "");
      x.href = a.href; x.textContent = a.label;
      if (a.href.indexOf("http") === 0) x.target = "_blank";
      m.appendChild(x);
    });
    log.appendChild(m);
    if (chips && chips.length) {
      var c = document.createElement("div"); c.className = "jdb-chips";
      chips.forEach(function (t) {
        var b = document.createElement("button"); b.textContent = t;
        b.onclick = function () { c.remove(); send(t); }; c.appendChild(b);
      });
      log.appendChild(c);
    }
    log.scrollTop = log.scrollHeight;
  }
  function me(t) { var m = document.createElement("div"); m.className = "jdb-m me"; m.textContent = t; log.appendChild(m); log.scrollTop = log.scrollHeight; }

  var MAIN_CHIPS = ["Book a stay", "Plan a wedding or event", "Party tonight", "Salon appointment", "CPC One project", "Rates"];
  function hello() {
    say("Namaste! 👋 I'm <b>JD Bot</b> — I can answer questions and book anything across JD Group: stays, tables, parties, salon, events and property. What can I do for you?", [], MAIN_CHIPS);
  }

  var INTENTS = [
    { k: ["book a stay", "stay", "cottage", "udaisarovar", "resort", "camping", "villa", "room", "rooms"],
      f: function () {
        pendingBooking = { num: WA_RESORT, label: "The Udaisarovar" };
        say("<b>The Udaisarovar – Lakeside Paradise</b> 🏝 lakeside cottages on Udai Sagar.\n\n• Cottage (weekday, room only) — ₹3,000\n• Cottage (weekday + breakfast) — ₹3,500\n• Cottage (weekend + breakfast) — ₹5,500\n• Full villa buyout — ₹18,000–₹39,999\n• Lakeside camping — on request\n\nTell me your <b>dates and number of guests</b> and I'll set up the booking, or tap below.",
          [{ label: "Book on WhatsApp", href: wa(WA_RESORT, "Hello, I want to book a stay at The Udaisarovar") }]); } },
    { k: ["wedding", "event", "phere", "shaadi", "birthday", "baby shower", "corporate", "offsite", "celebrat"],
      f: function () {
        pendingBooking = { num: WA_RESORT, label: "an event at The Udaisarovar" };
        say("We host <b>weddings, phere, birthdays, Holi parties, DJ nights &amp; corporate offsites</b> by the lake — full stage, décor and production by JD Production.\n\n• Wedding setup — from ₹1,00,000\n• With catering — from ₹1,50,000\n• Up to 150 guests\n\nShare your <b>date, occasion and guest count</b> and I'll pass it straight to the events team.",
          [{ label: "Plan my event", href: wa(WA_RESORT, "Hello, I want to plan an event at The Udaisarovar") }]); } },
    { k: ["party", "club", "night", "dj", "illuzion", "pronite", "dance"],
      f: function () { say("Tonight's options 🎧\n\n• <b>Illuzion Bar &amp; Lounge</b> — Udaipur's most sophisticated club, at The Belmonte House\n• <b>Pronite.in</b> — the city's event &amp; ticket platform",
        [{ label: "Table at Illuzion", href: wa(WA_GROUP, "Illuzion table booking") }, { label: "Events on Pronite", href: "https://www.pronite.in", orange: true }]); } },
    { k: ["salon", "hair", "makeup", "makeover", "spa", "beauty", "glow", "facial", "bridal"],
      f: function () { say("<b>House of Beauty</b> 💄 — unisex salon &amp; makeover studio at the Belmonte campus, Ravindra Nagar (L'Oréal Professionnel partner). Hair, skin, makeup, nails &amp; spa. Bridal makeovers a speciality.",
        [{ label: "Book appointment", href: wa(WA_GROUP, "House of Beauty appointment") }]); } },
    { k: ["cpc one", "capital tower", "invest", "showroom", "showrooms", "office", "offices", "retail", "crown fort", "tower"],
      f: function () { say("<b>CPC One – Capital Tower</b> 🏗 our flagship upcoming landmark near Geetanjali Hospital, Udaipur:\n\n• ~1,20,000 sq ft saleable in ~1,50,000 sq ft construction\n• 24 premium showrooms + 2 anchors\n• 16 premium offices · 5–6 F&amp;B outlets\n• Crowned by <b>The Crown Fort House</b> — a 60–80 key business hotel\n• Target: 2028–30\n\nRetail, office and partnership enquiries are open.",
        [{ label: "Enquire now", href: wa(WA_GROUP, "CPC One Capital Tower enquiry") }]); } },
    { k: ["property", "plot", "land", "township", "real estate", "zameen"],
      f: function () { say("<b>CPC — Choudhary Properties and Consultancy</b> has developed townships and land across Chittorgarh &amp; Udaipur since 1999 — site selection, documentation and end-to-end support.",
        [{ label: "Property enquiry", href: wa(WA_GROUP, "CPC property enquiry") }]); } },
    { k: ["rate", "price", "cost", "tariff", "kitna", "charges"],
      f: function () { say("Quick rate card ₹\n\n• Udaisarovar cottage — from ₹3,000/night\n• Full villa buyout — from ₹18,000\n• Wedding setup — from ₹1,00,000\n• Meals — breakfast ₹300 · lunch ₹500 · dinner ₹800\n\nWhich one shall I book for you?", [], ["Book a stay", "Plan a wedding or event"]); } },
    { k: ["chittorgarh", "kirti"],
      f: function () { say("<b>Hotel Kirti Plaza</b> — Chittorgarh's trusted address since 2002: 51 AC rooms, restaurant, meeting rooms, garden &amp; parking, 3 km from the great fort.",
        [{ label: "Book Kirti Plaza", href: wa(WA_GROUP, "Hotel Kirti Plaza booking") }]); } },
    { k: ["artist house", "artist"],
      f: function () { say("<b>The Artist House</b> — eat, drink, work, stay. Boutique rooms in a former theatre building in old Udaipur, with a club, taproom, pizzeria, co-working and a tropical pool. 4.3/5 on TripAdvisor.",
        [{ label: "Book / reserve", href: wa(WA_GROUP, "The Artist House enquiry") }]); } },
    { k: ["belmonte", "casablanca", "pool bar"],
      f: function () { say("<b>The Belmonte House</b> — 30-room French-inspired boutique hotel in Pratap Nagar with a rooftop pool. Same campus: <b>Casablanca</b> pool bar &amp; kitchen (4 PM–11:30 PM), <b>Illuzion</b> club and <b>House of Beauty</b> salon.",
        [{ label: "Book Belmonte", href: wa(WA_GROUP, "The Belmonte House enquiry") }, { label: "Table at Casablanca", href: wa(WA_GROUP, "Casablanca table booking") }]); } },
    { k: ["pizza", "pizzeria"],
      f: function () { say("<b>Pizzeria Locale</b> 🍕 — true wood-fired Italian pizza in Udaipur, rated 4.1/5. Also at The Artist House.",
        [{ label: "Order / enquire", href: wa(WA_GROUP, "Pizzeria Locale enquiry") }]); } },
    { k: ["wine", "liquor", "beer"],
      f: function () { say("<b>The Wine House</b> — beer, wine &amp; spirits on NH-8, Bypass Chouraha, Transport Nagar, Udaipur. Please drink responsibly.",
        [{ label: "Open in Maps", href: "https://maps.google.com/?q=The+Wine+House+Transport+Nagar+Udaipur", orange: true }]); } },
    { k: ["petrol", "fuel", "bpcl", "diesel"],
      f: function () { say("<b>BPCL Filling Station, Barisadri</b> — Bharat Petroleum dealership in Chittorgarh district, serving since 1995. Where the JD story began."); } },
    { k: ["shoes", "stepwhere", "child", "kids"],
      f: function () { say("<b>Stepwhere</b> 👟 — GPS smart school shoes: real-time tracking, geo-fence alerts and step counting.",
        [{ label: "Visit stepwhere.in", href: "https://www.stepwhere.in", orange: true }]); } },
    { k: ["wallet", "reward", "member", "jd one", "points", "waitlist", "app"],
      f: function () { say("<b>JD One</b> — our web app: every venture in one place, with wallet &amp; rewards coming soon. Add it to your home screen from the link below.",
        [{ label: "Open JD One", href: BASE + "../one/index.html", orange: true }, { label: "Join the waitlist", href: wa(WA_GROUP, "I want early access to JD One") }]); } },
    { k: ["contact", "phone", "number", "address", "location", "call"],
      f: function () { say("📞 <b>JD Group</b>: +91 82333 34435 · connect@myjdgroup.com\n🏝 <b>The Udaisarovar</b>: +91 88298 09555, Lakadwas, Udaipur\n🏢 Belmonte campus: K-34 Ravindra Nagar, Pratap Nagar, Udaipur",
        [{ label: "WhatsApp us", href: wa(WA_GROUP, "Hello JD Group") }]); } },
    { k: ["hi", "hello", "hey", "namaste", "hii"], f: function () { hello(); } },
    { k: ["thank", "thanks", "shukriya", "great", "nice"], f: function () { say("Always a pleasure! 😊 Anything else — a stay, a party, a project?", [], MAIN_CHIPS); } }
  ];

  function handle(t) {
    var q = t.toLowerCase();
    if (pendingBooking && (q.match(/\d/) || q.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|tomorrow|today|weekend|guest|people|pax/))) {
      var b = pendingBooking; pendingBooking = null;
      say("Perfect ✅ I've prepared your booking request for <b>" + b.label + "</b>:\n\n“" + esc(t) + "”\n\nOne tap and it goes to the team on WhatsApp — they confirm instantly.",
        [{ label: "Send booking request", href: wa(b.num, "Lead via myjdgroup.com — " + b.label + ": " + t) }]);
      return;
    }
    for (var i = 0; i < INTENTS.length; i++)
      for (var j = 0; j < INTENTS[i].k.length; j++)
        if (new RegExp("\\b" + INTENTS[i].k[j].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(q)) { INTENTS[i].f(); return; }
    say("I want to get this exactly right — let me hand your question to a real person on the JD team (they reply fast on WhatsApp):",
      [{ label: "Ask the team", href: wa(WA_GROUP, "Lead via myjdgroup.com: " + t) }], MAIN_CHIPS);
  }

  function send(t) {
    t = (t || input.value).trim(); if (!t) return;
    input.value = ""; me(t);
    setTimeout(function () { handle(t); }, 350);
  }

  fab.onclick = function () { panel.classList.add("open"); fab.style.display = "none"; if (!log.children.length) hello(); input.focus(); };
  panel.querySelector(".jdb-x").onclick = function () { panel.classList.remove("open"); fab.style.display = "flex"; };
  panel.querySelector(".jdb-send").onclick = function () { send(); };
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
})();
