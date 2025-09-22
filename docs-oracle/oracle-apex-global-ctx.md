---
id: oracle-apex-global-ctw
title: Set and View Global Contexts in APEX and Oracle DB
sidebar_position: 2
--- 


<detail>Initial Draft, I have an issue where on the very first Page Subimt of run report, the parameter value from APEX page item isn't accessable, I suspect this is due to needing before to set context using Page header on the very first load of the page; Will add debug and behavior later, test in your app. </detail>

# Parameterized Views in Oracle 19c and APEX 23.1 Using **Global Application Context** 

## 1) Goal

Create a page/user-specific filters to apply across pooled DB sessions and Ajax requests. Use a **global application context** keyed by a canonical `client_id`. Query with `SYS_CONTEXT` in views or SQL, and set/clear context at each APEX request. 
**Note:** _Before Header_ and _After Regions_ processes **does not work** for pages' **Ajax** (no filter/sort/partial refresh) requests. For Ajax or mixed flows, use **Security Attributes → Database Session**. 
APEX docs specify per-request Initialization/Cleanup hooks; Before Header runs during page render only.



## 2) Why It Works

A global context stores attributes in the SGA and exposes them to a session based on `CLIENT_IDENTIFIER`. `SYS_CONTEXT` reads the attribute value; `DBMS_SESSION.SET_CONTEXT` writes it; `DBMS_SESSION.CLEAR_CONTEXT` removes it. APEX can run Initialization and Cleanup PL/SQL each request, so the same context applies to full submits and Ajax calls.  


## 3) Prereqs and Order of Creation

1.  Create the context **first** and bind it to the trusted package.
2.  Create the package that calls `DBMS_SESSION.SET_CONTEXT` and `CLEAR_CONTEXT`.
3.  (optional) Grant execute on the package to the APEX parsing schema.  
4.  Use a single `client_id` pattern: `:APP_USER || :APP_NAME`.  
    [Docs](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/CREATE-CONTEXT.html) note: only the package named in `CREATE CONTEXT ... USING` can set attributes.  

## 4) Create Context and Trusted Package

### 4.1 Context
```sql
CREATE OR REPLACE CONTEXT TEST_APP_CTX
	USING test_app_ctx_helper_pkg
	ACCESSED GLOBALLY;
```
`ACCESSED GLOBALLY` enables global scope; the bound package controls writes.

### 4.2 Trusted Package
```plsql
CREATE OR REPLACE PACKAGE APPS.test_app_ctx_helper_pkg AUTHID DEFINER AS
	PROCEDURE set_parameter_value(p_client_id IN VARCHAR2, p_attr IN VARCHAR2, p_val IN VARCHAR2);
	PROCEDURE clear_ctx(p_client_id IN VARCHAR2);
END test_app_ctx_helper_pkg;
/

CREATE OR REPLACE PACKAGE BODY APPS.test_app_ctx_helper_pkg AS
	PROCEDURE set_parameter_value(p_client_id IN VARCHAR2, p_attr IN VARCHAR2, p_val IN VARCHAR2) IS
	BEGIN
		DBMS_SESSION.set_context(namespace => 'TEST_APP_CTX', attribute  => UPPER(p_attr), value =>  p_val,  username => null, client_id => p_client_id);
	END;
	PROCEDURE clear_ctx(p_client_id IN VARCHAR2) IS
	BEGIN
		DBMS_SESSION.clear_context(namespace => 'TEST_APP_CTX', client_id => p_client_id, attribute => null);
	END;
END test_app_ctx_helper_pkg;
/ 
``` 
`SET_IDENTIFIER` ties visibility in `GLOBAL_CONTEXT` to the `client_id`. Also uses `client_id` named parameter in `CLEAR_CONTEXT`.   

## 5) APEX Integration (Init and Cleanup)

Put this once per application: **Shared Components → Security Attributes → Database Session**.

**Initialization PL/SQL Code** 
```plsql
-- Update XXX to actual page_id 
DECLARE  
  client_id VARCHAR2(64) := :APP_USER || ':AppName:XXX';
BEGIN
    IF :APP_PAGE_ID = XXX and :PXXX_SalaryIn IS NOT NULL THEN 
      test_app_ctx_helper_pkg.set_parameter_value(client_id,'P_SalaryIn',:PXXX_SalaryIn);
  END IF;  
EXCEPTION
    WHEN OTHERS THEN
        apex_application.g_notification := '*** APEX ERROR > Database Session|Initialization PL/SQL Code: '||SQLERRM; 
END;
```

**Cleanup PL/SQL Code** 
```plsql
-- Update XXX to actual page_id 
DECLARE
  client_id VARCHAR2(64) := :APP_USER || ':AppName:XXX';
BEGIN      
    test_app_ctx_helper_pkg.clear_ctx('client_id123');
    -- When no attribute is defined, all ctx for that client_id is cleared 
EXCEPTION 
    WHEN OTHERS THEN 
        apex_application.g_notification := '*** APEX ERROR > Database Session|Cleanup PL/SQL Code: '||SQLERRM;
END;
```

These attributes run at the start and end of every APEX request, including Ajax.  
 

## 6) Minimal Verification (DB, APEX Page, Ajax)

