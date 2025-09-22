---
id: sqlMacro-vs-global-ctx
title: SQL Macros vs Global Context 
sidebar_position: 4
--- 

### SQL Macros vs Global Context 

Quick comparison of SQL Macros and using Global Application Context

#### What They Are

-   **SQL Macros** are functions defined with `SQL_MACRO` that return SQL text fragments (table or scalar). When you invoke them, Oracle expands them into the outer SQL so optimizer can see the full query. [livesql.oracle.com](https://livesql.oracle.com/ords/livesql/file/tutorial_KQNYERE8ZF07EZMRR6KJ0RNIR.html)
    
-   **Global Application Context** is an Oracle mechanism to store session/user/tenant-scoped key/value pairs (attributes) that can be set via `DBMS_SESSION.SET_CONTEXT` (in a trusted package), accessed via `SYS_CONTEXT(namespace, attribute)`, and optionally cleared. It works globally (SGA) when created with `ACCESSED GLOBALLY`. (Oracle docs “Create Context” & “Using Application Contexts”).
    

#### Capabilities  

| Item | SQL Macros | Global Context |
| ---|---|---| 
| **Where you can use it** | In SELECT list, WHERE, ORDER BY. Table macros (FROM clause) only in newer versions (21c+). | Anywhere you can call a function. Commonly in WHERE clauses or views. |
| **Reusability** | Good for repeating logic inside queries. | Good for applying the same filter across many queries. |
| **Visibility to optimizer** |SQL text changes with macro parameters → may lead to less cursor sharing if parameters embed new literals. On the other hand, optimizer gets full visibility.|SQL text stays stable; parameters via context → better share-able SQL across sessions or requests.|
| **Setup effort** | Simple: just create the macro function. | More steps: create context, trusted package, and initialization logic. |
| **Works in APEX with Ajax/pooling** | Limited. Parameters are tied to each query. | Strong. Context values survive across requests if set per client id. |
| **Constraints** | - Must compile with object references in place. <br> - Cannot be nested easily. <br> - In 19c only scalar macros exist, no table macros. | - Must set and clear values carefully to avoid leaks. <br> - Needs `CLIENT_IDENTIFIER` to link values. <br> - Values are case sensitive. |
| **Best for** | Reusable expressions, common filter fragments. | Per-user or per-session filters, multi-tenant apps, APEX with pooled DB sessions. |
