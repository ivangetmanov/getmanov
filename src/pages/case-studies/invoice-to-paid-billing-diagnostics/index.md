---
layout: ../../../layouts/BaseLayout.astro
title: "Diagnosing Invoice-to-Paid Constraints in a Legacy Billing System"
description: "A deep diagnostic of payment execution failures in a legacy billing architecture revealed how invoice state logic constrained monetization despite strong purchase intent."
canonical: "https://getmanov.com/case-studies/invoice-to-paid-billing-diagnostics/"
---

# Diagnosing Invoice-to-Paid Constraints in a Legacy Billing System

## 1. Why the Payment Layer Became the Focus

After funnel compression (14 -> 6 steps), users were:

- registering
- selecting licenses
- clicking `Pay`
- generating invoices

Important clarification:

In self-service, an invoice is created at the exact moment the user clicks `Pay`.

Invoice creation therefore represents confirmed purchase intent.

At this stage, three demand-side hypotheses were already deprioritized:

- traffic quality
- pricing rejection
- lack of intent

The remaining question was:

Why do users create invoices but fail to transition into a paid state?

The payment layer became the primary diagnostic surface.

## 2. Aggregate Invoice-to-Paid Pattern

Across the observation period:

- 307 recorded payment attempts
- 27 successful payment executions
- 259 invoice states remained `ordered`
- 63 accounts attempted payment more than once
- 9 eventually succeeded
- 54 never transitioned to paid

Observed execution rate per recorded attempt:

8.8% (27 / 307)

Important clarification:

We are not observing bank-level failed transactions.

We are observing invoice states that did not transition into paid status.

The bottleneck is state transition, not confirmed provider rejection.

![Observed invoice-to-paid transition by billing status](/images/case-studies/invoice-to-paid-billing-diagnostics/invoice-to-paid-by-status.webp)

## 3. Retry Behavior: Strong Intent Signal

From attempt-level analysis:

- 63 unique accounts made multiple attempts
- A subset retried 2-3+ times
- 54 accounts retried but never reached paid state

Retry behavior is a strong intent signal.

Users did not abandon after the first unsuccessful execution.

This eliminates:

- accidental clicks
- curiosity traffic
- superficial engagement

Intent was present.

Execution was constrained.

![Retry behavior breakdown](/images/case-studies/invoice-to-paid-billing-diagnostics/retry-behavior-breakdown.webp)

## 4. Status-Level Breakdown: State Machine Constraint

Payment attempts clustered heavily in a specific invoice status:

- Status `ordered` -> 0% transition to paid
- Statuses `active` / `stopped` -> high transition probability

What `ordered` represents:

- invoice created
- `Pay` clicked
- execution path not observable in billing
- no provider callback stored

This indicates:

UI permitted invoice creation, but billing state eligibility did not consistently allow payment execution.

This is not UX friction.

This is state machine misalignment.

## 5. Payment Method Layer (Interpreted Carefully)

When invoice state allowed execution and method-level signals were observable:

- Visa / Mastercard -> successful cases
- PayPal -> successful cases
- Crypto -> successful cases
- Skrill -> successful cases

Billing does not store provider-level approval telemetry.

Therefore:

When invoice state eligibility allowed execution, transactions were successfully processed across multiple providers.

No evidence suggests a single payment provider was the dominant constraint.

The dominant constraint sits in invoice state logic.

## 6. Time Pattern (Lag Analysis)

From time-based analysis:

- Payment attempts occurred shortly after invoice creation
- No prolonged delay pattern typical of reconsideration
- Retries occurred within short windows

Interpretation:

Users were attempting execution, not evaluating price.

## 7. Segment and Amount Validation

From financial segmentation:

- Average B2C invoice: ~EUR 99
- Multi-year licenses were attempted
- Larger invoices also remained in `ordered` state
- No correlation between invoice size and transition probability

This excludes:

- price-driven rejection
- low-quality user bias
- only small-check failure hypothesis

Transition probability was state-dependent, not price-dependent.

## 8. Structural Diagnosis

The billing engine relied on legacy state transitions originally designed for sales-led workflows.

In a sales-driven model:

- Managers manually adjusted states
- Edge cases were corrected operationally
- Broken transitions remained hidden

Self-service removed that buffer.

The system became observable.

Key constraint:

Invoice state logic was not fully aligned with browser-first payment flow.

## 9. Why This Is a Growth Constraint

This is not merely a billing issue.

It is a growth constraint because it:

- blocks monetization despite validated intent
- distorts funnel interpretation
- misguides acquisition strategy
- creates false demand conclusions

If misdiagnosed, typical reactions would include:

- increasing traffic
- adjusting pricing
- redesigning landing pages

While the constraint resides in billing state architecture.

## 10. What the Experiment Demonstrated

The deep dive ruled out:

- Primary traffic constraint
- Primary pricing constraint
- Weak demand hypothesis
- Confirmed provider-level rejection as dominant cause (telemetry unavailable)

It validated:

- Strong purchase intent exists
- Invoice creation is a reliable intent signal
- Invoice-to-paid state transition is constrained
- Growth scalability depends on billing architecture

The experiment did not fail.

It revealed the structural boundary limiting self-service monetization.

## 11. Strategic Implication

The correct next investments:

- Simplify billing state eligibility
- Make invoice-to-paid transitions deterministic
- Monitor invoice -> paid by status
- Isolate payment execution from legacy cabinet dependencies

Until state logic is stabilized:

Scaling acquisition amplifies structural leakage.
