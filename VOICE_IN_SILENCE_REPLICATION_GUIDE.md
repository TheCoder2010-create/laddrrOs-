
# How to Replicate the "Voice – in Silence" Feature

This guide provides a step-by-step process for recreating the "Voice – in Silence" anonymous feedback system in a similar Next.js, TypeScript, and Genkit application.

## 1. Feature Overview

"Voice – in Silence" is a secure and anonymous channel for users to submit sensitive feedback. The core principles are:

-   **Anonymity:** The submission process is entirely separate from the main application's authentication system.
-   **Traceability:** Users receive a unique, non-sequential Tracking ID to check the status of their case later. This ID is their only link to the submission.
-   **Confidentiality:** The Tracking ID for open cases is hidden from reviewers (e.g., HR Head) to prevent them from impersonating the user on the public tracking page.
-   **Structured Workflow:** Submissions are routed to a secure "Vault" for review, with a clear, auditable trail of actions (AI analysis, assignment, resolution).

## 2. Core Components

The feature is built upon several key files:

-   **Data Model & Service Logic:** `src/services/feedback-service.ts` (Defines the `Feedback` interface and all functions for creating, updating, and retrieving cases).
-   **Submission & Tracking UI:** `src/app/voice-in-silence/submit/page.tsx` (The public-facing page where users submit feedback and track existing cases).
-   **Secure Review UI (The Vault):** `src/app/vault/page.tsx` (A restricted page for HR to view, analyze, and manage incoming anonymous submissions).
-   **AI Summarization (Optional):** `src/ai/flows/summarize-anonymous-feedback-flow.ts` and its schema file.

---

## 3. Step-by-Step Implementation Guide

### Step 1: Define the Data Model

In `src/services/feedback-service.ts`, define the `Feedback` interface. This is the schema for each anonymous case.

**Key Fields:**

-   `trackingId`: A unique, randomly generated ID.
-   `subject`, `message`: The user's submission content.
-   `submittedAt`: Timestamp of the submission.
-   `source`: A flag, set to `'Voice – In Silence'`, to distinguish these cases from other feedback types.
-   `status`: The current state of the case (e.g., `Open`, `In Progress`, `Resolved`).
-   `summary`, `criticality`: Fields to be populated by the AI analysis.
-   `auditTrail`: An array of `AuditEvent` objects to log every action taken on the case.
-   `assignedTo`: An array of `Role`s who are assigned to investigate.
-   `resolution`: The final resolution text provided by HR.

### Step 2: Implement the Service Logic

All logic for interacting with the data resides in `src/services/feedback-service.ts`. The storage uses `sessionStorage` for this prototype, but this can be replaced with a database.

**A. Submission (`submitAnonymousFeedback`):**

1.  This function takes a `subject` and `message`.
2.  It generates a unique `trackingId`.
3.  It creates a new `Feedback` object with `status: 'Open'`, `source: 'Voice – In Silence'`, and an initial `auditTrail` event for the submission.
4.  It saves the new object to the feedback list in `sessionStorage`.
5.  It returns the `trackingId` to the UI to be displayed to the user.

**B. Tracking (`trackFeedback`):**

1.  This function takes a `trackingId`.
2.  It searches `sessionStorage` for a matching case.
3.  If found, it returns a public-safe version of the case data, omitting sensitive details from the audit trail for privacy.
4.  If the case requires user interaction (e.g., HR requested more info), it returns the full feedback object to render the appropriate interactive widget.

**C. Management (Functions for the Vault):**

-   `getAllFeedback`: Retrieves all feedback, which the Vault page then filters for `source === 'Voice – In Silence'`.
-   `summarizeFeedback`: Takes a `trackingId`, calls the Genkit AI flow to get a summary and criticality, and updates the case.
-   `assignFeedback`: Adds a `Role` to the `assignedTo` array and logs an `Assigned` event.
-   `addFeedbackUpdate`: Adds a confidential note to the audit trail, visible only within the Vault.
-   `resolveFeedback`: Sets the case `status` to `Pending Anonymous Acknowledgement` and logs the final resolution text.

### Step 3: Build the Submission & Tracking UI

Create the page at `src/app/voice-in-silence/submit/page.tsx`. This page must be accessible without authentication.

1.  **Tabs:** Use a tabbed interface to switch between "Submit Feedback" and "Track Submission".
2.  **Submission Form (`SubmissionForm` component):**
    -   Contains fields for "Subject" and "Message".
    -   On submit, it calls the `submitAnonymousFeedback` service function.
    -   Upon successful submission, it receives the `trackingId` and displays it to the user in a prominent alert, instructing them to save it.
3.  **Tracking Form (`TrackingForm` component):**
    -   Contains a single input for the `trackingId`.
    -   On submit, it calls the `trackFeedback` service function.
    -   If a case is found, it displays the case status, a redacted audit trail, and any interactive widgets (like a reply box if HR has asked a question).
    -   If not found, it displays an error message.

### Step 4: Build the Secure Vault UI

Create the restricted page at `src/app/vault/page.tsx`.

1.  **Access Control:** This page should be strictly limited, for example, to the `'HR Head'` role. Implement a simple login or role check.
2.  **Case List (`VaultContent` component):**
    -   Fetch all feedback items using `getAllFeedback` and filter them to show only those where `source === 'Voice – In Silence'`.
    -   Display the cases in an `Accordion`.
3.  **Security - Hide Tracking ID:**
    -   For each case in the list, check if its `status` is `Resolved` or `Closed`.
    -   If the case is **open**, display the text `ID Hidden Until Closure` instead of the actual `trackingId`.
    -   This prevents the reviewer from using the ID on the public tracking page.
4.  **Case Actions (Inside each Accordion item):**
    -   **Summarize:** If a case has no `summary`, show a button that calls `summarizeFeedback(trackingId)`. Display a loading state while the AI is working.
    -   **AI Analysis Display:** Once summarized, display the `criticality` and `summary` in a styled alert box.
    -   **Action Panel:** Provide UI elements (forms, buttons) for HR to:
        -   Assign the case (`assignFeedback`).
        -   Add private updates (`addFeedbackUpdate`).
        -   Request more information from the user (`requestAnonymousInformation`).
        -   Post a final resolution (`resolveFeedback`).
    -   **Audit Trail:** Display the full, unabridged audit trail for the case.
5.  **PDF Export (Optional):**
    -   Implement a function (`downloadAuditTrailPDF`) that uses a library like `jsPDF` to generate a report of the case history.
    -   Ensure this function also respects the rule of hiding the tracking ID for open cases.

By following these steps, you can successfully replicate the entire "Voice – in Silence" feature, ensuring both user anonymity and a robust, auditable review process.
