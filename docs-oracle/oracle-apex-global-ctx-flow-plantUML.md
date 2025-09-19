---
id: oracle-apex-global-ctw-plantuml
title: Oralce APEX Global CTX Process Diagram
sidebar_position: 2
--- 

# PlantUml Flow: APEX request setting and using a GLOBAL application context

```PlantUML
@startuml

title APEX request setting and using a GLOBAL application context

actor User as U
participant "APEX Page Request\n(Browser)" as B
participant "APEX Engine\n(App Builder runtime)" as A
participant "DB Session\n(V$SESSION.CLIENT_IDENTIFIER)" as S
participant "APPS.test_app_ctx_helper_pkg" as P
database "GLOBAL_CONTEXT\n(SGA, keyed by CLIENT_IDENTIFIER)" as G

== Request lifecycle ==
U -> B: Navigate / Submit page
B -> A: HTTP request (Show/Accept)
activate A

A -> S: Initialization PL/SQL runs\n(after APP_USER established)
note right of S
APEX init block executes early per request
APEX 23.1 Dev Guide: Security Attributes → Database Session
end note

== Key steps to enable GLOBAL context visibility ==
A -> S: DBMS_SESSION.SET_IDENTIFIER(:APP_USER or custom)
S -> P: P.set_parameter_value(client_id, attr, val)
activate P
P -> S: DBMS_SESSION.SET_CONTEXT(\n  namespace=>'TEST_APP_CTX',\n  attribute=>attr,\n  value=>val,\n  username=>NULL,\n  client_id=>client_id)
P -> G: Store/associate attr=val for client_id
deactivate P

== App logic can read ==
A -> S: SELECT SYS_CONTEXT('TEST_APP_CTX','attr') FROM dual;
S --> A: value
A -> S: SELECT * FROM GLOBAL_CONTEXT;
S --> A: rows visible for current CLIENT_IDENTIFIER

== Response ==
A --> B: Render page/JSON
deactivate A

== Cleanup at end of request ==
A -> S: Cleanup PL/SQL runs
S -> P: P.clear_ctx(client_id)
activate P
P -> G: DBMS_SESSION.CLEAR_CONTEXT(namespace=>'TEST_APP_CTX',\n  client_identifier=>client_id)
P -> S: DBMS_SESSION.CLEAR_IDENTIFIER
deactivate P

@enduml
```