---
id: ebsR12-scheduled-concurrent-requests-checker
title: EBS R12.2.10, Query to get custom schduled Concurrent Requests
sidebar_position: 5
--- 

# Scheduled Concurrent Requests — Query Guide

## Purpose

Return active scheduled concurrent requests with human-readable schedule text plus last/next run metadata.

## Query
<details>
  <summary>Show Code</summary>

  ```sql
    WITH
      base AS ( -- Base Scheduled Concurrent Requests 
          SELECT
              r.request_id                   AS requestId,
              p.user_concurrent_program_name AS programName,
              r.description,
              s.user_name                    AS requester,
              c.class_type                   AS classType,
              c.class_info                   AS classInfo, 
              NVL(r.actual_completion_date, r.last_update_date) AS lastRunDate,   
              r.requested_start_date                            AS nextRunDate,  
              flvStatus.meaning                                 AS lastRunStatus
          FROM
              apps.fnd_concurrent_requests r
              JOIN apps.fnd_conc_release_classes c ON c.application_id = r.release_class_app_id
              AND c.release_class_id = r.release_class_id
              JOIN apps.fnd_concurrent_programs_tl p ON p.concurrent_program_id = r.concurrent_program_id
              JOIN apps.fnd_user s ON r.requested_by = s.user_id
              LEFT JOIN apps.fnd_lookup_values flvStatus
          ON flvStatus.lookup_type = 'CP_STATUS_CODE'
          AND flvStatus.lookup_code = r.status_code 
          AND NVL(flvStatus.enabled_flag,'Y') = 'Y' 
          AND flvStatus.start_date_active is not null 
          WHERE
              r.phase_code = 'P'
              AND NVL(c.date2, SYSDATE + 1) > SYSDATE
              AND c.class_type IS NOT NULL
              AND UPPER(NVL(r.description, p.user_concurrent_program_name)) LIKE 'NAME_PREFIX%'
      ),
      dates AS ( -- build day-of-month list once; correlate by requestId(key-preserved)
          SELECT
              b.requestId                               AS requestId,
              LISTAGG(TO_CHAR(lvl), ', ') WITHIN GROUP(
                  ORDER BY
                      lvl
              ) AS dates
          FROM
              base b
              CROSS JOIN(
                  SELECT
                      LEVEL AS lvl
                  FROM
                      dual CONNECT BY LEVEL <= 31
              )
          WHERE
              b.classType = 'S'
              AND SUBSTR(b.classInfo, lvl, 1) = '1'
          GROUP BY
              b.requestId
      )
  SELECT
      b.requestId,
    NVL2(b.description, b.description || ' (' || b.programName || ')', b.programName) concProg,
      b.requester,
  --    b.classType,
  --    b.classInfo,
    lastRunDate,   
    nextRunDate,  
    lastRunStatus,
      DECODE(b.classType, 
        'P', 'Periodic', 
        'S', 'On Specific Days', 
        'X', 'Advanced', b.classType
    ) AS scheduleType,
      CASE
          WHEN b.classType = 'P' THEN -- decode interval:unit:mode
            'Repeat every ' || SUBSTR(b.classInfo, 1, INSTR(b.classInfo, ':') - 1) || 
        DECODE( SUBSTR( b.classInfo, INSTR(b.classInfo, ':', 1, 1) + 1, 1), 
          'N', ' minutes', 
          'H', ' hours', 
          'D', ' days', 
          'M', ' months'
        ) 
        || DECODE( SUBSTR( b.classInfo, INSTR(b.classInfo, ':', 1, 2) + 1, 1), 
          'S', ' from the start of the prior run', 
          'C', ' from the completion of the prior run'
        )
      WHEN b.classType = 'S' THEN -- specific days
        NVL2(d.dates, 'Dates: ' || d.dates, NULL)                    -- explicit dates
        || DECODE(SUBSTR(b.classInfo, 32, 1), '1', 'Last day of month ')
        -- DOW summary first; if not daily/weekday, fall back to verbose list
        || NVL(
          DECODE(SUBSTR(b.classInfo, 33, 7),
              '1111111', 'Daily',
              '0111110', 'Every weekday',
              NULL),
          DECODE(
            SIGN(INSTR(SUBSTR(b.classInfo, 33, 7), '1')),
            1,
            'Days of week: '
            || DECODE(SUBSTR(b.classInfo, 33, 1), '1', 'Su ')
            || DECODE(SUBSTR(b.classInfo, 34, 1), '1', 'Mo ')
            || DECODE(SUBSTR(b.classInfo, 35, 1), '1', 'Tu ')
            || DECODE(SUBSTR(b.classInfo, 36, 1), '1', 'We ')
            || DECODE(SUBSTR(b.classInfo, 37, 1), '1', 'Th ')
            || DECODE(SUBSTR(b.classInfo, 38, 1), '1', 'Fr ')
            || DECODE(SUBSTR(b.classInfo, 39, 1), '1', 'Sa ')
          )
        )
        -- Weeks of month: include only if some but not all weeks selected
        || DECODE(SUBSTR(b.classInfo, 40, 5),
            '00000', NULL,
            '11111', NULL,
            NULL, NULL,
            'Weeks: '
            || DECODE(SUBSTR(b.classInfo, 40, 1), '1', '1st ')
            || DECODE(SUBSTR(b.classInfo, 41, 1), '1', '2nd ')
            || DECODE(SUBSTR(b.classInfo, 42, 1), '1', '3rd ')
            || DECODE(SUBSTR(b.classInfo, 43, 1), '1', '4th ')
            || DECODE(SUBSTR(b.classInfo, 44, 1), '1', '5th ')
        )
        -- Months 
        || NVL(
          DECODE(SUBSTR(b.classInfo, 45, 12), 
          '111111111111', ', Every Month'
          ),
                  DECODE(
                      SIGN(INSTR(SUBSTR(b.classInfo, 45, 12), '1')), 1,
                      'in ' || TRIM(BOTH ' ' FROM
                            DECODE(SUBSTR(b.classInfo, 45, 1), '1', 'Jan ', '')
                          || DECODE(SUBSTR(b.classInfo, 46, 1), '1', 'Feb ', '')
                          || DECODE(SUBSTR(b.classInfo, 47, 1), '1', 'Mar ', '')
                          || DECODE(SUBSTR(b.classInfo, 48, 1), '1', 'Apr ', '')
                          || DECODE(SUBSTR(b.classInfo, 49, 1), '1', 'May ', '')
                          || DECODE(SUBSTR(b.classInfo, 50, 1), '1', 'Jun ', '')
                          || DECODE(SUBSTR(b.classInfo, 51, 1), '1', 'Jul ', '')
                          || DECODE(SUBSTR(b.classInfo, 52, 1), '1', 'Aug ', '')
                          || DECODE(SUBSTR(b.classInfo, 53, 1), '1', 'Sep ', '')
                          || DECODE(SUBSTR(b.classInfo, 54, 1), '1', 'Oct ', '')
                          || DECODE(SUBSTR(b.classInfo, 55, 1), '1', 'Nov ', '')
                          || DECODE(SUBSTR(b.classInfo, 56, 1), '1', 'Dec ', '')
                  ) || '.',
                  ', Every Month'
          )
        )
        /* Sample Data:  
          classInfo: 0000000000000000000000000000000 0 0111110							Schedule: Days of week: Mo Tu We Th Fr, will run for all weeks/months if not defined. 
          classInfo: 0000000000000000000000000000000 0 1111111 11111 111111111111			Schedule: Days of week: Su Mo Tu We Th Fr Sa 
                Date of Month | LDOM  | Day of Week | Week of Month | Month 
        */	
      END AS schedule
  FROM
      base b
      LEFT JOIN dates d ON d.requestId = b.requestId
  ORDER BY
      b.description;
  ```
