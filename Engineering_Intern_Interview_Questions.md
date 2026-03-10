# Engineering Intern Interview Questions

## Introduction

Thank you for your interest in the Nucleus Security Engineering
internship program! This document contains 2 primary interview
challenges for you. The first is a code review question, and the second
is a coding challenge.

For both, we absolutely encourage the use of AI. If you do use AI, we
would like for you to share your prompts and then answer the follow-up
questions about how you thought through your prompts.

We know this time of the year is crazy for college students and that
your time is very valuable. Please try not to spend more than about 1
total hour collectively on this.

------------------------------------------------------------------------

## Contents

-   Introduction
-   Code Review (10 minutes)
    -   Task
    -   PHP
    -   Python
    -   Code comments
    -   Follow-up Questions
-   Coding Challenge (\~50 minutes)
    -   Exercise
    -   Follow-up questions
-   Delivery

------------------------------------------------------------------------

# Code Review (10 minutes)

You are welcome and encouraged to use AI for this section. If you do,
please provide your prompts and answer the questions in the follow-up
section.

## Task

Your colleague or team member was given the following task:

1.  Add a `/webhook` endpoint to receive vendor events about users who
    are vendors.

2.  Input data will look like:

    ``` json
    {"email":"a@b.com","role":"admin","metadata":{"source":"vendor"}}
    ```

3.  Verify signature header `X-Signature`.

4.  Parse JSON and upsert the user data.

5.  Store the raw payload for audit/debug.

They have opened a PR with the code below. Review the code and comment
on any issues you find.

**Note:** Both the PHP and Python do the same thing. You can choose to
review whichever one you want. It is not intended for you to review
both.

------------------------------------------------------------------------

## PHP

``` php
<?php
// webhook.php
require_once "db.php"; // provides $pdo (PDO instance)

// Config (dev defaults)
$WEBHOOK_SECRET = getenv("WEBHOOK_SECRET") ?: "dev-secret";
$DB_AUDIT_ENABLED = getenv("AUDIT_ENABLED") ?: "true";

function verify_signature($sig, $body, $secret) {
    // Vendor docs: SHA256(secret + body)
    $expected = hash("sha256", $secret . $body);
    return $expected == $sig; // simple compare
}

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// Basic routing
if ($method !== "POST" || $path !== "/webhook") {
    http_response_code(404);
    echo "not found";
    exit;
}

$raw = file_get_contents("php://input"); // raw body string
$sig = $_SERVER["HTTP_X_SIGNATURE"] ?? "";

if (!verify_signature($sig, $raw, $WEBHOOK_SECRET)) {
    http_response_code(401);
    echo "bad sig";
    exit;
}

// Decode JSON
$payload = json_decode($raw, true);
$email = $payload["email"] ?? "";
$role = $payload["role"] ?? "user";

// Store raw payload for auditing / debugging
if ($DB_AUDIT_ENABLED) {
    $pdo->exec("INSERT INTO webhook_audit(email, raw_json) VALUES ('$email', '$raw')");
}

// Upsert user (simple)
$pdo->exec("INSERT INTO users(email, role) VALUES('$email', '$role')");

echo "ok";
```

------------------------------------------------------------------------

## Python

