/**
 * Pause Before You Send - on-device message checker.
 * Works in the browser (window.PauseDetector) and Node (require).
 * No network calls. No storage. Text in, nudge (or null) out.
 *
 * Levels: 1 = gentle, 2 = important, 3 = serious.
 * `boost` raises the level when the child is chatting with someone met online.
 * `strangerOnly` rules are ignored when chatting with a real-life friend.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PauseDetector = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const INSULTS = 'stupid|idiot|dumb|ugly|loser|moron|freak|worthless|pathetic|fat';
  const TARGETED = new RegExp(
    "\\b(you|u|ur|youre|you're|your|ya)\\b(?:\\W+\\w+){0,3}?\\W+(?:" + INSULTS + ")\\b"
  );
  const STANDALONE = /\b(shut up|hate you|nobody likes you|you suck|what a (loser|idiot|moron|freak))\b/;
  const NEGATION = /(n't|\bnot\b|\bnever\b)/;

  const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '@': 'a', '$': 's' };
  const norm = (s) => String(s).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();
  const leet = (s) => s.replace(/[013458@$]/g, (c) => LEET[c] || c);

  const re = (r) => (t) => r.test(t);
  const isMean = (t, l) =>
    [t, l].some((s) => (TARGETED.test(s) && !NEGATION.test(s)) || STANDALONE.test(s));

  const RULES = [
    { id: 'selfharm', lvl: 3,
      test: re(/\b(kill yourself|kys|go die|you should die|i want to die|hurt myself)\b/),
      title: 'That sounds really heavy',
      msg: "Words like this can hurt a lot, or may mean someone is hurting. Please don't send it as is.",
      tip: 'If you or someone you know is struggling, talk to a trusted adult. In the US you can call or text 988.' },
    { id: 'sexual', lvl: 3,
      test: re(/\b(nudes?|send (me )?(a )?(naked|sexy) (pic|photo)s?)\b/),
      title: 'Please stop and talk to an adult',
      msg: 'Sharing or asking for this kind of picture is unsafe and can be illegal for kids and teens.',
      tip: 'If someone is pressuring you, you are not in trouble. Tell a trusted adult.' },
    { id: 'secret', lvl: 2, boost: 1,
      test: re(/\b(don'?t tell (your|my|ur) (mom|dad|parents?|teacher)|our (little )?secret|keep (this|it) (a )?secret|delete (this|these) (chat|messages?))\b/),
      title: 'Secrets like this can be a red flag',
      msg: 'Asking someone to keep things from their parents is a common tactic used to build unsafe situations.',
      tip: "Safe people don't mind if a trusted adult knows. Consider telling one." },
    { id: 'meet', lvl: 1, boost: 1, strangerOnly: true,
      test: re(/\b(meet (up|me|you)|come over|where do you live|pick you up|come to my (house|place))\b/),
      title: 'Meeting up is a big step',
      msg: 'Making plans to meet someone from online, or asking where they live, is something to check with a trusted adult first.',
      tip: 'Never meet someone from online without a parent knowing and being there.' },
    { id: 'alone', lvl: 1, boost: 1,
      test: re(/\b(home alone|parents? (are|is) (out|away|gone|not home|asleep)|nobody('s| is) home)\b/),
      title: "This tells people you're alone",
      msg: "Sharing that nobody is home can make a stranger think you're easy to find or reach.",
      tip: "Keep details about when you're alone to yourself." },
    { id: 'addr', lvl: 1, boost: 1,
      test: re(/\b\d{1,5}\s+[a-z0-9' ]{2,25}\s(street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd|boulevard|court|ct)\b|\bi live (at|on)\b|\bmy address\b/),
      title: 'That looks like your home address',
      msg: 'Your address tells people exactly where to find you.',
      tip: 'Share it only with people you and your family know well. Want to take it out?' },
    { id: 'contact', lvl: 1, boost: 1,
      test: re(/\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/),
      title: 'That looks like a phone number or email',
      msg: "Contact details can be shared widely or used by people you didn't mean to reach.",
      tip: 'Ask a parent before sharing contact info, especially with new people.' },
    { id: 'school', lvl: 1, boost: 1,
      test: re(/\b(i go to|my school is|i attend) [a-z' ]{2,30}(school|elementary|middle|academy|high)\b/),
      title: 'This could show where you are every day',
      msg: 'Your school name plus your name or age can make you easy to find.',
      tip: 'You can chat about school without naming it.' },
    { id: 'photoask', lvl: 2, boost: 1, strangerOnly: true,
      test: re(/\b(send (me )?(a )?(pic|pics|photo|photos|selfie)|show me (your|a) (pic|photo|face)|pic of (you|yourself))\b/),
      title: 'Sharing pictures can be risky',
      msg: "Photos can be saved, shared, or edited by anyone, even AI, once they're sent.",
      tip: "Only send photos to people you know in real life, and never ones you'd be embarrassed about." },
    { id: 'mean', lvl: 1,
      test: isMean,
      title: 'That might hurt, and you can\'t take it back',
      msg: "Once it's sent, it can stay with someone for a long time.",
      tip: 'Try saying how you feel instead, like "I\'m upset because..."' },
  ];

  function analyze(text, ctx) {
    ctx = ctx === 'stranger' ? 'stranger' : 'friend';
    const t = norm(text), l = leet(t);
    let best = null;
    for (const r of RULES) {
      if (r.strangerOnly && ctx !== 'stranger') continue;
      if (!r.test(t, l)) continue;
      const lvl = Math.min(3, r.lvl + (ctx === 'stranger' && r.boost ? r.boost : 0));
      if (!best || lvl > best.lvl) best = { id: r.id, lvl, title: r.title, msg: r.msg, tip: r.tip };
    }
    return best;
  }

  function analyzePhoto(ctx) {
    if (ctx !== 'stranger') return null;
    return { id: 'photo', lvl: 3,
      title: "Sending a photo of yourself to someone you've only met online?",
      msg: "Photos can be saved, shared, or edited by AI once sent, and you can't get them back.",
      tip: 'Talk to a trusted adult before sharing pictures with new online contacts.' };
  }

  return { analyze, analyzePhoto, RULES };
});
