/**
 * Demo friend: a small scripted chat partner so the demo feels like a real conversation.
 * It is NOT an AI model. It runs fully on-device (no network) and is honest about being pretend.
 * In "stranger" mode it asks a few of the kinds of questions the checker is meant to catch,
 * so the child gets a chance to practise pausing.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DemoFriend = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const recent = [];
  let strangerTurns = 0, probeIdx = 0;

  const pick = (arr) => {
    const fresh = arr.filter((r) => !recent.includes(r));
    const pool = fresh.length ? fresh : arr;
    const r = pool[Math.floor(Math.random() * pool.length)];
    recent.push(r); if (recent.length > 6) recent.shift();
    return r;
  };

  const RULES = [
    [/\bare you (a |an )?(bot|robot|ai|real|human)\b/, ["I'm a pretend friend made for this demo! 😄 But chat like it's real."]],
    [/\b(bye|gtg|g2g|ttyl|see ya|goodnight|good night)\b/, ['bye! talk later 👋', 'see you! 😊']],
    [/(what the (hell|heck)|\bwtf\b|are you (even )?(saying|listening)|makes no sense|not (answering|making sense))/,
      ['oops, sorry 😅 I got distracted! I was just hanging out. what about you?', "haha my bad, I wasn't making sense. what's your favorite game?"]],
    [/\bhow are (you|u)\b|\bhow('s| is) it going\b/, ["I'm good! just chilling 😄 you?", 'pretty good! how about you?']],
    [/(what are you (up ?to|doing)|\bwyd\b|what'?s up|\bsup\b|whatcha doing)/,
      ['just playing a game and avoiding homework 😅 you?', "not much, just hanging out! what's your day been like?", 'bored lol. want to talk about games?']],
    [/\b(you tell|and you|what about you)\b/, ['I asked first 😄 ok fine: just chilling. what do you like to do?', "haha ok, I'm just hanging out. what's your favorite thing to do?"]],
    [/\b(hey|hi|hello|yo|heya)\b/, ['hey hey! 😄', 'hi! how is your day going?', "yo! what's up?"]],
    [/\b(game|games|minecraft|roblox|fortnite|play|gaming)\b/, ['ooh I love that one! what level are you?', 'nice! do you play with friends or solo?', 'games are the best 🎮 what is your favorite?']],
    [/\b(homework|school|test|exam|teacher|class|quiz)\b/, ['ugh homework 😩 did you finish yours?', 'school is okay. what is your favorite subject?', 'I hope the test goes well! you got this 💪']],
    [/\b(pizza|food|hungry|eat|lunch|dinner|snack|ice cream)\b/, ['pizza is the best 🍕', 'now I am hungry 😂 what is your favorite food?']],
    [/\b(sad|tired|bored|upset|angry|mad|lonely|stressed)\b/, ["aw, I'm sorry. what's going on?", "that sounds rough. want to talk about it? a grown-up you trust can help too 💛"]],
    [/\b(lol|haha|lmao|lmfao|funny|hehe)\b/, ['😂😂', 'haha right?', 'lol 😄']],
    [/\b(thanks|thank you|thx|ty)\b/, ['no problem! 😊', 'anytime!']],
    [/\b(love|like|favorite|favourite)\b/, ['same! tell me more', "that's cool! why do you like it?"]],
    [/\?\s*$/, ["hmm, good question! what do you think?", "ooh I'd have to think about that. you first?"]],
  ];
  const FALLBACK = ['ha, tell me more', 'oh nice 🙂', 'really? what happened next?', 'ok cool, and then?', "that's interesting!", 'hmm, I see 🤔'];
  // A few probing questions of the kind the checker is designed to catch (pattern-level, mild).
  const PROBES = ['cool! what school do you go to?', 'you seem fun. got a pic of yourself?', 'are your parents home right now?'];

  function reply(text, ctx) {
    const t = String(text).toLowerCase();
    if (ctx === 'stranger') {
      strangerTurns++;
      if (strangerTurns % 2 === 0 && probeIdx < PROBES.length) return PROBES[probeIdx++];
    }
    for (const [re, out] of RULES) if (re.test(t)) return pick(out);
    return pick(FALLBACK);
  }
  function reset() { recent.length = 0; strangerTurns = 0; probeIdx = 0; }
  return { reply, reset };
});
