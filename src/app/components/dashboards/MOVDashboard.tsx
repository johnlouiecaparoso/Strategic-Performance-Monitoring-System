import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getMOVCompleteness } from '../../utils/analytics';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { FileCheck, FileX, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppData } from '../../data/store';

export function MOVDashboard() {
  const { movs, kpis, offices } = useAppData();
  const movStats = getMOVCompleteness();
  const validatedMOVs = movs.filter(m => m.validated);
  const pendingValidation = movs.filter(m => !m.validated);
  const kpisWithoutMOV = kpis.filter(kpi => !movs.some(m => m.kpiId === kpi.id));
  const kpisWithMOVText = kpis.filter((kpi) => !!kpi.movText?.trim()).length;
  const combinedMOVCoverage = kpis.filter((kpi) => {
    const hasFileMOV = movs.some((mov) => mov.kpiId === kpi.id);
    const hasTextMOV = !!kpi.movText?.trim();
    return hasFileMOV || hasTextMOV;
  }).length;

  const movData = [
    { name: 'With MOV', value: movStats.kpisWithMOV, color: '#10b981' },
    { name: 'Without MOV', value: movStats.totalKPIs - movStats.kpisWithMOV, color: '#ef4444' },
  ];

  const validationData = [
    { name: 'Validated', value: validatedMOVs.length, color: '#10b981' },
    { name: 'Pending', value: pendingValidation.length, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">Means of Verification Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Track MOV submission and validation status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">MOV Completeness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{movStats.percentage.toFixed(1)}%</div>
            <Progress value={movStats.percentage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {movStats.kpisWithMOV} of {movStats.totalKPIs} KPIs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total MOVs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{movStats.totalMOVs}</div>
            <p className="text-xs text-gray-500 mt-1">Files uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Validated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{movStats.validatedMOVs}</div>
            <p className="text-xs text-gray-500 mt-1">
              {movStats.totalMOVs > 0 ? Math.round((movStats.validatedMOVs / movStats.totalMOVs) * 100) : 0}% validation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{pendingValidation.length}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">MOV in Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{kpisWithMOVText}</div>
            <p className="text-xs text-gray-500 mt-1">
              {combinedMOVCoverage} combined KPI coverage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>MOV Completeness</CardTitle>
            <CardDescription>KPIs with and without MOV</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={movData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {movData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validation Status</CardTitle>
            <CardDescription>MOV validation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={validationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {validationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Without MOV Alert */}
      {kpisWithoutMOV.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileX className="size-5 text-red-600" />
              <CardTitle className="text-red-900">KPIs Without MOV</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              These KPIs have no means of verification uploaded
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[24rem] overflow-auto pb-2 [scrollbar-gutter:stable]">
            <Table className="table-fixed min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] sm:w-[160px] whitespace-nowrap">KPI Code</TableHead>
                  <TableHead className="w-[280px] sm:w-[520px] whitespace-nowrap">KPI Name</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Focal Person</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpisWithoutMOV.map(kpi => {
                  const office = offices.find(o => o.id === kpi.officeId);
                  return (
                    <TableRow key={kpi.id}>
                      <TableCell className="w-[120px] sm:w-[160px] text-[11px] sm:text-xs font-semibold text-gray-600 align-top">
                        <div className="w-[120px] sm:w-[160px] whitespace-normal break-all leading-tight" title={kpi.code}>{kpi.code}</div>
                      </TableCell>
                      <TableCell className="w-[280px] sm:w-[520px] text-base font-semibold leading-tight align-top">{kpi.name}</TableCell>
                      <TableCell>{office?.name}</TableCell>
                      <TableCell>{kpi.focalPerson}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pending Validation */}
      {pendingValidation.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-orange-600" />
              <CardTitle className="text-orange-900">Pending Validation</CardTitle>
            </div>
            <CardDescription className="text-orange-700">
              These MOVs are awaiting validator review
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[26rem] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingValidation.map(mov => {
                  const kpi = kpis.find(k => k.id === mov.kpiId);
                  return (
                    <TableRow key={mov.id}>
                      <TableCell className="font-medium">{kpi?.code}</TableCell>
                      <TableCell>{mov.month}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-start gap-2">
                        <FileCheck className="size-4 text-gray-400" />
                          <span className="break-words">{mov.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{mov.uploadedBy}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(mov.uploadedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {mov.validatorNotes ? (
                          <span className="text-xs text-gray-600">{mov.validatorNotes}</span>
                        ) : (
                          <span className="text-xs text-gray-400">No notes</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All MOVs */}
      <Card>
        <CardHeader>
          <CardTitle>All MOV Records</CardTitle>
          <CardDescription>Complete list of means of verification</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Validated</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movs.map(mov => {
                const kpi = kpis.find(k => k.id === mov.kpiId);
                const office = offices.find(o => o.id === kpi?.officeId);
                return (
                  <TableRow key={mov.id}>
                    <TableCell className="font-medium">{kpi?.code}</TableCell>
                    <TableCell>{mov.month}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <FileCheck className="size-4 text-gray-400" />
                        <span className="text-sm break-words">{mov.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{office?.name}</TableCell>
                    <TableCell>{mov.uploadedBy}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(mov.uploadedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {mov.validated ? (
                        <Badge variant="default">
                          <CheckCircle className="size-3 mr-1" />
                          Validated
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="size-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {mov.validatorNotes ? (
                        <span className="text-xs text-gray-600 break-words">{mov.validatorNotes}</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sheet MOV Entries</CardTitle>
          <CardDescription>MOV text from Google Sheet (Means of Verification column)</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[24rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>MOV Text</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.filter((kpi) => !!kpi.movText?.trim()).map((kpi) => {
                const office = offices.find((o) => o.id === kpi.officeId);
                return (
                  <TableRow key={kpi.id}>
                    <TableCell className="font-medium">{kpi.code}</TableCell>
                    <TableCell>{office?.name}</TableCell>
                    <TableCell className="max-w-xl">
                      <span className="text-sm break-words">{kpi.movText}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
