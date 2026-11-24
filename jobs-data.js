/* =========================================================
   ZEST - Sample jobs board data
   ---------------------------------------------------------
   This file stands in for a real backend feed. In production,
   replace this hard-coded array with a fetch() call to your
   ATS/Airtable/Google Sheet export (see README.md for options).
   Each job object shape below is the "contract" your backend
   should match so the front-end keeps working unchanged.
   ========================================================= */

const ZEST_JOBS = [
  {
    id: "wa-001",
    title: "Facilities Manager",
    pillar: "facilities",
    location: "Perth, WA",
    type: "Permanent",
    salary: "$140k – $160k + super",
    posted: "2026-08-04",
    summary: "Lead hard & soft services across a Tier III data centre campus in the Perth metro precinct. Own the maintenance program, contractor performance and uptime targets."
  },
  {
    id: "wa-002",
    title: "HVAC Technician",
    pillar: "facilities",
    location: "Kwinana, WA",
    type: "Permanent",
    salary: "$95k – $110k + super",
    posted: "2026-08-06",
    summary: "Precision cooling maintenance across critical-environment plant rooms. CRAC/CRAH experience and a refrigerant handling licence required."
  },
  {
    id: "wa-003",
    title: "Electrical Technician",
    pillar: "facilities",
    location: "Port Hedland, WA",
    type: "Contract – 12 months",
    salary: "$130k – $150k + FIFO",
    posted: "2026-07-29",
    summary: "Support commissioning of a large-scale renewable-powered facility in the Pilbara. FIFO roster, HV switching experience highly regarded."
  },
  {
    id: "wa-004",
    title: "Maintenance Planner",
    pillar: "facilities",
    location: "Perth, WA",
    type: "Permanent",
    salary: "$110k – $125k + super",
    posted: "2026-07-22",
    summary: "Build and manage preventative maintenance schedules across mechanical, electrical and fire systems for a growing colocation portfolio."
  },
  {
    id: "wa-005",
    title: "Site Administrator",
    pillar: "projects",
    location: "Perth, WA",
    type: "Contract – 6 months",
    salary: "$75k – $85k pro rata",
    posted: "2026-08-01",
    summary: "Support a busy construction site office through document flow, inductions and subbie coordination on a new-build facility."
  },
  {
    id: "wa-006",
    title: "Procurement Coordinator",
    pillar: "projects",
    location: "Perth, WA",
    type: "Permanent",
    salary: "$100k – $115k + super",
    posted: "2026-07-18",
    summary: "Coordinate long-lead equipment orders and supplier relationships for critical infrastructure builds across WA."
  },
  {
    id: "wa-007",
    title: "Data-Centre Technician",
    pillar: "operations",
    location: "Perth, WA",
    type: "Permanent - shift roster",
    salary: "$90k – $105k + super",
    posted: "2026-08-08",
    summary: "Hands-on hardware installs, rack and stack, and first-line incident response inside a live hyperscale facility."
  },
  {
    id: "wa-008",
    title: "Security Coordinator",
    pillar: "operations",
    location: "Perth, WA",
    type: "Permanent",
    salary: "$85k – $95k + super",
    posted: "2026-07-25",
    summary: "Manage physical security operations, access control and incident reporting across a multi-building critical facilities site."
  },
  {
    id: "nsw-001",
    title: "Critical-Environment Manager",
    pillar: "facilities",
    location: "Macquarie Park, NSW",
    type: "Permanent",
    salary: "$160k – $180k + super",
    posted: "2026-08-05",
    summary: "Own uptime and risk across mechanical, electrical and BMS systems for a flagship Sydney colocation campus."
  },
  {
    id: "nsw-002",
    title: "Mechanical Technician",
    pillar: "facilities",
    location: "Eastern Creek, NSW",
    type: "Permanent - shift roster",
    salary: "$100k – $115k + super",
    posted: "2026-08-02",
    summary: "Chiller, pump and BMS maintenance across a new-build hyperscale campus in the Western Sydney growth corridor."
  },
  {
    id: "nsw-003",
    title: "Commissioning Coordinator",
    pillar: "projects",
    location: "Kemps Creek, NSW",
    type: "Contract – 9 months",
    salary: "$130k – $145k pro rata",
    posted: "2026-07-30",
    summary: "Coordinate integrated systems testing (IST) and commissioning schedules on a hyperscale build in the Aerotropolis precinct."
  },
  {
    id: "nsw-004",
    title: "Document Controller",
    pillar: "projects",
    location: "Sydney CBD, NSW",
    type: "Contract – 12 months",
    salary: "$85k – $95k pro rata",
    posted: "2026-07-15",
    summary: "Manage EDMS document control across a portfolio of critical infrastructure construction projects for a Tier 1 contractor."
  },
  {
    id: "nsw-005",
    title: "Scheduler",
    pillar: "projects",
    location: "Macquarie Park, NSW",
    type: "Permanent",
    salary: "$110k – $125k + super",
    posted: "2026-08-07",
    summary: "Build and maintain master programs across concurrent data centre fit-out projects using P6 or MS Project."
  },
  {
    id: "nsw-006",
    title: "Contracts Administrator",
    pillar: "projects",
    location: "Western Sydney, NSW",
    type: "Permanent",
    salary: "$115k – $130k + super",
    posted: "2026-07-20",
    summary: "Administer trade packages and variations for a hyperscale campus delivery team in the Western Sydney corridor."
  },
  {
    id: "nsw-007",
    title: "Operations Coordinator",
    pillar: "operations",
    location: "Alexandria, NSW",
    type: "Permanent",
    salary: "$95k – $108k + super",
    posted: "2026-08-09",
    summary: "Coordinate day-to-day facility operations, vendor access and change management across a live colocation site."
  },
  {
    id: "nsw-008",
    title: "Capacity Planner",
    pillar: "operations",
    location: "Macquarie Park, NSW",
    type: "Permanent",
    salary: "$120k – $135k + super",
    posted: "2026-07-27",
    summary: "Forecast power, space and cooling capacity across a multi-site portfolio to support sales and client onboarding."
  },
  {
    id: "nsw-009",
    title: "Customer Implementation Manager",
    pillar: "operations",
    location: "Sydney CBD, NSW",
    type: "Permanent",
    salary: "$125k – $140k + super",
    posted: "2026-08-03",
    summary: "Own the client onboarding journey from contract signature through to go-live across multiple Sydney facilities."
  },
  {
    id: "nsw-010",
    title: "Service-Delivery Manager",
    pillar: "operations",
    location: "North Sydney, NSW",
    type: "Permanent",
    salary: "$145k – $165k + super",
    posted: "2026-07-24",
    summary: "Lead service delivery performance and SLA reporting for a portfolio of enterprise data centre clients."
  },
  {
    id: "vic-001",
    title: "Critical-Environment Manager",
    pillar: "facilities",
    location: "Port Melbourne, VIC",
    type: "Permanent",
    salary: "$155k – $175k + super",
    posted: "2026-08-06",
    summary: "Own uptime and risk across mechanical, electrical and BMS systems as a new Port Melbourne campus ramps up to live operations."
  },
  {
    id: "vic-002",
    title: "Electrical Technician",
    pillar: "facilities",
    location: "Melbourne's West, VIC",
    type: "Permanent - shift roster",
    salary: "$105k – $120k + super",
    posted: "2026-08-04",
    summary: "HV switching and critical power maintenance across a hyperscale campus in Melbourne's booming western industrial corridor."
  },
  {
    id: "vic-003",
    title: "HVAC Technician",
    pillar: "facilities",
    location: "Truganina, VIC",
    type: "Permanent",
    salary: "$95k – $110k + super",
    posted: "2026-07-28",
    summary: "Precision cooling maintenance across critical-environment plant rooms on a newly commissioned data centre campus."
  },
  {
    id: "vic-004",
    title: "Commissioning Coordinator",
    pillar: "projects",
    location: "Mickleham, VIC",
    type: "Contract – 12 months",
    salary: "$135k – $150k pro rata",
    posted: "2026-08-05",
    summary: "Coordinate integrated systems testing across a multi-phase 354MW hyperscale build in Melbourne's north-west."
  },
  {
    id: "vic-005",
    title: "Site Administrator",
    pillar: "projects",
    location: "Port Melbourne, VIC",
    type: "Contract – 9 months",
    salary: "$78k – $88k pro rata",
    posted: "2026-07-31",
    summary: "Support the site office through document flow, inductions and subbie coordination on a $2 billion campus build."
  },
  {
    id: "vic-006",
    title: "Procurement Coordinator",
    pillar: "projects",
    location: "Melbourne CBD, VIC",
    type: "Permanent",
    salary: "$100k – $115k + super",
    posted: "2026-08-01",
    summary: "Coordinate long-lead equipment orders and supplier relationships across a fast-growing Victorian construction pipeline."
  },
  {
    id: "vic-007",
    title: "Data-Centre Technician",
    pillar: "operations",
    location: "Port Melbourne, VIC",
    type: "Permanent - shift roster",
    salary: "$92k – $108k + super",
    posted: "2026-08-08",
    summary: "Hands-on hardware installs, rack and stack, and first-line incident response inside a newly live Melbourne facility."
  },
  {
    id: "vic-008",
    title: "Capacity Planner",
    pillar: "operations",
    location: "Melbourne CBD, VIC",
    type: "Permanent",
    salary: "$122k – $138k + super",
    posted: "2026-07-26",
    summary: "Forecast power, space and cooling capacity across a rapidly expanding Melbourne data centre portfolio."
  },
  {
    id: "qld-001",
    title: "Critical-Environment Manager",
    pillar: "facilities",
    location: "Fortitude Valley, QLD",
    type: "Permanent",
    salary: "$150k – $170k + super",
    posted: "2026-08-07",
    summary: "Own uptime and risk across mechanical, electrical and BMS systems as a Brisbane campus doubles capacity to 12MW."
  },
  {
    id: "qld-002",
    title: "Electrical Technician",
    pillar: "facilities",
    location: "Fortitude Valley, QLD",
    type: "Permanent - shift roster",
    salary: "$100k – $115k + super",
    posted: "2026-08-05",
    summary: "HV switching and critical power maintenance across a Tier IV data centre expansion on the fringe of the Brisbane CBD."
  },
  {
    id: "qld-003",
    title: "HVAC Technician",
    pillar: "facilities",
    location: "Sunshine Coast, QLD",
    type: "Permanent",
    salary: "$92k – $108k + super",
    posted: "2026-07-30",
    summary: "Precision cooling maintenance across critical-environment plant rooms at an emerging low-latency data centre hub."
  },
  {
    id: "qld-004",
    title: "Site Administrator",
    pillar: "projects",
    location: "Fortitude Valley, QLD",
    type: "Contract – 12 months",
    salary: "$76k – $86k pro rata",
    posted: "2026-08-02",
    summary: "Support the site office through document flow, inductions and subbie coordination on a $160 million data centre expansion."
  },
  {
    id: "qld-005",
    title: "Scheduler",
    pillar: "projects",
    location: "Brisbane CBD, QLD",
    type: "Contract – 18 months",
    salary: "$115k – $130k pro rata",
    posted: "2026-08-06",
    summary: "Build and maintain master programs across concurrent critical infrastructure projects competing for trades ahead of the 2032 Olympics build."
  },
  {
    id: "qld-006",
    title: "Procurement Coordinator",
    pillar: "projects",
    location: "Brisbane CBD, QLD",
    type: "Permanent",
    salary: "$98k – $112k + super",
    posted: "2026-07-24",
    summary: "Coordinate long-lead equipment orders and supplier relationships across a fast-growing Queensland construction pipeline."
  },
  {
    id: "qld-007",
    title: "Data-Centre Technician",
    pillar: "operations",
    location: "Fortitude Valley, QLD",
    type: "Permanent - shift roster",
    salary: "$88k – $104k + super",
    posted: "2026-08-08",
    summary: "Hands-on hardware installs, rack and stack, and first-line incident response inside a live Brisbane facility."
  },
  {
    id: "qld-008",
    title: "Operations Coordinator",
    pillar: "operations",
    location: "Brisbane CBD, QLD",
    type: "Permanent",
    salary: "$90k – $104k + super",
    posted: "2026-07-28",
    summary: "Coordinate day-to-day facility operations, vendor access and change management across a growing Queensland portfolio."
  }
];
