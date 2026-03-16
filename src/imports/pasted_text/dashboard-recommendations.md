Recommended website dashboards

Based on your sheet, these are the most useful dashboards:

1. Executive dashboard

For top management
Show:

total KPI rows

submitted vs not submitted

completed vs ongoing vs delayed

average % accomplishment

top performing goals

offices with missing submissions

Best charts:

KPI cards

donut chart for status

bar chart by goal

line chart by month

2. Goal performance dashboard

Show:

progress per Goal 1 to Goal 5

accomplishment rate by goal

office contribution per goal

delayed items under each goal

Best charts:

stacked bar chart

grouped bar chart

heatmap

3. Office/Unit dashboard

Each office should see:

only their assigned KPI rows

monthly entries

status summary

pending validations

missing MOV

submission date tracking

Best charts:

completion gauge

monthly trend chart

KPI completion table

4. KPI tracking dashboard

Show:

target vs accomplishment

underperforming KPIs

overachieved KPIs

KPIs with no updates

Best charts:

bullet chart

progress bars

variance bar chart

5. Issues and assistance dashboard

Very useful because your sheet has issues/challenges and assistance fields.

Show:

offices with most issues reported

recurring challenge categories

items needing management support

unresolved assistance requests

Best visuals:

tag/category counts

issue severity cards

office issue ranking

6. Submission compliance dashboard

Since there is a submission date field, make this a major page.

Show:

who submitted on time

late submissions

offices with no submissions

focal person compliance

Best charts:

compliance bar chart

calendar/timeline view

late submission list

7. Means of Verification dashboard

Show:

KPIs with MOV submitted

KPIs without MOV

validation-ready records

file/document completeness

Best charts:

donut chart

checklist progress cards

8. Monthly accomplishment dashboard

Because the sheet has January, February, March.

Show:

monthly totals

best month

weak month

month-over-month trend

Best charts:

line chart

area chart

stacked monthly bars

Recommended website features
Core features

login/authentication

role-based access

office-based filtering

KPI list page

accomplishment entry form

dashboard analytics

Google Sheets import/sync

export to Excel/PDF/CSV

search and filters

responsive layout

Very useful features

upload MOV files

comments/validation notes

“For Validation” workflow

submission reminders

import history

audit trail

revision history

dashboard drilldown

print-ready accomplishment reports

Roles I recommend

Admin

manage users

manage master data

run sheet sync

view all dashboards

Office Encoder/Focal Person

update assigned KPIs

upload MOV

submit quarterly data

Validator/Reviewer

check submissions

add remarks

change status to validated/delayed/etc.

Executive Viewer

read-only dashboards and reports

Important design recommendation

Do not keep all logic in Google Sheets.

Use Google Sheets only for:

initial collection

optional external editing

backup import source

Use Supabase for:

all final records

user access

permissions

charts

reporting

file uploads

validation workflow

That separation will make your system much better.

Final recommendation

For your project, I recommend this stack:

Frontend: Next.js + TypeScript + Tailwind + shadcn/ui + Apache ECharts
Backend: Supabase
External source: Google Sheets sync/import

And the website should focus on:

KPI accomplishment entry

office-based monitoring

target vs accomplishment analytics

submission compliance

issues/challenges tracking

validation and MOV management