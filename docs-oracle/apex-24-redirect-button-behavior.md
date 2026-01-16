---
id: apex-24-redirect-button-behavior
title: "Fix: Global JS Timer Firing on Redirect Buttons in APEX 24.2"
sidebar_label: "APEX 24.2 Button Behavior"
description: "Documenting changes in button markup and event handling from APEX 23.1 to 24.2 causing global JS triggers."
tags: [oracle-apex, javascript, upgrade, 24.2, csp]
---

After upgrading from Oracle APEX 23.1 to 24.2, I noticed a change in behavior with my Global JavaScript. 

**The Issue:** In APEX 23.1, a global JavaScript function (used to show a "processing" timer) logic was only triggered by **Submit** hot-buttons. After upgrading to 24.2, clicking **Redirect** hot-buttons started triggering the global timer code unexpectedly.

## The Root Cause: CSP & Event Handlers

The change is due to APEX 24.2 removing inline JavaScript to satisfy strict **Content Security Policy (CSP)**.

:::info Documentation 
For more details on the removal of inline JavaScript, refer to the [APEX 24.2 Release Notes on Changed Behavior](https://docs.oracle.com/en/database/oracle/apex/24.2/htmrn/changed-behavior.html#GUID-5C47F12C-706D-45CF-8AB9-F16915926B64).
:::  

### APEX 23.1 (Inline Handler)
In version 23.1, redirect buttons typically used an **inline `onclick` attribute**.
* **Mechanism:** `onclick="apex.navigation.redirect(...)"`
* **Behavior:** The inline handler executes *immediately* upon click (DOM Level 0). It often navigates the browser away or hijacks the execution flow before global jQuery event listeners (bubbling up to `document`) have a chance to run or render the UI.

> **Reference:** You can observe the old behavior in the [Universal Theme 23.1 Demo App](https://oracleapex.com/ords/r/apex_pm/ut231/page-drawer).

### APEX 24.2 (Bound Event Listener)
In version 24.2, inline JavaScript is stripped to satisfy CSP rules.
* **Mechanism:** The HTML is clean (`<button class="t-Button...">`). The redirect logic is attached via a **bound event listener** by the APEX framework at runtime.
* **Behavior:** The click event is treated as a standard DOM event. It bubbles up to the `document` level. Since both the APEX redirect listener and my global custom listener are standard events, my global code now "sees" the click and executes the timer logic before the redirect occurs.

## Code Comparison

**APEX 23.1 HTML (Inline - Hijacks Event)**
```html
<button 
    onclick="apex.navigation.redirect('f?p=...')" 
    class="t-Button t-Button--hot" 
    type="button">
    Redirect
</button>

```

**APEX 24.2 HTML (Clean - Bubbles Event)**

```html
<button 
    class="t-Button t-Button--hot" 
    type="button">
    Redirect
</button>

```

## The Solution: Use `apexbeforepagesubmit`

Instead of trying to filter specific button types or classes, the most robust fix is to change *when* the timer triggers. 

By switching the event listener from a generic **Click** event to the specific **APEX Page Submit** event, we ensure the timer only runs during actual form submissions (Processing), completely ignoring Redirects (Navigation).

### Implementation Approach

Use the `apexbeforepagesubmit` event in your global JavaScript (Page 0) file. This event is broadcast by the APEX engine specifically when a page submission is initiated.

```javascript
/**
 * Setup Global Timer
 * Binds to the APEX submit event instead of button clicks.
 * This naturally excludes "Redirect" buttons as they do not trigger a page submit.
 */
window.setupGlobalTimer = function() {
    
    // Optional: Add logic to exclude specific pages if necessary
    // const pageId = $v('pFlowStepId');
    // if (pageId === '1') return;

    // 1. Unbind previous namespaces to prevent duplicate listeners
    // 2. Bind to the 'apexbeforepagesubmit' event
    apex.jQuery(document).off('apexbeforepagesubmit.globalTimer')
                         .on('apexbeforepagesubmit.globalTimer', function() {
        
        console.log("Page is submitting. Starting timer...");
        initializeTimer();
        
    });
};

```
 
### Why this works

1. **Ignores Redirects:** Clicking a "Redirect" button performs a navigation (`window.location`), which **does not** fire the `apexbeforepagesubmit` event. The timer code is never reached.
2. **Captures Submits:** Clicking a "Submit" button (or using `apex.submit()`) triggers the APEX submission flow, firing this event reliably.
3. **Future Proof:** This approach relies on the APEX JS API lifecycle rather than specific HTML classes or DOM structures, making it resilient to future theme updates. 

:::tip Best Practice
Always use namespaced events (e.g., `.on('apexbeforepagesubmit.myNamespace')`) when adding global listeners. This allows you to safely `.off()` your specific listener without removing other important APEX events.
:::

 