### 6.1 DB block 
```plsql
-- No other set up needed, use to test context and pkg. 
    BEGIN
        DBMS_OUTPUT.PUT_LINE('=== BEGIN ==='); 

        test_app_ctx_helper_pkg.set_parameter_value('client_id123','ATTRIBUTEIN','valueIN');
        DBMS_OUTPUT.PUT_LINE( SYS_CONTEXT('TEST_APP_CTX','ATTRIBUTEIN') );  
        
        FOR r IN (SELECT namespace, attribute, value FROM GLOBAL_CONTEXT) LOOP
          DBMS_OUTPUT.PUT_LINE(r.namespace||':'||r.attribute||'='||r.value);
        END LOOP;
        test_app_ctx_helper_pkg.clear_ctx('client_id123');

        DBMS_OUTPUT.PUT_LINE('==== END ====');
    END; 

    -- Expected DBMS Out
    -- === BEGIN ===
    -- valueIN
    -- TEST_APP_CTX:ATTRIBUTEIN=valueIN
    -- ==== END ====
``` 

### 6.2 Parameterized view + APEX page item

```sql
-- 
CREATE OR REPLACE VIEW Custom_HR_CTX_V AS
SELECT e.*
FROM   hr.employees e
WHERE  e.salary = TO_NUMBER(SYS_CONTEXT('TEST_APP_CTX','P_SALARY_IN')); 
```
Use the view in a Classic/IR region: `SELECT * FROM Custom_HR_CTX_V`. On report run or page submit should provide/save `P10_SALARY_IN`'s value in DB sessison.  

### 6.3 Ajax check 
Filter or Sort the Classic/IR region. The Initialization PL/SQL runs each Ajax request, so the same context value is read by the view. 

### 6.4 Execution Flow 
1.  **Page Submit** 
    -   APEX collects submitted items and request context. 
2.  **Init PL/SQL Code**
    -   Application logic runs at page submit or process level.
    -   Example: setting identifiers for correlation.
3.  **Set Context Values**
    -   `DBMS_SESSION.SET_IDENTIFIER` → assign `client_id`.
    -   `DBMS_SESSION.SET_CONTEXT` → assign `P10_Salary_In` = `clientValue`.
4.  **SQL Execution**
    -   APEX executes queries.
    -   Context-sensitive logic applied with `SYS_CONTEXT` lookups.
5.  **Filter from Global Context**
    -   Query predicates reference values in **application/global context**.
    -   Enforced in VPD, RLS, or explicit WHERE clauses.
6.  **Return Data to APEX**
    -   Results mapped back to APEX page items or regions.
7.  **Clean Up PL/SQL Code**
    -   Optional `DBMS_SESSION.CLEAR_CONTEXT` or reset of identifiers.
    -   Ensures no leakage across pooled sessions.


## 7) Performance and Simplification Note

`SYS_CONTEXT` is a SQL function and can be used in `WHERE` clauses and views. Apply normal indexing on filtered columns. Evaluate plan as usual with `EXPLAIN PLAN` or AWR tools. No Oracle claim of special behavior beyond standard predicate evaluation.  
 

## 8) Troubleshooting  
0. Use `SELECT * FROM V$GLOBALCONTEXT;` to view all Global Context in DB, can also inspect `CLIENT_IDENTIFIER` via `V$SESSION`.

1.  **ORA-01031** while setting context: ensure calls run **inside** the package named in `CREATE CONTEXT ... USING`. Create context first, then package. ([CREATE_CONTEXT Doc](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/CREATE-CONTEXT.html))
    
2.  **Not visible in `V$GLOBALCONTEXT`**: set `CLIENT_IDENTIFIER` (either in your setter or earlier in the request). ([GLOBAL_CONTEXT Doc](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/GLOBAL_CONTEXT.html))
    
3.  **Ajax didn’t pick up value**: put logic in **Security Attributes → Database Session → Initialization PL/SQL Code**, not in a page “Before Header” process. Before Header is only ran on Page Submit.  
4.  **Case sensitivity**: `client_id` and attribute names are case-sensitive where documented; use `UPPER` for attributes consistently.
5.  **Changing `CLIENT_IDENTIFIER` in APEX.**  [APEX Docs](https://docs.oracle.com/en/database/oracle/apex/24.1/htmdb/correlating-apex-sessions-to-database-sessions.html#GUID-3758CB03-6837-470E-A099-23387D9DC386), section D.2, client_info, paragraph 2:
`Within an APEX session, setting this attribute is not necessary and generally should be left unchanged. If custom PL/SQL code executed within an APEX session changes client_id, this change will not cause problems for Oracle APEX. However, it may affect the ability for some monitoring tools to effectively identify the APEX session.` 

## 9) References

-   **Global Application Context visibility**: _Database Reference 19c → GLOBAL_CONTEXT_. ([Oracle Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/GLOBAL_CONTEXT.html))
    
-   **Using Application Contexts**: _Security Guide 19c → Using Application Contexts_. ([Oracle Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/using-application-contexts-to-retrieve-user-information.html))
    
-   **DBMS_SESSION**: _PL/SQL Packages and Types 19c → DBMS_SESSION_ (`SET_CONTEXT`, `SET_IDENTIFIER`, `CLEAR_CONTEXT`). ([Oracle Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SESSION.html))
    
-   **CREATE CONTEXT**: _SQL Language Reference_ (context binding to package; global access). ([Oracle Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/CREATE-CONTEXT.html))
    
-   **SYS_CONTEXT**: _SQL Language Reference_ (function usage in SQL/PLSQL). ([Oracle Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/SYS_CONTEXT.html))
    
-   **APEX request hooks**: _APEX 23.1 Dev Guide → Configuring Security Attributes → Database Session_. ([Oracle Documentation](https://docs.oracle.com/en/database/oracle/apex/23.1/htmdb/configuring-security-attributes.html))
    
-   **APEX session correlation**: _APEX 24.1 Dev Guide → Correlating APEX Sessions to Database Sessions_. ([Oracle Documentation](https://docs.oracle.com/en/database/oracle/apex/24.1/htmdb/correlating-apex-sessions-to-database-sessions.html)) 