---
id: sqlMacro-vs-global-ctx
title: SQL Macros vs Global Context
description: Side-by-side comparison of SQL Macros and Global Application Context for parameterizing Oracle queries in APEX.
sidebar_position: 4
tags: [oracle, apex, sql-macros, global-context, comparison]
---

# SQL Macros vs Global Context  

## What They Are

- **SQL Macros** are functions defined with `SQL_MACRO` that return SQL text fragments. Oracle expands them inline into the outer query so the optimizer sees the full SQL. ([livesql.oracle.com](https://livesql.oracle.com/ords/livesql/file/tutorial_KQNYERE8ZF07EZMRR6KJ0RNIR.html))

- **Global Application Context** stores session/user/tenant-scoped key/value pairs in the SGA. Set via `DBMS_SESSION.SET_CONTEXT` inside a trusted package, read via `SYS_CONTEXT(namespace, attribute)`. Works globally when created with `ACCESSED GLOBALLY`. ([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/CREATE-CONTEXT.html))

## Capabilities

| Item | SQL Macros | Global Context |
|---|---|---|
| **Where you can use it** | SELECT list, WHERE, ORDER BY. Table macros (FROM clause) require 21c+. | Anywhere a function is valid — commonly in WHERE clauses and views. |
| **Reusability** | Good for repeating logic inside a single query. | Good for applying the same filter across many queries and views. |
| **Optimizer visibility** | SQL text changes per parameter → less cursor sharing, but optimizer sees full query. | SQL text stays stable → better cursor sharing across sessions and requests. |
| **Setup effort** | Low — create the macro function. | Higher — create context, trusted package, and APEX init/cleanup hooks. |
| **Works in APEX w/ Ajax / pooling** | Limited — parameters are tied to each individual query. | Strong — context values persist across requests when keyed by `CLIENT_IDENTIFIER`. |
| **Constraints** | Must compile with object references in place; no nesting; 19c is scalar-only (no table macros). | Must set/clear values carefully to avoid leaks; attribute names are case-sensitive. |
| **Best for** | Reusable query expressions and common filter fragments. | Per-user or per-session filters, multi-tenant apps, APEX with pooled DB sessions. |

## When to Use Each

:::tip Use SQL Macros when...
- Need to reuse a query fragment (e.g., a common WHERE clause) across multiple queries.
- On Oracle 21c+ and want table-level parameterization.
- Parameters change per-query and you are not in a pooled APEX session context.
:::

:::tip Use Global Context when...
- APEX app with pooled DB connections and Ajax.
- Need the same filter applied consistently across multiple views and queries for the same user session.
- Need multi-tenant row-level filtering (VPD-style).
::: 