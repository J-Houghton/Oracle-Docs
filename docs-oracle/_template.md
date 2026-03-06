---
# The id is the URL slug. It should be lowercase with dashes (no spaces or extensions).
id: exact-file-name-without-extension
# The title that appears at the top of the page and in the sidebar.
title: Template Page
# A short description for search engine optimization (SEO) and page previews.
description: A 1-2 sentence summary of what this page covers.
# Controls the order of the file within its category folder.
sidebar_position: 1
# Helps group related pages in the search and auto-generated tags page.
tags: [oracle, apex, template]
--- 

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PlantUML from '@site/src/components/plantUML';

# Your Page Title

Brief 1-2 sentence introduction. What does this page cover and why is it useful? Avoid jargon in the opening.

:::info Related
Link to related docs if applicable: [Related Page](./related-page-id)
:::

## Prerequisites

:::tip Setup Order
1. First step.
2. Second step.
3. *(Optional)* Optional step.
:::

## Main Section

Short paragraph with context (3-4 sentences max). Then code.

<Tabs>
  <TabItem value="tab1" label="Tab Label 1" default>

```sql
-- Code block with language specified
SELECT 1 FROM dual;
```

  </TabItem>
  <TabItem value="tab2" label="Tab Label 2">

```plsql
-- Second related code block
BEGIN
    NULL;
END;
```

  </TabItem>
</Tabs>

## Another Section

:::caution Watch Out
Highlight a common mistake or important warning here.
:::

## Verification

Short steps to confirm it works.

```sql
-- Quick test query
SELECT * FROM V$GLOBALCONTEXT;
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Error message | Root cause | How to fix |

## References

| Topic | Source |
|---|---|
| Doc title | [Oracle Documentation](https://docs.oracle.com) |

<details className="codeDetails">
  <summary>Deep Dive</summary>

### Extended Detail Heading

Use this section for advanced notes, extended execution flows, or performance considerations that most readers can skip.

</details>