</details>

## Output columns

* `requestId`
* `concProg` — `description (programName)` if description exists then it's a request set, else `programName`
* `requester`
* `lastRunDate` — `NVL(actual_completion_date, last_update_date)`
* `nextRunDate` — `requested_start_date`
* `lastRunStatus` — decoded `CP_STATUS_CODE` meaning
* `scheduleType` — `Periodic | On Specific Days | Advanced | <raw>`
* `schedule` — narrative built from `classInfo`

## Data sources and joins

* `FND_CONCURRENT_REQUESTS r`
* `FND_CONC_RELEASE_CLASSES c` on release class
* `FND_CONCURRENT_PROGRAMS_TL p`
* `FND_USER s`
* `FND_LOOKUP_VALUES flvStatus` for `CP_STATUS_CODE` meaning

> Language and enablement are respected in the status join; only enabled, dated rows with a start date present are used.

## Filtering

* `r.phase_code = 'P'` - scheduled in manager 
* `NVL(c.date2, SYSDATE + 1) > SYSDATE` — still valid
* `c.class_type IS NOT NULL` - have schedule 
* Name filter: `UPPER(NVL(r.description, p.user_concurrent_program_name)) LIKE 'PREFIX%'` 

## Dates CTE

`dates` emits a comma-separated list of day-of-month values when bits 1–31 are set.

