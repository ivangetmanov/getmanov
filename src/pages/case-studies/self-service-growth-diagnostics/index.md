---
layout: ../../../layouts/BaseLayout.astro
title: "Rebuilding Self-Service in a Legacy B2B SaaS Infrastructure"
description: "How rebuilding a browser-first self-service flow exposed architectural constraints inside a legacy billing system and revealed why monetization must be fixed before scaling acquisition."
canonical: "/case-studies/self-service-growth-diagnostics/"
---

# Rebuilding Self-Service in a Legacy B2B SaaS Infrastructure

## 1. Context

The company operated in a legacy B2B SaaS environment:

- Hosting infrastructure product
- Strong CIS market position
- EU billing entity
- Historically sales-led acquisition model

Self-service was introduced as a growth experiment.

Not as a revenue channel.

The goal was diagnostic:

Can confirmed demand convert without manual sales intervention?

## 2. Initial Constraint

The original flow was cabinet-driven and fragmented:

- Trial request via form
- Email confirmation
- Cabinet login
- Manual activation steps
- Trial expiration
- Separate commercial purchase path
- Multiple billing states
- VAT inconsistencies
- Repeated credential friction

The journey required 10-14 steps before reaching payment.

Friction was structural, not cosmetic.

![Legacy monetization architecture vs unified self-service flow](/images/case-studies/self-service-growth-diagnostics/legacy-vs-unified-self-service.webp)

## 3. System Redesign

The self-service layer was rebuilt around three principles.

### 1. Browser-first logic

License creation and invoice visibility moved outside cabinet-only context.

### 2. Deterministic payment trigger

Invoice is created strictly at the moment the user clicks `Pay`.

Invoice creation = confirmed purchase intent.

### 3. Reduced state branching

Minimize dependency on legacy billing states during early flow.

Implemented changes:

- 14 -> 6 screen compression
- Trial friction removal
- Auto-login after registration
- Embedded pricing in flow
- Reduced billing form fields
- VAT inconsistency fix
- License issuance moved behind the flow
- Purchase allowed without installation

The system shifted:

Cabinet-first -> Browser-first.

## 4. Observable Impact

Over the experiment period:

- 413 accounts registered
- 182 accounts created at least one invoice
- 25 unique accounts transitioned to paid
- 2 of those generated additional recurring payments

Payment layer activity:

- 307 recorded payment attempts
- 27 successful payment executions across 25 unique accounts
- 259 invoice states remained `ordered` and did not transition to paid
- 63 accounts attempted payment more than once
- 9 eventually succeeded
- 54 never transitioned to paid

Funnel breakdown:

- Registration -> Invoice creation: 44.1% (182 / 413)
- Invoice -> Paid transition: 13.7% (25 / 182)
- Registration -> Paid overall: 6.1% (25 / 413)

Invoice creation was not the bottleneck.

The bottleneck was the invoice-to-paid state transition.

![Self-service funnel: registered, invoice created, paid](/images/case-studies/self-service-growth-diagnostics/self-service-funnel.webp)

## 5. What Was Eliminated

Because invoice creation happens only after clicking `Pay`, the following were ruled out as primary constraints:

- Traffic insufficiency
- Lack of demand
- Pricing visibility issue
- Pure UX friction

Intent was observable and measurable.

## 6. The Real Constraint

Deep analysis revealed:

- State-level inconsistencies inside billing
- Non-deterministic invoice eligibility
- Legacy logic originally designed for sales-led correction
- Structural misalignment between UI flow and billing state machine

Self-service exposed what manual intervention previously absorbed.

The constraint was architectural.

Not marketing.

Not pricing.

Not traffic.

## 7. Why This Matters

Scaling acquisition on unstable billing logic would:

- Increase invoice creation without proportional revenue
- Distort funnel analytics
- Trigger incorrect pricing experiments
- Lead to misattributed growth hypotheses

Growth was limited by infrastructure.

## 8. Strategic Outcome

The experiment achieved its diagnostic goal:

- Validated real purchase intent without sales
- Identified invoice-to-paid state breakdown
- Established invoice creation as a reliable intent signal
- Clarified the boundary between UX friction and billing architecture

Self-service became an observability layer over legacy billing.

## 9. Why Billing Must Be Fixed Before Scaling Acquisition

Self-service was not launched to generate large revenue.

It was launched to test whether demand could convert without sales.

The experiment confirmed demand.

But it also exposed revenue leakage.

During the 4-month self-service period:

- EUR 26k total invoice value generated
- ~EUR 2k successfully collected
- Execution rate: ~8%

In a stable SaaS setup, invoice-to-paid conversion typically ranges between 35-50%.

If the same EUR 26k invoice volume converted within that range, collected revenue would be:

EUR 9k-EUR 13k

This means:

EUR 7k-EUR 11k unrealized revenue, excluding renewals and future LTV.

This shows a monetization leakage.

Importantly, self-service represented only a very small share of total company revenue (~0.2%).

However, self-service created a uniquely observable environment where payment-state failures became measurable without sales-assisted correction.

This suggested that similar monetization leakage could potentially exist beyond the self-service experiment itself, partially hidden inside broader operational and sales-supported workflows.

Adding more traffic would not solve it.

### Structural Implication

If we increase traffic without fixing billing:

- More invoices will be created
- More payment attempts will fail
- More retries will happen
- More accounting noise will appear
- Revenue will not grow proportionally

In simple terms:

More traffic would increase failed payments.

### Strategic Sequence

Before scaling acquisition, monetization must be:

- Technically consistent
- Payable in all valid states
- Measurable at the payment level
- Free from structural blockers

Otherwise:

CAC grows.

Revenue does not.

## Executive Summary

The experiment did not show that self-service converts poorly.

It showed:

- Demand exists
- Users reach invoice creation
- Users attempt to pay
- Payment execution is blocked by billing state logic

The correct sequence is:

1. Fix invoice -> paid transition
2. Add payment-state telemetry
3. Remove structural leakage
4. Then scale acquisition

Growth is not only about increasing traffic.

It is about making sure traffic can turn into revenue.
