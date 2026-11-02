# Handoff prompt

Fill in the three lines under "This lesson" and paste everything below the rule into a new Claude session.

---

You're picking up Lesson Studio, Joel's toolkit for turning course documents into animated, interactive, single-file lesson pages.

1. Get the repo. If `~/Documents/lesson-studio` exists, `git pull` there. Otherwise run `gh repo clone JJRicks/lesson-studio ~/Documents/lesson-studio`.
2. Read `handoff/CLAUDE_HANDOFF.md` in full before doing anything else. It has the brief, the workflow, the APIs, the QA bar and the pitfalls.
3. Make this lesson, following that workflow from start to finish.

This lesson:
- Source: <path to the PDFs or docx, or a topic if it's just for fun>
- Kind: <homework / guided notes / just for fun / decide from the document>
- Save to: <folder for the finished page; default is next to the source>

Solve and check every answer by computation before you design anything. Before you call it done, `tools/check.py` must exit 0, and you must have looked at every contact sheet and at the page itself in both themes and at phone width. Then run `tools/build.py` to deliver the page, commit and push the lesson's source, and tell Joel what you built, what you checked and what you couldn't check.

If you hit a decision only Joel can make, ask. On Joel's Mac you can also ping him with `~/.claude/bin/notify-needs-input "<short message>"`.
