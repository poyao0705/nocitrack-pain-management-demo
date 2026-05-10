# nocitrack-pain-management-demo

A static Nocitrack demo app for running pain-management questionnaires through
Squidly accessibility controls.

## How the app starts

`index.html` loads two files:

- `style.css` for the plain CSS layout and button styling.
- `app.js` as a browser module for all app logic.

When `app.js` runs, it creates one `PainManagementApp` instance. That instance:

1. Creates the root app container.
2. Registers Squidly/Firebase state listeners.
3. Loads the assessment index from `question-banks/index.json`.
4. Seeds the remote `state` value as `menu`.
5. Renders the current screen.

## App states

The app has three screen states:

- `menu`: shows the list of available assessments.
- `assessment`: shows the current question and answer options.
- `result`: shows the saved answer payload as JSON.

The active state is stored locally and mirrored through Squidly/Firebase using
direct `SquidlyAPI` calls.

## Screen flow

### Menu

`AssessmentViews.renderMenu()` renders the assessment selection screen.

Each assessment button is wrapped in a Squidly `access-button`. When Squidly
emits `access-click`, the app calls `selectAssessment(assessmentId)`.

Selecting an assessment:

1. Stores the selected `assessmentId`.
2. Clears any previous `assessmentAnswers`.
3. Sets the remote `state` to `assessment`.
4. Loads the selected assessment JSON.

### Assessment

`AssessmentViews.renderAssessment()` renders the assessment screen in three
sections:

- Top: Home, Previous, Next, or Result navigation.
- Middle: progress, title, question text, and optional image.
- Bottom: scale labels and answer buttons.

Answer buttons are also wrapped in `access-button`. When an answer is activated,
`onAnswer(value)` calls `answerCurrentQuestion(value)` in `app.js`.

Answering a question:

1. Saves the answer into the local `Assessment` model.
2. Converts all answers into a JSON-safe payload.
3. Writes that payload to remote `assessmentAnswers`.
4. Updates the selected answer styling without replacing the whole screen.

The Previous and Next buttons call `moveQuestion(step)`, which updates the
current question index and syncs the updated answer payload.

The Home button calls `returnToMenu()`. It returns to the menu and clears the
active assessment record:

- local `assessmentId`
- local `assessment`
- local `answersPayload`
- remote `assessmentId`
- remote `assessmentAnswers`
- remote `state`, back to `menu`

### Result

On the last question, the Result button appears. Activating it sets the state to
`result` and renders `AssessmentViews.renderResult()`.

The result screen displays the current answer payload. This is useful for
debugging and for confirming what has been saved remotely.

## Data model

The app uses three model classes:

- `Assessment`: owns the question list, current question index, and answers.
- `Question`: stores one question from a question bank.
- `Answer`: stores one answer for one question.

`Assessment.toAnswerPayload()` creates the remote payload:

```json
{
  "assessmentId": "fear-of-pain",
  "assessmentVersion": "1.0",
  "questionIndex": 0,
  "updatedAt": "2026-05-10T00:00:00.000Z",
  "answers": [
    {
      "questionId": "fop-1",
      "value": 2,
      "answeredAt": "2026-05-10T00:00:00.000Z"
    }
  ]
}
```

## Question banks

Assessment metadata lives in:

```text
question-banks/index.json
```

Each entry points to an assessment JSON file, such as:

```text
question-banks/fear-of-pain.json
question-banks/pain-inference.json
```

`AssessmentRepository` loads and caches both the index and individual
assessments. The default source is `default_bank`, which reads local JSON files.
There is also a placeholder `database` source for future database-backed
loading.

## Squidly state integration

The app reads and writes Squidly/Firebase state directly through
`SquidlyAPI`.

It reads and writes these keys:

- `state`
- `assessmentId`
- `assessmentAnswers`

The app expects `SquidlyAPI` to exist before `app.js` runs.

## Rendering strategy

The app does not use a frontend framework. Screens are built with DOM APIs in
`AssessmentViews`.

`PainManagementApp.requestRender()` schedules rendering with `setTimeout(..., 0)`
instead of rendering immediately. This does two things:

- Combines multiple rapid state changes into one render.
- Avoids replacing DOM nodes during a Squidly `access-click` handler.

Most screen changes replace the root content. Answer selection is the exception:
`updateAnswerSelection()` updates button classes in place so the selected state
changes immediately without rebuilding the whole screen.

## Styling

The app uses plain CSS only. There is no Tailwind, build step, or package
manager requirement.

Important layout choices:

- The page root stays centered.
- The assessment screen uses a three-section flex layout.
- Navigation sits at the top of the assessment screen.
- Question content is centered in the middle section.
- Answer options stay in the bottom section.
- Question images use viewport-based sizing so image changes do not cause large
  layout jumps.

## Project structure

```text
app.js                         App coordinator and state transitions
index.html                     Static HTML entry point
style.css                      Plain CSS styles
models/Assessment.js           Assessment state model
models/Answer.js               Answer model
models/Question.js             Question model
services/AssessmentRepository.js
                               Loads question-bank data
ui/AssessmentViews.js          DOM rendering for screens
ui/accessButton.js             Squidly access-button helper
ui/uiClasses.js                Small UI class helper
question-banks/                Assessment JSON files
images/                        Question and answer images
```
