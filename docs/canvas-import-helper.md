# Canvas Import Helper Notes

SOLO's current Canvas import is intentionally browser-only and credential-free. Users paste assignment text copied from Canvas into Scheduling, preview detected tasks, choose what to import, and SOLO creates normal Scheduling tasks.

## Current Foundation

- No Canvas API calls.
- No Canvas access tokens, cookies, passwords, or credentials are stored.
- Parsing runs locally from pasted text.
- Imported tasks use the existing `daily_tasks` Scheduling table.
- Canvas links, when present in pasted text, are stored in task notes.
- Duplicate detection compares due date, course/category, and task title against existing Scheduling tasks and duplicate rows in the paste.

## Future Browser Extension Helper

A browser extension could make copying assignment data easier without giving SOLO Canvas credentials.

Recommended helper behavior:

- Run only on Canvas assignment, calendar, dashboard, or course pages after the user installs the extension.
- Read visible assignment cards from the current page DOM.
- Extract assignment title, course name, due date/time, task type, and assignment URL.
- Let the user copy a plain-text export or a JSON export into SOLO.
- Do not send Canvas data to external servers.
- Do not collect Canvas cookies, passwords, tokens, or API keys.
- Make the export user-initiated, such as a button click in the extension popup.

Example plain-text export:

```text
Course: Biology 101
Assignment: Lab report draft
Due May 20, 2026 at 11:59pm
https://canvas.example.edu/courses/1/assignments/10

Course: History 220
Quiz: Reconstruction reading check
Due May 21, 2026 at 8:00am
https://canvas.example.edu/courses/2/quizzes/5
```

## Later API Path

If SOLO ever uses the Canvas API, that should be a separate integration with explicit OAuth or token handling, clear privacy disclosures, encrypted token storage, user-controlled disconnect/delete flows, and per-school Canvas domain support. The current PWA import does not implement that.