``` python
# app.py
import os
import json
import sqlite3
import hashlib
from flask import Flask, request

app = Flask(__name__)
DB_PATH = os.getenv("DB_PATH", "/tmp/app.db")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "dev-secret")  # default for dev

def get_db():
    return sqlite3.connect(DB_PATH)

def verify(sig, body: bytes) -> bool:
    # Vendor docs: SHA256(secret + body)
    expected = hashlib.sha256(
        (WEBHOOK_SECRET + body.decode("utf-8")).encode("utf-8")
    ).hexdigest()
    return expected == sig  # simple compare

@app.post("/webhook")
def webhook():
    raw = request.data  # bytes
    sig = request.headers.get("X-Signature", "")

    if not verify(sig, raw):
        return ("bad sig", 401)

    payload = json.loads(raw.decode("utf-8"))

    # Example payload:
    # {"email":"a@b.com","role":"admin","metadata":{"source":"vendor"}}
    email = payload.get("email", "")
    role = payload.get("role", "user")

    db = get_db()
    cur = db.cursor()

    # Store raw payload for auditing / debugging
    cur.execute(
        f"INSERT INTO webhook_audit(email, raw_json) VALUES ('{email}', '{raw.decode('utf-8')}')"
    )

    # Upsert user
    cur.execute(
        f"INSERT INTO users(email, role) VALUES('{email}', '{role}')"
    )

    db.commit()

    return ("ok", 200)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

------------------------------------------------------------------------

## Code comments

Put your code comments here. For comments on specific lines, please
include the line number. Feel free to comment on the general task as
well.

(Reviewing the Python version of the server)

The verify function (lines 15-20) assumes UTF-8 bytes, but may not be able to handle non-UTF-8 bytes.
Ideally, use hmac.compare_digest to compare signatures (is more optimized than '==')

In lines 30-35, while the email and role are retrieved from the payload, no checks are done on the types of these values or the format of their contents. 
Due to Python's dynamic type system, it is very easy to forget to check types at runtime.
Ensure that the type of "email" and "role" is a string.
Check that the email follows an email regex (must be a valid email, e.g. abc@gmail.com)
Additionally, it may be necessary to validate users against a whitelist of admins (currently any client can claim they are an admin)
Finally, check that metadata is a valid object, with a field called "source" with value "vendor". Otherwise there is no way to know if the user is a vendor.
It may be necessary to also validate the vendor with a whitelist of vendors.
Also, enforce maximum payload sizes or maximum sizes on each individual item.

Lines 40-48 runs the risk of SQL injection. Never insert strings directly as SQL queries.
Instead use parameterized queries (question mark queries) to avoid this risk. As an example:
```
cur.execute(
    "INSERT INTO users(email, role) VALUES(?, ?)", 
    (email, role)
)
```
Additionally, what happens when there are duplicate entries? To de-duplicate, use INSERT OR REPLACE


Finally, add a TODO for rate limiting and additional security policies.

------------------------------------------------------------------------

## Follow-up Questions

1.  Share your prompts and the AI outputs.
The prompt and output is located in `./pr_review/prompts_1.txt`
2.  For each prompt:
    -   Tell us what you were hoping for the AI to accomplish.
    -   Tell us what it actually did.
    -   Did you have to re-prompt it based on its output?
    -   If you had to change your approach, why?

I used a single prompt for part (1).
I immediately noticed three major issues: insufficient validation, lack of type checking, and SQL Injections.
I gave the code and one of the issues I identified in my prompt to help the model identify issues of a similar type.
I hoped that the model would use my provided error analysis as a reference for finding similar validation errors, as well as identify the other issues I already noticed.
The model found all of the issues I was hoping it would find, which illustrated to me that it was not entirely hallucinating. 
The model also identified a subtle issue with UTF-8 decoding and double equality, which I then investigated more in depth and reached the same conclusion.
The model gave correct outputs that were clear and non-hallucinatory, so I did not need to reprompt the model.

------------------------------------------------------------------------

# Coding Challenge (\~50 minutes)

For the below coding exercise, there is no expectation that you will
have a fully working solution. For anything you feel you didn't
accomplish, please let us know in the follow-up section after the
exercise.

## Exercise

Build a calculator web application. It should include a frontend piece
and any backend logic needed to perform the calculations.

You can use any language of your choosing for both the frontend and
backend code.

------------------------------------------------------------------------

## Follow-up questions

1.  How far were you able to get with the exercise?
I was able to make a fully functional backend in TypeScript and a minimal frontend in React
The backend implemented a recursive descent parser following a BNF spec under `./backend/parser.md` for computing expressions of simple mathematical expressions
The frontend logs histories of previous inputs and displays them on a screen.
2.  What challenges did you encounter in the process?
Most of the challenge of this app was trying to get the model to produce React code aligning with a visual specification.
However, it is difficult to translate visual ideas into text that a model can understand clearly.
Additionally, the model was trying to use TailwindCSS for a while, which I did not want as installing TailwindCSS is mildly annoying (from prior experience).
3.  If you were given unlimited time, what additional functionality
    would you include?
I would first fix all the visual bugs. Currently, the expanding history starts to push the other buttons off the screen, which is far from ideal.
Additionally, there appears to be a bug in the backend parser where negative numbers result in an error.
After these issues, I would try to include useful calculator functionality like an `Ans` button to reuse the previous answer obtained.
I could also try to add advanced features like matrix-matrix multiply, LU factorization, and other matrix operations.
Additionally, I could store custom functions generated by the user (represented as an Abstract Syntax Tree in the backend), and apply those functions on request.
4.  If you used AI, please include all of your prompts and answer the
    following questions:
    -   What did the AI do well?
    -   What did the AI do poorly?
    -   For the places it did poorly, how did you change your approach
        to your prompts to improve its output?

The AI did very well on implementing the parsing logic in the backend. This is likely because I chose to write the language spec in Backus-Naur form (BNF).
This likely made it easier for the model to construct the parsing logic.
The AI did poorly on generating a proper front-end interface. For a while, the AI was using TailwindCSS even though it was not in my project.
I had to explicitly forbid it from using Tailwind. Even then, it made several graphical errors that I had to describe methodically each time.
To solve the Tailwind problem, I investigated the code it generated and realized it was using Tailwind constructs.
To fix graphical errors, I attempted to describe exactly what graphical errors I was getting, with moderate success.

------------------------------------------------------------------------

# Delivery

Please reply to the email you received with:

1.  Answers to any follow-up above.
2.  Any questions or thoughts you had on the exercise.
3.  A link to a public GitHub repository including your answer to the
    coding challenge.
    -   If we can't get to the repository, we won't be able to consider
        your answer to the coding challenge.
