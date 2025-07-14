# Escalation Matrix Process Flow

This document outlines the complete escalation workflow for both AI-detected critical insights and user-submitted concerns. You can copy and paste the `mermaid` code blocks into a Mermaid.js viewer (like the one in VS Code or online) to see the visual chart.

## Path 1: AI-Detected Critical Insight from 1-on-1

This flow is triggered automatically when the AI analysis of a 1-on-1 session identifies a `criticalCoachingInsight`.

```mermaid
graph TD
    subgraph "Initiation"
        A[AI analyzes 1-on-1 session] --> B(Finds Critical Insight?);
        B -- Yes --> C[Creates 'Critical Insight' Case];
        B -- No --> End1[End of Flow];
    end

    subgraph "Level 1: Supervisor (Team Lead)"
        C --> D{Status: 'Pending Supervisor Action'};
        D --> E[Supervisor addresses insight and responds];
    end

    subgraph "Level 2: Employee Acknowledgement"
        E --> F{Status: 'Pending Employee Acknowledgement'};
        F --> G{Employee satisfied?};
        G -- Yes --> H([Resolve Case]);
    end

    subgraph "Level 3: AM Review"
        G -- No --> I{Status: 'Pending AM Review'};
        I --> J{AM Action};
        J -- Coach Supervisor --> K[Status: 'Pending Supervisor Retry'];
        J -- Address Employee Directly --> L[Status: 'Pending Employee Acknowledgement'];
    end

    subgraph "Level 4: Supervisor Retry & Final Employee Ack"
        K --> M[Supervisor re-engages and responds];
        M --> L;
        L --> N{Employee satisfied?};
        N -- Yes --> H;
    end
    
    subgraph "Level 5: Manager Review"
         N -- No --> O{Status: 'Pending Manager Review'};
         O --> P[Manager provides resolution];
         P --> Q{Status: 'Pending Employee Acknowledgement'};
         Q --> R{Employee satisfied?};
         R -- Yes --> H;
    end

    subgraph "Level 6: HR Review"
        R -- No --> S{Status: 'Pending HR Review'};
        S --> T[HR provides final resolution];
        T --> U{Status: 'Pending Employee Acknowledgement'};
        U --> V{Employee satisfied?};
        V -- Yes --> H;
    end

    subgraph "Level 7: Final HR Disposition"
        V -- No --> W{Status: 'Pending Final HR Action'};
        W --> X[HR makes final disposition];
        X -- Assign to Ombudsman --> Y([Close: Ombudsman]);
        X -- Assign to Grievance Office --> Z([Close: Grievance]);
        X -- Log & Close --> AA([Close: Dissatisfaction Logged]);
    end

    classDef endPoint fill:#bbf7d0,stroke:#22c55e,stroke-width:2px;
    class H,Y,Z,AA endPoint;
```

## Path 2: User-Submitted Concern Escalation

This flow starts when a user submits an identified concern or escalates an anonymous one. The entry point here assumes a manager has already responded to a case and the employee is not satisfied.

```mermaid
graph TD
    subgraph "Initiation"
        A[User submits identified concern OR an anonymous case is escalated] --> B{Manager/TL responds};
    end

    subgraph "Level 1: Employee Acknowledgement"
        B --> C{Employee satisfied?};
        C -- Yes --> D([Case Resolved]);
    end

    subgraph "Level 2: Escalation to Next Level"
        C -- No --> E{Escalate to Next Managerial Level};
        E --> F[Manager responds];
        F --> G{Employee satisfied?};
        G -- Yes --> D;
    end

    subgraph "Level 3: Escalation to HR"
        G -- No --> H{Status: 'Pending HR Action'};
        H --> I[HR investigates and responds];
        I --> J{Employee satisfied?};
        J -- Yes --> D;
    end

    subgraph "Level 4: Final Disposition (Retaliation Path)"
        J -- No, and it was a Retaliation Claim --> K{HR makes final disposition};
        K --> L([Case Closed]);
    end
    
    classDef endPoint fill:#bbf7d0,stroke:#22c55e,stroke-width:2px;
    class D,L endPoint;
```
