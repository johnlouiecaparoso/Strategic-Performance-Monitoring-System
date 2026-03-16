import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getOfficeCompliance } from '../../utils/analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Building2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAppData } from '../../data/store';

export function OfficeDashboard() {
  const { offices, kpis, monthlyAccomplishments } = useAppData();
  const [selectedOffice, setSelectedOffice] = useState(offices[0]?.id || '');

  useEffect(() => {
    if (!selectedOffice && offices.length > 0) {
      setSelectedOffice(offices[0].id);
    }
  }, [selectedOffice, offices]);
  
  const office = offices.find(o => o.id === selectedOffice);
  const officeKPIs = kpis.filter(k => k.officeId === selectedOffice);
  const compliance = getOfficeCompliance(selectedOffice);
  
  const completed = officeKPIs.filter(k => k.status === 'completed').length;
  const ongoing = officeKPIs.filter(k => k.status === 'ongoing').length;
  const delayed = officeKPIs.filter(k => k.status === 'delayed').length;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-white">Office Dashboard</h1>
          <p className="text-white/80 mt-1 text-sm sm:text-base">Office-specific KPI monitoring and tracking</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedOffice} onValueChange={setSelectedOffice}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {offices.map(office => (
                <SelectItem key={office.id} value={office.id}>
                  {office.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Office Info */}
      {office && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="size-8 text-blue-600" />
              <div>
                <CardTitle>{office.name}</CardTitle>
                <CardDescription>Focal Person: {office.focalPerson}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{officeKPIs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ongoing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{ongoing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Delayed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{delayed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Compliance</CardTitle>
          <CardDescription>Percentage of KPIs with submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {compliance.submitted} of {compliance.total} submitted
              </span>
              <span className="font-semibold">{compliance.compliance.toFixed(1)}%</span>
            </div>
            <Progress value={compliance.compliance} />
          </div>
        </CardContent>
      </Card>

      {/* KPI List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned KPIs</CardTitle>
          <CardDescription>All KPIs assigned to this office</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>KPI Name</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Accomplishment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officeKPIs.map(kpi => {
                const accs = monthlyAccomplishments.filter(a => a.kpiId === kpi.id);
                const totalAcc = accs.reduce((s, a) => s + a.accomplishment, 0);
                const percentage = kpi.target > 0 ? (totalAcc / kpi.target) * 100 : 0;
                
                return (
                  <TableRow key={kpi.id}>
                    <TableCell className="font-medium">{kpi.code}</TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <div className="font-medium break-words">{kpi.name}</div>
                        <div className="text-xs text-gray-500 break-words">{kpi.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{kpi.target} {kpi.unit}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{totalAcc} {kpi.unit}</div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          kpi.status === 'completed' ? 'default' :
                          kpi.status === 'delayed' ? 'destructive' :
                          'secondary'
                        }
                        className="capitalize"
                      >
                        {kpi.status === 'completed' && <CheckCircle className="size-3 mr-1" />}
                        {kpi.status === 'ongoing' && <Clock className="size-3 mr-1" />}
                        {kpi.status === 'delayed' && <AlertTriangle className="size-3 mr-1" />}
                        {kpi.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          kpi.submissionStatus === 'submitted' ? 'default' :
                          kpi.submissionStatus === 'late' ? 'destructive' :
                          'outline'
                        }
                        className="capitalize"
                      >
                        {kpi.submissionStatus.replace('_', ' ')}
                      </Badge>
                      {kpi.submissionDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(kpi.submissionDate).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Accomplishments</CardTitle>
          <CardDescription>Monthly breakdown of accomplishments</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[26rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead>January</TableHead>
                <TableHead>February</TableHead>
                <TableHead>March</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officeKPIs.map(kpi => {
                const janAcc = monthlyAccomplishments.find(a => a.kpiId === kpi.id && a.month === 'January');
                const febAcc = monthlyAccomplishments.find(a => a.kpiId === kpi.id && a.month === 'February');
                const marAcc = monthlyAccomplishments.find(a => a.kpiId === kpi.id && a.month === 'March');
                
                return (
                  <TableRow key={kpi.id}>
                    <TableCell className="font-medium">{kpi.code}</TableCell>
                    <TableCell>
                      {janAcc ? (
                        <div>
                          <div>{janAcc.accomplishment} {kpi.unit}</div>
                          <div className="text-xs text-gray-500">{janAcc.percentage}%</div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {febAcc ? (
                        <div>
                          <div>{febAcc.accomplishment} {kpi.unit}</div>
                          <div className="text-xs text-gray-500">{febAcc.percentage}%</div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {marAcc ? (
                        <div>
                          <div>{marAcc.accomplishment} {kpi.unit}</div>
                          <div className="text-xs text-gray-500">{marAcc.percentage}%</div>
                        </div>
                      ) : '-'}
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