```sql
SUBSTR(b.classInfo, lvl, 1) = '1'  -- char compare, no numeric conversion
LISTAGG(TO_CHAR(lvl), ', ')        -- ordered, compact
```

## `classInfo` layout (Type `S`)

* Bits **1–31**: specific days of month
* Bit **32**: last day of month
* Bits **33–39**: days of week `Su..Sa`
* Bits **40–44**: week-of-month `1st..5th`
* Bits **45–56**: months `Jan..Dec`

Stored and processed as **VARCHAR2**. The query never casts to number, so leading zeros are preserved.

### Common pitfall avoided

“first day shows as 16”: caused by numeric coercion on a binary-like string. This query uses `SUBSTR(...)= '1'` everywhere and `INSTR(...,'1')` on character data, so no loss of leading zeros and no misreads.

## Schedule text logic

### `classType = 'P'` (Periodic)

`interval:unit:mode`

* `unit`: `N|H|D|M` → minutes|hours|days|months
* `mode`: `S|C` → from start|from completion
* Output: `Repeat every <n> <unit> <anchor>`

### `classType = 'S'` (Specific Days)

Order of assembly:

1. **Explicit dates**: if any of bits 1–31, output `Dates: 1, 5, 20` etc.
2. **Last day**: if bit 32 set, append `Last day of month`.
3. **Day-of-week summary**:

   * If bits 33–39 = `1111111` → `Daily`
   * If bits 33–39 = `0111110` → `Every weekday`
   * Else if any DOW bit set → `Days of week: Su Mo ...`
4. **Weeks of month**:

   * If bits 40–44 are **some but not all** → `Weeks: 1st 3rd ...`
   * If `00000` or `11111` → omit (runs every week or none specified)
5. **Months**:

   * If bits 45–56 = `111111111111` → `, Every Month`
   * Else if any set → `in Jan Feb ...`
   * Else (none set) → treated as every month via NVL default `, Every Month`

All pieces concatenate in a single `CASE` using `DECODE`, `NVL`, and `NVL2`, with minimal whitespace trimming.

## Performance notes

* Early `WHERE` filters in `base` cut rows before decoding.
* `dates` CTE uses a single `CONNECT BY LEVEL <= 31` cross join and `LISTAGG`; no row-by-row functions.
* Character operations (`SUBSTR`/`INSTR`) are cheap and avoid conversions.
* Status meaning joined once; no scalar subqueries.

## Extensibility

* To handle locale text, replace hard-coded day and month tokens with a small lookup CTE and `LISTAGG`.
* If duplicate status meanings appear (e.g., `@Normal`), wrap `FND_LOOKUP_VALUES_VL` with a `ROW_NUMBER()` filter to select one meaning per code.
  * or filter out the duplicated values using some metadata col from Lookup table
