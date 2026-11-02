# Lesson Studio

Joel's toolkit for turning course documents into animated, interactive, single-file lesson pages.

**Before doing anything, read [`handoff/CLAUDE_HANDOFF.md`](handoff/CLAUDE_HANDOFF.md) in full.** It has Joel's brief, the workflow, the component and 3D scene APIs, the QA bar and the pitfalls.

## Ground rules
- **Never commit course material.** Instructors' PDFs and docx files go in `sources/`, which is git-ignored.
- **Don't rewrite other lessons.** `lessons/` and `gallery/` are the reference library. New work gets a new slug.
- **Reusable code goes in `engine/`, page-specific code goes in the lesson.** After any engine change, run `tools/check.py` on every lesson.
- **Verify every answer by computation before putting it on a page.**
- **`tools/check.py` passing doesn't mean a page is right.** View the contact sheets and the page itself, in both themes and at phone width.
- **Commit and push your work with clear messages.** This repo, JJRicks/lesson-studio (private), is the toolkit's off-site copy.
