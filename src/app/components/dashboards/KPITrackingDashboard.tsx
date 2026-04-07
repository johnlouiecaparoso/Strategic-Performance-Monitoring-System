import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useAppData } from '../../data/store';
import { getKPIQuarterProgress } from '../../utils/analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useMemo, useState } from 'react';
import { EDITABLE_FIELD_RULES, READ_ONLY_FIELD_RULES } from '../../utils/bscGovernance';

function isLikelyHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function KPITrackingDashboard() {
  const { kpis, monthlyAccomplishments, goals, offices } = useAppData();
  const [pillarFilter, setPillarFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [perspectiveFilter, setPerspectiveFilter] = useState('all');

  const kpiData = kpis.map(kpi => {
    const accs = monthlyAccomplishments.filter(a => a.kpiId === kpi.id);
    const q1Progress = getKPIQuarterProgress(kpi, 'Q1');
    const q2Progress = getKPIQuarterProgress(kpi, 'Q2');
    const q3Progress = getKPIQuarterProgress(kpi, 'Q3');
    const q4Progress = getKPIQuarterProgress(kpi, 'Q4');
    const totalAcc = q1Progress.accomplishment;
    const benchmarkTarget = q1Progress.benchmarkTarget;
    const percentage = q1Progress.percentage;
    const variance = totalAcc - benchmarkTarget;
    const goal = goals.find(g => g.id === kpi.goalId);
    const office = offices.find(o => o.id === kpi.officeId);

    return {
      ...kpi,
      totalAccomplishment: totalAcc,
      benchmarkTarget,
      percentage: Math.round(percentage * 10) / 10,
      variance,
      goalName: goal?.name || '',
      officeName: office?.name || '',
      q1Target: kpi.q1Target || benchmarkTarget,
      perspective: kpi.perspective || '',
      assignmentType: kpi.assignmentType || '',
      pillar: kpi.pillar || '',
      strategicObjective: kpi.strategicObjective || '',
      keyActivitiesOutputs: kpi.keyActivitiesOutputs || '',
      bscRemarks: kpi.bscRemarks || '',
      sourceSheet: kpi.sourceSheet || '',
      sourceRow: kpi.sourceRow,
      q2Target: kpi.q2Target || q2Progress.benchmarkTarget,
      q3Target: kpi.q3Target || q3Progress.benchmarkTarget,
      q4Target: kpi.q4Target || q4Progress.benchmarkTarget,
      q2Accomplishment: q2Progress.accomplishment,
      q3Accomplishment: q3Progress.accomplishment,
      q4Accomplishment: q4Progress.accomplishment,
      q2Percentage: Math.round(q2Progress.percentage * 10) / 10,
      q3Percentage: Math.round(q3Progress.percentage * 10) / 10,
      q4Percentage: Math.round(q4Progress.percentage * 10) / 10,
      meansOfVerification: kpi.meansOfVerification || kpi.movText || '',
      issuesChallenges: kpi.issuesChallenges || '',
      assistanceNeededRecommendations: kpi.assistanceNeededRecommendations || '',
      validationState: kpi.validationState || 'draft',
      performance:
        percentage >= 100
          ? 'overachieved'
          : percentage >= 80
          ? 'on-track'
          : percentage >= 50
          ? 'at-risk'
          : 'underperforming',
      hasUpdates: accs.length > 0,
    };
  });

  const pillarOptions = useMemo(
    () => ['all', ...Array.from(new Set(kpiData.map((kpi) => kpi.pillar).filter(Boolean))).sort()],
    [kpiData],
  );

  const assignmentOptions = useMemo(
    () => ['all', ...Array.from(new Set(kpiData.map((kpi) => kpi.assignmentType).filter(Boolean))).sort()],
    [kpiData],
  );

  const perspectiveOptions = useMemo(
    () => ['all', ...Array.from(new Set(kpiData.map((kpi) => kpi.perspective).filter(Boolean))).sort()],
    [kpiData],
  );

  const filteredKpiData = kpiData.filter((kpi) => {
    const passPillar = pillarFilter === 'all' || kpi.pillar === pillarFilter;
    const passAssignment = assignmentFilter === 'all' || kpi.assignmentType === assignmentFilter;
    const passPerspective = perspectiveFilter === 'all' || kpi.perspective === perspectiveFilter;
    return passPillar && passAssignment && passPerspective;
  });

  const overachieved = filteredKpiData.filter(k => k.performance === 'overachieved');
  const underperforming = filteredKpiData.filter(k => k.performance === 'underperforming');
  const noUpdates = filteredKpiData.filter(k => !k.hasUpdates);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">KPI Tracking Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Target vs accomplishment analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter KPIs</CardTitle>
          <CardDescription>Filter by matrix dimensions from your Google Sheet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pillar</p>
              <Select value={pillarFilter} onValueChange={setPillarFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All pillars" />
                </SelectTrigger>
                <SelectContent>
                  {pillarOptions.map((option) => (
                    <SelectItem key={option || 'blank-pillar'} value={option || 'blank-pillar'}>
                      {option === 'all' ? 'All pillars' : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Assignment Type</p>
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All assignments" />
                </SelectTrigger>
                <SelectContent>
                  {assignmentOptions.map((option) => (
                    <SelectItem key={option || 'blank-assignment'} value={option || 'blank-assignment'}>
                      {option === 'all' ? 'All assignment types' : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Perspective</p>
              <Select value={perspectiveFilter} onValueChange={setPerspectiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All perspectives" />
                </SelectTrigger>
                <SelectContent>
                  {perspectiveOptions.map((option) => (
                    <SelectItem key={option || 'blank-perspective'} value={option || 'blank-perspective'}>
                      {option === 'all' ? 'All perspectives' : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BSC Field Governance</CardTitle>
          <CardDescription>Read-only source fields versus reporting fields allowed for updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Read-Only Fields</p>
              <div className="space-y-1">
                {READ_ONLY_FIELD_RULES.map((rule) => (
                  <div key={rule.key} className="flex items-center justify-between text-sm">
                    <span>{rule.label}</span>
                    <Badge variant="outline">{rule.type}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Reporting / Editable Fields</p>
              <div className="space-y-1">
                {EDITABLE_FIELD_RULES.map((rule) => (
                  <div key={rule.key} className="flex items-center justify-between text-sm">
                    <span>{rule.label}</span>
                    <Badge variant={rule.editable ? 'default' : 'secondary'}>{rule.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.length}</div>
            <p className="text-xs text-gray-500 mt-1">{filteredKpiData.length} after filters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overachieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{overachieved.length}</div>
            <p className="text-xs text-gray-500 mt-1">≥100% of target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Underperforming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{underperforming.length}</div>
            <p className="text-xs text-gray-500 mt-1">&lt;50% of target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">No Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{noUpdates.length}</div>
            <p className="text-xs text-gray-500 mt-1">Missing data</p>
          </CardContent>
        </Card>
      </div>

      {overachieved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-green-600" />
              Overachieved KPIs
            </CardTitle>
            <CardDescription>KPIs that exceeded their targets</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[26rem] overflow-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Accomplishment</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overachieved.map(kpi => (
                    <TableRow key={kpi.id}>
                      <TableCell>
                        <div className="font-medium">{kpi.code}</div>
                        <div className="text-xs text-gray-500">{kpi.name}</div>
                      </TableCell>
                      <TableCell className="text-sm">{kpi.officeName}</TableCell>
                      <TableCell>{kpi.target} {kpi.unit}</TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {kpi.totalAccomplishment} {kpi.unit}
                        </div>
                        <div className="text-xs text-green-600">+{kpi.variance} {kpi.unit}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(kpi.percentage, 100)} className="flex-1" />
                          <span className="font-semibold text-sm text-green-600">{kpi.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All KPIs Performance</CardTitle>
          <CardDescription>Complete target vs accomplishment breakdown</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-auto pb-2 [scrollbar-gutter:stable]">
            <Table className="table-fixed min-w-[2400px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px] whitespace-nowrap">Code</TableHead>
                  <TableHead className="w-[460px] whitespace-nowrap">KPI Name</TableHead>
                  <TableHead className="w-[170px] whitespace-nowrap">Goal</TableHead>
                  <TableHead className="w-[180px] whitespace-nowrap">Office</TableHead>
                  <TableHead className="w-[150px] whitespace-nowrap">Assignment</TableHead>
                  <TableHead className="w-[150px] whitespace-nowrap">Perspective</TableHead>
                  <TableHead className="w-[140px] whitespace-nowrap">Pillar</TableHead>
                  <TableHead className="w-[220px] whitespace-nowrap">Strategic Objective</TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap">Target</TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap">Q1 Target</TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap">Q2 Target</TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap">Q3 Target</TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap">Q4 Target</TableHead>
                  <TableHead className="w-[160px] whitespace-nowrap">Accomplishment</TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap">Variance</TableHead>
                  <TableHead className="w-[220px] whitespace-nowrap">Progress</TableHead>
                  <TableHead className="w-[220px] whitespace-nowrap">Key Activities/Outputs</TableHead>
                  <TableHead className="w-[220px] whitespace-nowrap">Means of Verification</TableHead>
                  <TableHead className="w-[220px] whitespace-nowrap">BSC Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKpiData.map(kpi => (
                  <TableRow key={kpi.id}>
                    <TableCell className="w-[220px] text-xs font-semibold text-gray-600 align-top">
                      <div className="w-[220px] whitespace-normal break-all leading-snug" title={kpi.code}>{kpi.code}</div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="w-[460px] max-w-[460px]">
                        <div className="font-semibold text-base leading-tight">{kpi.name}</div>
                        <div className="text-xs text-gray-500 truncate">{kpi.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm align-top">{kpi.goalName}</TableCell>
                    <TableCell className="text-sm align-top">{kpi.officeName}</TableCell>
                    <TableCell className="text-sm align-top">{kpi.assignmentType || 'N/A'}</TableCell>
                    <TableCell className="text-sm align-top">{kpi.perspective || 'N/A'}</TableCell>
                    <TableCell className="text-sm align-top">{kpi.pillar || 'N/A'}</TableCell>
                    <TableCell className="text-sm align-top">
                      <div className="max-w-xs truncate" title={kpi.strategicObjective || 'N/A'}>
                        {kpi.strategicObjective || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">{kpi.target} {kpi.unit}</TableCell>
                    <TableCell className="align-top">{kpi.benchmarkTarget > 0 ? `${kpi.benchmarkTarget} ${kpi.unit}` : 'N/A'}</TableCell>
                    <TableCell className="align-top">{kpi.q2Target > 0 ? `${kpi.q2Target} ${kpi.unit}` : 'N/A'}</TableCell>
                    <TableCell className="align-top">{kpi.q3Target > 0 ? `${kpi.q3Target} ${kpi.unit}` : 'N/A'}</TableCell>
                    <TableCell className="align-top">{kpi.q4Target > 0 ? `${kpi.q4Target} ${kpi.unit}` : 'N/A'}</TableCell>
                    <TableCell className="align-top">
                      <div
                        className={`font-medium ${
                          kpi.performance === 'overachieved'
                            ? 'text-green-600'
                            : kpi.performance === 'underperforming'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {kpi.totalAccomplishment} {kpi.unit}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          kpi.variance > 0
                            ? 'text-green-600'
                            : kpi.variance < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {kpi.variance > 0 ? (
                          <TrendingUp className="size-4" />
                        ) : kpi.variance < 0 ? (
                          <TrendingDown className="size-4" />
                        ) : (
                          <Minus className="size-4" />
                        )}
                        {kpi.variance > 0 ? '+' : ''}
                        {kpi.variance} {kpi.unit}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(kpi.percentage, 100)} className="flex-1" />
                        <span
                          className={`font-semibold text-sm whitespace-nowrap ${
                            kpi.performance === 'overachieved'
                              ? 'text-green-600'
                              : kpi.performance === 'underperforming'
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {kpi.percentage}%
                        </span>
                      </div>
                      {!kpi.hasUpdates && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                          <AlertCircle className="size-3" />
                          No updates
                        </div>
                      )}
                      <div className="mt-1 text-[11px] text-gray-500">
                        {kpi.sourceSheet && typeof kpi.sourceRow === 'number'
                          ? `${kpi.sourceSheet} • Row ${kpi.sourceRow}`
                          : 'No source trace'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm align-top">
                      <div className="max-w-xs truncate" title={kpi.keyActivitiesOutputs || 'N/A'}>
                        {kpi.keyActivitiesOutputs && isLikelyHttpUrl(kpi.keyActivitiesOutputs) ? (
                          <a href={kpi.keyActivitiesOutputs} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                            Open link
                          </a>
                        ) : kpi.keyActivitiesOutputs || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm align-top">
                      <div className="max-w-xs truncate" title={kpi.meansOfVerification || 'N/A'}>
                        {kpi.meansOfVerification && isLikelyHttpUrl(kpi.meansOfVerification) ? (
                          <a href={kpi.meansOfVerification} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                            Open link
                          </a>
                        ) : kpi.meansOfVerification || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm align-top">
                      <div className="max-w-xs truncate" title={kpi.bscRemarks || 'N/A'}>
                        {kpi.bscRemarks || 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation / Detail Monitoring</CardTitle>
          <CardDescription>Operational review of status, issues, assistance, and submission details</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[24rem] overflow-auto">
          <Table className="table-fixed min-w-[1700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">KPI Code</TableHead>
                <TableHead className="w-[360px]">KPI / Strategic Measure</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validation State</TableHead>
                <TableHead className="w-[280px]">Issues / Challenges</TableHead>
                <TableHead className="w-[280px]">Assistance Needed / Recommendations</TableHead>
                <TableHead>Focal Person</TableHead>
                <TableHead>Submission Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKpiData.map((kpi) => (
                <TableRow key={`validation-${kpi.id}`}>
                  <TableCell className="text-xs font-semibold text-gray-600">{kpi.code}</TableCell>
                  <TableCell className="font-medium">{kpi.name}</TableCell>
                  <TableCell>{kpi.officeName}</TableCell>
                  <TableCell>
                    <Badge variant={kpi.status === 'delayed' ? 'destructive' : 'secondary'}>
                      {kpi.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={kpi.validationState === 'approved' ? 'default' : 'outline'}>
                      {kpi.validationState.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[280px] break-words text-sm">{kpi.issuesChallenges || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[280px] break-words text-sm">{kpi.assistanceNeededRecommendations || 'N/A'}</div>
                  </TableCell>
                  <TableCell>{kpi.focalPerson || 'N/A'}</TableCell>
                  <TableCell>{kpi.submissionDate ? new Date(kpi.submissionDate).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {underperforming.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-600" />
              <CardTitle className="text-red-900">Underperforming KPIs Need Immediate Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="max-h-[24rem] overflow-auto">
            <div className="space-y-2 pr-1">
              {underperforming.map(kpi => (
                <div
                  key={kpi.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white rounded-lg border border-red-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-600 break-all" title={kpi.code}>{kpi.code}</p>
                    <p className="font-medium text-sm break-words leading-snug mt-0.5" title={kpi.name}>{kpi.name}</p>
                    <p className="text-xs text-gray-600 break-words">{kpi.officeName} • Only {kpi.percentage}% achieved</p>
                  </div>
                  <Badge variant="destructive" className="self-start sm:self-auto">Action Required</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
