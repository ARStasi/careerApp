"""Bulk load career data from roles-and-accomplishments.md into the app database."""
import requests
import sys

BASE = "http://localhost:8000/api"

def post(path, data):
    r = requests.post(f"{BASE}{path}", json=data)
    r.raise_for_status()
    return r.json()

def put(path, data):
    r = requests.put(f"{BASE}{path}", json=data)
    r.raise_for_status()
    return r.json()

def main():
    # ---- Profile ----
    print("Loading profile...")
    put("/profile", {
        "name": "Andrew Stasi",
        "email": "andrew.stasi@gmail.com",
        "phone": "602-421-2000",
        "city": "Washington",
        "state": "DC",
        "portfolio_url": "https://andrewstasi.com",
        "github_url": "https://github.com/ARStasi",
        "linkedin_url": "https://www.linkedin.com/in/andrew-stasi-b14960151/",
    })

    # ---- Companies ----
    print("Loading companies...")
    bah = post("/companies", {
        "name": "Booz Allen Hamilton",
        "description": "Global management and technology consulting firm serving government, commercial, and non-profit clients.",
        "industry": "Government Consulting / Technology",
        "start_date": "2017-11-01",
        "end_date": None,
        "city": "McLean",
        "state": "VA",
    })
    bah_id = bah["id"]

    jpmc = post("/companies", {
        "name": "JPMorgan Chase",
        "description": "Leading global financial services firm and one of the largest banking institutions in the United States.",
        "industry": "Financial Services / Banking",
        "start_date": "2000-01-01",
        "end_date": "2017-11-01",
        "city": "Multiple",
        "state": "Multiple",
    })
    jpmc_id = jpmc["id"]

    # ===== BOOZ ALLEN ROLES =====
    print("Loading Booz Allen roles...")

    # Role 1: Chief Technologist (current)
    r1 = post(f"/companies/{bah_id}/roles", {
        "title": "Chief Technologist Data and AI Platforms",
        "level": "Senior L5",
        "start_date": "2025-04-01",
        "end_date": None,
        "city": "McLean",
        "state": "VA",
        "is_remote": False,
        "summary": "Drive innovation and operational excellence leading Data Engineering and AI Technology team within ETSS division. Oversee cloud-native AI/ML solutions, data platforms, and custom web applications. Collaborate with C-suite executives to deliver scalable, secure solutions that enhance business processes and drive strategic outcomes.",
    })
    r1_id = r1["id"]

    # Role 2: Senior Lead Technologist
    r2 = post(f"/companies/{bah_id}/roles", {
        "title": "Senior Lead Technologist Data and AI Platforms",
        "level": "L4 Lead",
        "start_date": "2020-09-01",
        "end_date": "2025-04-01",
        "city": "McLean",
        "state": "VA",
        "is_remote": False,
        "summary": "Led Data Engineering and AI Technology team driving innovation and operational excellence within ETSS division. Oversaw development and maintenance of cloud-native AI/ML solutions, data platforms, and custom web applications.",
    })
    r2_id = r2["id"]

    # Role 3: Lead Technologist
    r3 = post(f"/companies/{bah_id}/roles", {
        "title": "Lead Technologist Enterprise Business Intelligence",
        "level": "L3",
        "start_date": "2017-11-01",
        "end_date": "2020-09-01",
        "city": "McLean",
        "state": "VA",
        "is_remote": False,
        "summary": "Drove development and adoption of innovative data solutions. Led Tableau dashboard development, expanded to enterprise analytics portal development, spearheaded Alteryx adoption, and built the Analytics Hub during firm's financial system modernization.",
    })
    r3_id = r3["id"]

    # ===== JPMORGAN ROLES =====
    print("Loading JPMorgan roles...")

    r4 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Global Real Estate Strategy - Analytics Lead",
        "level": "Vice President",
        "start_date": "2013-09-01",
        "end_date": "2017-11-01",
        "city": "Columbus",
        "state": "OH",
        "is_remote": False,
        "summary": "Developed and executed strategic analytics solutions that transformed the firm's real estate footprint. Co-led creation of multi-year headcount forecasting tool for 260,000+ employees. Streamlined data management by migrating from Access to SQL Server and implementing Alteryx.",
    })
    r4_id = r4["id"]

    r5 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Retail Real Estate - Project Manager",
        "level": "Vice President",
        "start_date": "2010-01-01",
        "end_date": "2013-09-01",
        "city": "Columbus",
        "state": "OH",
        "is_remote": False,
        "summary": "Provided strategic analytics and project management oversight for retail banking branch portfolio across the U.S. Managed data-driven insights for branch redesign, retrofit, and construction. Led SharePoint-based digital transformation for 100 team members.",
    })
    r5_id = r5["id"]

    r6 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Retail Real Estate - Analyst",
        "level": "Assistant Vice President",
        "start_date": "2008-11-01",
        "end_date": "2010-01-01",
        "city": "Phoenix",
        "state": "AZ",
        "is_remote": False,
        "summary": "Supported the Washington Mutual rebranding effort after JPMorgan's acquisition. Provided analytics and reporting for interior rebranding of 1,800+ branches with $500M+ budget.",
    })
    r6_id = r6["id"]

    r7 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Retail Real Estate - Branch Planning Project Manager",
        "level": "Assistant Vice President",
        "start_date": "2008-04-01",
        "end_date": "2008-11-01",
        "city": "Phoenix",
        "state": "AZ",
        "is_remote": False,
        "summary": "Managed logistics and inventory for new branch openings, relocations, and consolidations nationwide. Coordinated pick-and-pack distribution process for 200+ branch projects from national staging site.",
    })
    r7_id = r7["id"]

    r8 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Assistant Branch Manager",
        "level": "Assistant Vice President",
        "start_date": "2005-06-01",
        "end_date": "2007-03-01",
        "city": "Phoenix",
        "state": "AZ",
        "is_remote": False,
        "summary": "Oversaw operational functions of retail bank branch including loss control, compliance, audit standards, and customer retention. Supervised and developed a team of tellers.",
    })
    r8_id = r8["id"]

    r9 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Sales and Service Associate",
        "level": None,
        "start_date": "2004-01-01",
        "end_date": "2005-06-01",
        "city": "Phoenix",
        "state": "AZ",
        "is_remote": False,
        "summary": "Handled customer service issues, provided backup support to tellers, and generated leads and referrals working with personal bankers.",
    })
    r9_id = r9["id"]

    r10 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Travel Team In-Store Customer Service Associate II",
        "level": None,
        "start_date": "2001-04-01",
        "end_date": "2004-01-01",
        "city": "Phoenix",
        "state": "AZ",
        "is_remote": False,
        "summary": "Provided relief support to banking centers with staffing issues. Worked as part of branch sales team profiling customers, opening accounts, and closing loans.",
    })
    r10_id = r10["id"]

    r11 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Administrative Assistant",
        "level": None,
        "start_date": "2000-08-01",
        "end_date": "2001-04-01",
        "city": "Phoenix",
        "state": "AZ",
        "is_remote": False,
        "summary": "Admin support for the branch travel team. Assisted Travel Team manager for Arizona with scheduling, timecards, and coordination for 100+ employees.",
    })
    r11_id = r11["id"]

    r12 = post(f"/companies/{jpmc_id}/roles", {
        "title": "Travel Team In-Store CSA I",
        "level": None,
        "start_date": "2000-01-01",
        "end_date": "2000-08-01",
        "city": "Phoenix",
        "state": "AZ",
        "is_remote": False,
        "summary": "Provided relief support to banking centers in both teller and customer service roles.",
    })
    r12_id = r12["id"]

    # ===== ACCOMPLISHMENTS =====
    print("Loading accomplishments...")

    # --- Chief Technologist (r1) accomplishments ---
    r1_accs = [
        ("Architected and led the migration of Booz Allen's enterprise analytics and data platforms from Azure Commercial to Azure Government Community Cloud High (GCCH), ensuring uninterrupted access for 30K+ users. Strengthened FedRAMP High and CMMC Level 2 compliance, enhanced infrastructure resilience, and reinforced the firm's ability to securely scale AI and analytics workloads across regulated environments.", None, None),
        ("Defined the enterprise data strategy by delivering a modern lakehouse platform that enabled a federated data mesh across business domains. Standardized access to 2+ petabytes of enterprise data, accelerated analytics adoption, and established the backbone for future AI-driven capabilities firmwide.", None, None),
        ("Spearheaded the consolidation of multiple Tableau deployments into a unified enterprise environment, serving 30K+ users and achieving 40% cost savings. Centralized support, aligned BI tooling with corporate objectives, and eliminated redundancy to drive efficiency.", None, None),
        ("Authored quarterly CIO/CISO narratives and a 3-year AI/Data/Cloud strategy (target architecture, operating model, funding, and KPIs) adopted by governance councils. Aligned portfolio investments with firmwide OKRs and enterprise risk posture.", None, None),
        ("Strengthened cybersecurity posture across the Data & AI technology portfolio—including Databricks, Tableau, UiPath, Immuta, Salesforce, and Azure-based applications—by implementing an integrated continuous monitoring framework leveraging Dynatrace, Splunk, Tenable, Carbon Black, Azure Monitor, and ServiceNow. Achieved a 75% reduction in high-risk findings.", "Dynatrace, Splunk, Tenable, Carbon Black, Azure Monitor, ServiceNow", "75% reduction in high-risk findings"),
        ("Directed the enterprise rollout of fine-grained, attribute-based access controls (ABAC) using Immuta and Databricks Unity Catalog, enabling row- and column-level data masking and automated policy enforcement across the enterprise lakehouse environment.", "Immuta, Databricks Unity Catalog", None),
        ("Led and developed a 12-member, geographically distributed agile product and engineering team spanning data, AI, platform, and UX disciplines. Increased team velocity by 20% year-over-year while sustaining predictable, on-time releases. Maintained exceptional stability with only one team member attriting over two years.", None, "20% velocity increase YoY, exceptional retention"),
        ("Oversaw product strategy and architecture for cloud-native web applications, designing a reusable Azure reference architecture and implementation framework that standardized how new applications are conceived, secured, and deployed across the enterprise.", "Azure", None),
        ("Modernized Booz Allen's collaboration ecosystem by transitioning from legacy platforms to custom Azure applications, leveraging microservice architectures and DevSecOps practices to dramatically improve release cadence and reliability.", "Azure, DevSecOps", None),
        ("Architected and delivered an enterprise-scale UiPath RPA-driven automation platform that processes more than $1B in monthly invoices. Reduced manual data entry and related labor hours by 50%, significantly lowering human error rates in mission-critical billing activities.", "UiPath RPA", "$1B+ monthly invoices processed, 50% labor reduction"),
        ("Established an Operational Metrics Program integrating data from ServiceNow, Dynatrace, Tableau, Alteryx, and Databricks to deliver unified visibility into system health, vulnerabilities, and platform adoption.", "ServiceNow, Dynatrace, Tableau, Alteryx, Databricks", None),
        ("Optimized enterprise vendor management across Tableau, Databricks, UiPath, Immuta, Alteryx, and Salesforce. Achieved 20% savings on Databricks consumption through accurate pre-commit forecasting and advanced purchasing.", None, "20% Databricks savings, ~$3M FY25 savings"),
        ("Built and scaled a sustainable talent pipeline for Data & AI engineering, instituting structured career pathways and leadership development programs that increased retention and cultivated future leaders.", None, None),
        ("Led strategic roadmap and enterprise priority-setting for Data & AI platforms, driving multi-million-dollar initiatives on schedule through executive-level communications and cross-organizational alignment.", None, None),
        ("Chaired the Data Technology Change Control Board, providing a structured forum for managing stakeholder requests, prioritizing initiatives, and coordinating delivery across interconnected systems.", None, None),
        ("Pioneered Booz Allen's generative AI strategy by designing a compliant, enterprise-grade LLM platform that transformed the proposal process. Partnered with COO and CTO to scale AI across the enterprise, directly influencing $8B in pipeline opportunities while cutting proposal cycle time by 33%.", "Azure OpenAI, GPT-4", "$8B pipeline influence, 33% cycle time reduction"),
        ("Converted emerging industry trends (agentic AI, LLM security, platform engineering) into enterprise standards and roadmaps, accelerating compliant GenAI adoption from 60 to ~500 users in year one.", None, "60 to ~500 GenAI users in year one"),
        ("Strengthened enterprise resilience by institutionalizing disaster recovery readiness for critical analytics and AI platforms. Conducted failover testing and validated recovery plans.", None, None),
        ("Delivered measurable firmwide impact: 40% reduction in BI platform costs, 75% drop in critical/high vulnerabilities, 70% faster dashboards, 30K+ user adoption, ~$3M in FY25 savings, and ~$8B pipeline support.", None, "40% cost reduction, 75% vuln reduction, 70% faster dashboards"),
        ("Delivered the MVP release of Booz Allen's first enterprise AI agentic platform within 60 days, leveraging Salesforce Agentforce's LLM capabilities to autonomously interact with Deltek Costpoint for time-charging and cost accounting workflows.", "Salesforce Agentforce, Deltek Costpoint", "MVP in 60 days, 1K-user pilot to 30K+ scale"),
        ("Standardized enterprise DevSecOps pipelines using GitHub Actions and containerized build and deployment workflows. Embedded zero-trust principles, automated security scanning, and centralized secret management across 40+ products.", "GitHub Actions, Docker", "40+ products standardized"),
        ("Drove workforce development and leadership growth across the 1,000+ person enterprise technology organization, influencing talent strategy and capability building across engineering, AI, data, and product functions.", None, None),
        ("Operationalized Booz Allen's enterprise AI, Data, and Cloud strategy within the Data & AI technology portfolio. Pioneered a custom web application strategy establishing a repeatable framework for transitioning AI/ML applications from prototype to production.", None, None),
    ]
    for i, (desc, tech, result) in enumerate(r1_accs):
        post(f"/roles/{r1_id}/accomplishments", {
            "description": desc,
            "tech_stack": tech,
            "key_result": result,
            "category": "resume_bullet",
            "sort_order": i,
        })

    # --- Senior Lead Technologist (r2) accomplishments ---
    r2_accs = [
        ("Migrated an enterprise Tableau Server with 30,000+ users from AWS to Azure, re-platforming from Windows to Linux and externalizing the Postgres repository. Realized 50% faster extracts, 50% quicker dashboard loads, and cut server-restart time from 30 minutes to 5 minutes.", "Tableau, AWS, Azure, Linux, PostgreSQL", "50% faster extracts, 50% faster dashboards, 83% faster restarts"),
        ("Led a six-month end-to-end Tableau migration (AWS to Azure) with Windows-to-Linux re-platforming and Postgres externalization, overseeing change-management, user testing, and a structured weekend cut-over that yielded 83% faster restarts, 55% quicker extract refreshes, 70% faster dashboards, and a 12% cloud-cost reduction.", "Tableau, AWS, Azure", "83% faster restarts, 55% faster extracts, 70% faster dashboards, 12% cost reduction"),
        ("Enhanced operational awareness across 60+ servers (Tableau, Alteryx, Immuta, UiPath, Databricks, Talend) by integrating Slack for near real-time alerts, driving outage reduction and sustaining 99%+ uptime.", "Slack, Tableau, Alteryx, Immuta, UiPath, Databricks", "99%+ uptime across 60+ servers"),
        ("Guided development of a Databricks job-orchestration monitor for 1,000+ data-engineering jobs, issuing Microsoft Teams alerts for failed or slow runs and safeguarding data-pipeline reliability.", "Databricks, Microsoft Teams", "1,000+ jobs monitored"),
        ("Served as product owner for COTS platforms (Tableau, UiPath, Immuta, Alteryx, Databricks) and custom web apps (Analytics Hub, JASPIR, Propster), balancing feature roadmaps, user adoption, and cloud-cost controls.", None, None),
        ("Improved near real-time observability by integrating New Relic, ScienceLogic1, Splunk, and native Azure Monitor, accelerating incident detection and resolution.", "New Relic, ScienceLogic, Splunk, Azure Monitor", None),
        ("Architected and led the build of an AI-driven candidate-screening web application, increasing day-one candidate availability by 260% and generating 10% more interviews among top recruiter users through a streamlined model-scoring UI.", "Azure, React, Node.js, ML", "260% more day-one candidates, 10% more interviews"),
    ]
    for i, (desc, tech, result) in enumerate(r2_accs):
        post(f"/roles/{r2_id}/accomplishments", {
            "description": desc,
            "tech_stack": tech,
            "key_result": result,
            "category": "resume_bullet",
            "sort_order": i,
        })

    # --- Lead Technologist (r3) accomplishments ---
    r3_accs = [
        ("Scaled user engagement and platform scalability by managing multiple Tableau Server environments, centralizing financial reporting, and enabling self-service analytics; increased user base from 6,000 to 30,000 over three years.", "Tableau", "User base grew from 6K to 30K"),
        ("Accelerated analytics product delivery by advancing the use of low-code analytics with Alteryx, reducing time-to-market from six months to one month, and enabling rapid prototyping, deployment, and automation of data models.", "Alteryx", "Time-to-market reduced from 6 months to 1 month"),
        ("Enhanced asset management visibility for 28,000 employees by developing a Tableau-based tool embedded in a custom web portal, streamlining access to equipment and software information.", "Tableau, Custom Web Portal", "28K employees served"),
        ("Improved decision-making and user experience for 30,000 employees by leading the design and implementation of a custom embedded analytics portal on SharePoint with an Azure Cosmos DB backend, centralizing access to 130+ Tableau dashboards.", "SharePoint, Azure Cosmos DB, Tableau", "130+ dashboards centralized for 30K users"),
        ("Automated strategic data insights for the Corporate Real Estate team by utilizing Alteryx and Databricks, creating Tableau dashboards that reduced manual efforts and enhanced space utilization.", "Alteryx, Databricks, Tableau", None),
        ("Nurtured and mentored emerging talent by directing an intern development program for the Enterprise Analytics team, successfully transitioning multiple interns to full-time roles.", None, "Multiple interns converted to full-time"),
    ]
    for i, (desc, tech, result) in enumerate(r3_accs):
        post(f"/roles/{r3_id}/accomplishments", {
            "description": desc,
            "tech_stack": tech,
            "key_result": result,
            "category": "resume_bullet",
            "sort_order": i,
        })

    # --- JPMorgan: Analytics Lead (r4) ---
    r4_accs = [
        ("Led a cross-functional team to deliver analytics projects that enhanced Global Real Estate strategy, driving improved collaboration and successful project execution.", None, None),
        ("Managed the migration from Microsoft Access to Microsoft SQL Server, streamlining data management and increasing efficiency, supported by a coordinated effort with an outsourced team in India.", "Microsoft Access, SQL Server", None),
        ("Collaborated with strategy and finance stakeholders to gather employment forecasts for over 260,000 employees across 6,000 properties in 60 countries and 2,300 cities.", "Excel, Alteryx", "260K employees, 6K properties, 60 countries"),
        ("Developed and implemented a location-based workforce demand forecasting process, supporting a Corporate Location Strategy initiative and driving informed strategic decisions.", "Excel, Alteryx, SQL Server", None),
        ("Automated the consolidation of 350+ Excel spreadsheets using Alteryx, reducing processing time from 2-3 days to under 5 minutes.", "Alteryx", "Processing time from 2-3 days to under 5 minutes"),
        ("Designed a user-friendly interface for accessing Tableau dashboards, enhancing data visibility and accessibility for team members and executives.", "Tableau", None),
        ("Oversaw the integration and strategic application of the Serraview space planning tool, aligning it with internal operational needs to optimize space utilization.", "Serraview", None),
    ]
    for i, (desc, tech, result) in enumerate(r4_accs):
        post(f"/roles/{r4_id}/accomplishments", {
            "description": desc,
            "tech_stack": tech,
            "key_result": result,
            "category": "resume_bullet",
            "sort_order": i,
        })

    # --- JPMorgan: Project Manager (r5) ---
    r5_accs = [
        ("Oversaw analytics for a rapidly expanding portfolio, growing from 1,000 projects with a $110 million budget in 2010 to 6,000 projects with a $300 million budget by 2013. Provided leadership with project tracking KPIs and partnered with finance for accurate forecasting.", "Excel", "$110M to $300M budget growth, 1K to 6K projects"),
        ("Streamlined coordination of 2,500 annual Retail Branch projects, collaborating with Global Real Estate, Retail Real Estate, and Line of Business partners. Improved project delivery times and enhanced client satisfaction.", None, "2,500 projects coordinated annually"),
        ("Authored and delivered comprehensive weekly, monthly, quarterly, and annual reports for executive management, focusing on nine key Retail Branch interior retrofit initiatives.", None, None),
        ("Initiated and spearheaded a digital transition to SharePoint, significantly enhancing data management, reporting, and collaboration for 100 Retail Real Estate team members.", "SharePoint", "100 team members served"),
    ]
    for i, (desc, tech, result) in enumerate(r5_accs):
        post(f"/roles/{r5_id}/accomplishments", {
            "description": desc,
            "tech_stack": tech,
            "key_result": result,
            "category": "resume_bullet",
            "sort_order": i,
        })

    # --- JPMorgan: Analyst (r6) ---
    r6_accs = [
        ("Played a key role in the analytics and reporting for the Chase rebranding of 1,800 Washington Mutual branches, managing a project budget over $500 million.", None, "$500M+ budget, 1,800 branches"),
        ("Managed vendor relationships with contractors to ensure seamless progress of the rebranding project. Monitored milestones, purchase orders, invoicing, and payments.", None, None),
        ("Oversaw project cost, timeline, and budget monitoring. Provided executive reports for the Interior Rebrand management team.", None, None),
    ]
    for i, (desc, tech, result) in enumerate(r6_accs):
        post(f"/roles/{r6_id}/accomplishments", {
            "description": desc,
            "tech_stack": tech,
            "key_result": result,
            "category": "resume_bullet",
            "sort_order": i,
        })

    # --- JPMorgan: Branch Planning PM (r7) ---
    r7_accs = [
        ("Managed logistics of the Branch Planning National Staging Site, receiving, inventorying, warehousing, and shipping operational supplies to 128 new build branches, 21 relocations, and 55 reconfigurations.", None, "128 new builds, 21 relocations, 55 reconfigurations"),
        ("Handled distribution of sales supplies to 128 new builds for branch management to meet pre-opening sales goals.", None, None),
    ]
    for i, (desc, tech, result) in enumerate(r7_accs):
        post(f"/roles/{r7_id}/accomplishments", {
            "description": desc,
            "tech_stack": tech,
            "key_result": result,
            "category": "resume_bullet",
            "sort_order": i,
        })

    # --- JPMorgan: Assistant Branch Manager (r8) ---
    r8_accs = [
        ("Managed daily operational functions including loss control, compliance, meeting audit standards, and customer retention.", None, None),
        ("Supervised, coached, and developed a team of 5 tellers as well as supervised a team of 11 employees in absence of branch manager.", None, "5 direct reports, 11 total supervised"),
    ]
    for i, (desc, tech, result) in enumerate(r8_accs):
        post(f"/roles/{r8_id}/accomplishments", {
            "description": desc,
            "tech_stack": tech,
            "key_result": result,
            "category": "resume_bullet",
            "sort_order": i,
        })

    # ===== TEAM STRUCTURES =====
    print("Loading team structures...")

    # Chief Technologist team
    put(f"/roles/{r1_id}/team-structure", {
        "direct_reports": 5,
        "team_size": 12,
        "responsibilities": "IT Operations & Technical PM Lead (2 reports), Data Engineering Lead (2 reports), Cloud/DevOps Engineer, Technical Lead for Custom Web Apps (2 reports), Product Lead/Project Manager",
    })

    # Senior Lead Technologist team (same structure)
    put(f"/roles/{r2_id}/team-structure", {
        "direct_reports": 5,
        "team_size": 11,
        "responsibilities": "IT Operations & Technical PM Lead (2 reports), Data Engineering Lead (2 reports), Cloud/DevOps Engineer, Technical Lead for Custom Web Apps (2 reports), Product Lead/Project Manager",
    })

    # Lead Technologist team
    put(f"/roles/{r3_id}/team-structure", {
        "direct_reports": 2,
        "team_size": 2,
        "responsibilities": "Business Intelligence Developer (L2), Full Stack Web Developer (L2)",
    })

    # JPMorgan Analytics Lead
    put(f"/roles/{r4_id}/team-structure", {
        "direct_reports": 1,
        "team_size": 1,
        "responsibilities": "Business Intelligence Developer (AVP) - Tableau Developer for Global Real Estate team",
    })

    # JPMorgan Project Manager
    put(f"/roles/{r5_id}/team-structure", {
        "direct_reports": 1,
        "team_size": 1,
        "responsibilities": "Business Analytics (AVP) - Analytics and operations support",
    })

    # Assistant Branch Manager
    put(f"/roles/{r8_id}/team-structure", {
        "direct_reports": 5,
        "team_size": 11,
        "responsibilities": "5 tellers directly supervised; 11 total employees supervised in absence of branch manager",
    })

    # ===== ORG POSITIONS =====
    print("Loading org positions...")

    put(f"/roles/{r1_id}/org-position", {
        "reports_to": "Director, Data Technology & Engineering",
        "department": "Enterprise Technology Services and Solutions (ETSS) / Analytics Office (AO) / Data Technology & Engineering (DT&E)",
        "org_level": "Senior L5 - Chief Technologist",
    })

    put(f"/roles/{r2_id}/org-position", {
        "reports_to": "Director, Data Technology & Engineering",
        "department": "Enterprise Technology Services and Solutions (ETSS) / Analytics Office (AO) / Data Technology & Engineering (DT&E)",
        "org_level": "L4 Lead - Senior Lead Technologist",
    })

    put(f"/roles/{r3_id}/org-position", {
        "reports_to": "Data Technology & Engineering Lead",
        "department": "Enterprise Technology Services and Solutions (ETSS) / Analytics Office (AO)",
        "org_level": "L3 - Lead Technologist",
    })

    # ===== AWARDS =====
    print("Loading awards...")

    post(f"/roles/{r2_id}/awards", {
        "title": "VIP (Values in Practice) Award",
        "description": "Awarded the most prestigious recognition at Booz Allen for outstanding contributions aligning with the company's core values.",
        "date": "2023-01-01",
        "issuer": "Booz Allen Hamilton",
        "resume_relevant": True,
    })

    # ===== PRESENTATIONS =====
    print("Loading presentations...")

    post(f"/roles/{r3_id}/presentations", {
        "title": "Enterprise Adoption of Tableau at Booz Allen",
        "venue": "Gartner Catalyst Conference",
        "date": "2019-01-01",
        "audience": "100+ attendees",
        "resume_relevant": True,
    })

    post(f"/roles/{r4_id}/presentations", {
        "title": "Automation with Alteryx - Self-Service Analytic Engineering",
        "venue": "JPMorgan Corporate Strategy Town Hall",
        "date": "2017-01-01",
        "audience": "Corporate Strategy team",
        "resume_relevant": True,
    })

    # ===== SPECIAL RECOGNITION (as award for r8) =====
    post(f"/roles/{r8_id}/awards", {
        "title": "Selected for JPMorgan/Bank One Integration Team",
        "description": "Selected to go to New York as part of the JPMorgan-Bank One systems integration initiative. Served as trained staff at a retail branch converting from the JPMorgan system to the Bank One system for seamless transition.",
        "date": "2006-01-01",
        "issuer": "JPMorgan Chase",
        "resume_relevant": False,
    })

    # ===== CERTIFICATIONS =====
    print("Loading certifications...")

    post("/certifications", {
        "name": "ICAgile Certified Professional Foundations of DevOps",
        "issuing_org": "ICAgile",
        "issue_date": None,
        "credential_id": None,
    })

    post("/certifications", {
        "name": "ICAgile Certified Professional Agile Project and Delivery Management",
        "issuing_org": "ICAgile",
        "issue_date": None,
        "credential_id": None,
    })

    # ===== SKILLS =====
    print("Loading skills...")

    # Build a comprehensive skill list from all roles
    all_skills = [
        # Technical
        "Tableau", "Alteryx", "Node.js", "React", "Python", "PySpark",
        "Azure App Service", "Azure Static Web Apps", "Azure OpenAI",
        "LLM/GPT Models", "Azure Cognitive Services", "Red Hat Linux",
        "Immuta", "Oracle EPM", "UiPath", "Azure Networking (vNets/Private Endpoints)",
        "Azure App Service Environments", "AWS EC2", "AWS S3",
        "Azure SQL Server", "Azure API Management", "Azure Kubernetes Service",
        "Azure Container Registry", "Azure Databricks", "Azure Virtual Machines",
        "Azure Key Vault", "SQL", "GitHub", "GitHub Actions",
        "GitHub Advanced Security", "PostgreSQL", "OAuth/Azure AD",
        "REST APIs", "Oracle Essbase", "Splunk", "Dynatrace", "Docker",
        "Lakehouse Architecture", "Data Mesh", "Data Architecture", "Spark",
        "IAM Management", "MCP", "AI Agents", "Query Federation",
        "ServiceNow", "Cribl", "Disaster Recovery", "Resiliency Engineering",
        "GraphQL", "Salesforce", "Agentforce", "Mulesoft",
        "Oracle Exalytics", "Oracle Exadata", "Talend", "New Relic",
        "ScienceLogic (SL1)", "Django", "Vue.js", "HTML/CSS",
        "Azure Functions", "Azure Cosmos DB", "Microsoft Access",
        "Excel", "SharePoint", "Serraview",
        # Soft/Leadership
        "Project Management", "Team Leadership", "Vendor Management",
        "Strategic Planning", "Budget Management", "Change Management",
        "Agile/Scrum", "Executive Communication", "Stakeholder Management",
        "DevSecOps", "Product Ownership",
    ]

    skill_ids = {}
    for skill_name in all_skills:
        try:
            s = post("/skills", {"name": skill_name, "skill_type": "technical"})
            skill_ids[skill_name] = s["id"]
        except Exception:
            # Skill might already exist (duplicate in list)
            pass

    # Fetch all skills to get IDs for any that existed
    import requests as req
    all_db_skills = req.get(f"{BASE}/skills").json()
    for s in all_db_skills:
        skill_ids[s["name"]] = s["id"]

    # Role-skill associations
    r1_skills = [
        "Tableau", "Alteryx", "Node.js", "React", "Python", "PySpark",
        "Azure App Service", "Azure Static Web Apps", "Azure OpenAI",
        "LLM/GPT Models", "Azure Cognitive Services", "Red Hat Linux",
        "Immuta", "Oracle EPM", "UiPath", "Azure Networking (vNets/Private Endpoints)",
        "AWS EC2", "AWS S3", "Azure SQL Server", "Azure API Management",
        "Azure Kubernetes Service", "Azure Container Registry", "Azure Databricks",
        "Azure Virtual Machines", "Azure Key Vault", "SQL", "GitHub",
        "GitHub Actions", "GitHub Advanced Security", "PostgreSQL",
        "OAuth/Azure AD", "REST APIs", "Oracle Essbase", "Splunk",
        "Dynatrace", "Docker", "Lakehouse Architecture", "Data Mesh",
        "Data Architecture", "Spark", "IAM Management", "MCP",
        "AI Agents", "Query Federation", "ServiceNow", "Cribl",
        "Disaster Recovery", "Resiliency Engineering", "GraphQL",
        "Salesforce", "Agentforce", "Mulesoft",
        "Team Leadership", "Vendor Management", "Strategic Planning",
        "Budget Management", "DevSecOps", "Product Ownership",
        "Executive Communication", "Stakeholder Management",
    ]

    r3_skills = [
        "Tableau", "Alteryx", "Django", "Vue.js", "Python", "PySpark",
        "HTML/CSS", "Azure Functions", "Azure Cosmos DB", "Talend",
        "Oracle Essbase", "Oracle Exalytics", "Oracle Exadata", "PostgreSQL",
        "SharePoint", "Product Ownership", "Team Leadership",
    ]

    r4_skills = [
        "Tableau", "Alteryx", "HTML/CSS", "SQL", "Microsoft Access", "Excel",
        "Serraview", "Project Management", "Stakeholder Management",
    ]

    r5_skills = [
        "Excel", "Project Management", "SharePoint",
        "Stakeholder Management", "Change Management",
    ]

    def assign_skills(role_id, skill_names):
        for name in skill_names:
            sid = skill_ids.get(name)
            if sid:
                try:
                    post(f"/roles/{role_id}/skills", {"skill_id": sid})
                except Exception:
                    pass  # Duplicate association

    assign_skills(r1_id, r1_skills)
    # r2 has largely the same skills as r1 plus some legacy ones
    r2_skills = r1_skills + ["Oracle Exalytics", "Oracle Exadata", "Talend", "New Relic", "ScienceLogic (SL1)"]
    assign_skills(r2_id, r2_skills)
    assign_skills(r3_id, r3_skills)
    assign_skills(r4_id, r4_skills)
    assign_skills(r5_id, r5_skills)

    # ===== KNOWLEDGE ENTRIES =====
    print("Loading knowledge entries (detailed overviews, responsibilities)...")

    # Store detailed overviews and responsibilities as knowledge entries
    knowledge_data = [
        (r1_id, bah_id, "Detailed Overview - Chief Technologist",
         "I currently work in an internal corporate function within Booz Allen Hamilton, a government consulting firm. My role is embedded in a central technology team that is part of the CIO organization, known as the Enterprise Technology Services and Solutions (ETSS) division. I lead the Data Engineering and AI Technology team within the Data Technology & Engineering (DT&E) division, which is a part of the Analytics Office (AO). This role covers a number of different tools and projects. The focus of most of the work is tied to the mission of the team which is to produce and enable analytics and data driven decision making across the firm."),

        (r2_id, bah_id, "Detailed Overview - Senior Lead Technologist",
         "I currently work in an internal corporate function within Booz Allen Hamilton, a government consulting firm. My role is embedded in a central technology team that is part of the CIO organization, known as the Enterprise Technology Services and Solutions (ETSS) division. I lead the Data Engineering and AI Technology team within the Data Technology & Engineering (DT&E) division, which is a part of the Analytics Office (AO). In addition to primary responsibilities, I lead a cross-functional team on a high-visibility project aimed at rolling out a generative AI solution for proposal writing across Booz Allen. As the platform owner, I conduct monthly meetings with C-suite executives, including the CIO and CISO."),

        (r3_id, bah_id, "Detailed Overview - Lead Technologist",
         "Initially brought on as an individual contributor for Tableau dashboard development but quickly shifted. Led the 'Employee Backpack' dashboard project distributed to ~25K employees - first dashboard distributed company-wide. Built a custom web portal around it with embedded dashboards. Brought Alteryx knowledge from JPMorgan which led to its adoption at Booz Allen. During NGFM (NextGen Finance Modernization) project, pivoted to developing the Analytics Hub as the consumption layer for all dashboards. Built POC, then led an intern to build the production application."),

        (r4_id, jpmc_id, "Detailed Overview - Analytics Lead",
         "Internal corporate role at JPMorgan Chase in Global Real Estate. Connected to Strategy and Process Improvement team within the COO of JPMorgan. Team initiated a project for location strategy across the JPMorgan office portfolio to create strategic hubs. Helped create and manage a process for collecting headcount forecasts for all business functions with a 3-year outlook. Initially managed using Excel, Access, and SharePoint. Implemented Alteryx which vastly improved manual processes. Brought on MS SQL Server for data volume. Major firm initiative saving over $1 billion by reducing real estate footprint."),

        (r5_id, jpmc_id, "Detailed Overview - Project Manager",
         "Relocated from Phoenix AZ to Columbus OH. Columbus was the strategic hub for the Consumer Bank (prior headquarters of Bank One). Provided analytics to leadership based on retail branch real estate portfolio across the U.S. Team responsible for redesign, retrofit and construction work on retail bank branches. Had ownership of 'quick turn' requests for minor construction work. Led digital transformation effort adopting SharePoint 2007 for collaboration."),

        (r6_id, jpmc_id, "Detailed Overview - Analyst",
         "Took this role during the peak of the 2008 financial crisis. Joined to help with Washington Mutual rebranding effort after JPMorgan acquired Washington Mutual from the U.S. government. Goal was to remodel WaMu branches to Chase standards. Work depended on whether branches used Occasio layout or traditional teller line. Project was sponsored up to CEO level - 1,800+ branches to integrate. Primary effort planned for completion by end of 2009. First real intro into data and analytics providing financial data on rebranding efforts."),

        (r7_id, jpmc_id, "Detailed Overview - Branch Planning PM",
         "Part of the retail real estate branch planning team responsible for new branch openings and closings. Worked at a distribution center (staging site) receiving supplies, organizing, sorting and building shipments. Process dubbed 'pick and pack.' Team of 3 managing the operation. Also involved in branch openings and safe deposit box consolidation work. This role exposed me to Excel and analytics work that led to future analytical roles."),

        (r8_id, jpmc_id, "Detailed Overview - Assistant Branch Manager",
         "Served as Assistant Branch Manager in a retail bank branch. Held an operational role managing all tellers, branch operations, and serving as teller when needed. Core responsibilities included ensuring right amount of cash on hand, staffing/scheduling tellers, and managing audit readiness. All roles had a sales element through customer interactions at the teller window."),
    ]

    for role_id, company_id, title, content in knowledge_data:
        post("/knowledge", {
            "role_id": role_id,
            "company_id": company_id,
            "title": title,
            "content": content,
        })

    print("\n=== Bulk load complete! ===")
    print(f"  Companies: 2")
    print(f"  Roles: 12")
    print(f"  Accomplishments: {len(r1_accs) + len(r2_accs) + len(r3_accs) + len(r4_accs) + len(r5_accs) + len(r6_accs) + len(r7_accs) + len(r8_accs)}")
    print(f"  Skills: {len(all_skills)}")
    print(f"  Awards: 2")
    print(f"  Presentations: 2")
    print(f"  Certifications: 2")
    print(f"  Knowledge entries: {len(knowledge_data)}")


if __name__ == "__main__":
    main()
