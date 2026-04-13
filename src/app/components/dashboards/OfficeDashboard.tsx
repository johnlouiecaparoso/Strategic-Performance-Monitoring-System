import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getKPIQ1Progress } from '../../utils/analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Building2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAppData } from '../../data/store';
import { LinkifiedText } from '../ui/linkified-text';

export function OfficeDashboard() {
  const { offices, kpis, monthlyAccomplishments } = useAppData();
  const officeGroups = useMemo(() => {
    const grouped = new Map<string, { id: string; name: string; focalPersons: Set<string>; officeIds: Set<string> }>();
    const officeIdToGroupId = new Map<string, string>();

    offices.forEach((office) => {
      const key = office.name.trim().toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          name: office.name.trim(),
          focalPersons: new Set(office.focalPerson ? [office.focalPerson] : []),
          officeIds: new Set([office.id]),
        });
        officeIdToGroupId.set(office.id, key);
      } else {
        const existing = grouped.get(key)!;
        existing.officeIds.add(office.id);
        if (office.focalPerson) existing.focalPersons.add(office.focalPerson);
        officeIdToGroupId.set(office.id, key);
      }
    });

    // Fallback: ensure office options still exist even if the Offices sheet is empty/incomplete.
    kpis.forEach((kpi) => {
      if (officeIdToGroupId.has(kpi.officeId)) return;

      const derivedName = kpi.officeId
        .replace(/^office-/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()) || kpi.officeId;
      const key = `derived-${kpi.officeId}`;

      grouped.set(key, {
        id: key,
        name: derivedName,
        focalPersons: new Set(kpi.focalPerson ? [kpi.focalPerson] : []),
        officeIds: new Set([kpi.officeId]),
      });
      officeIdToGroupId.set(kpi.officeId, key);
    });

    return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [offices, kpis]);

  const [selectedOffice, setSelectedOffice] = useState(officeGroups[0]?.id || '');

  useEffect(() => {
    const selectedStillExists = officeGroups.some((group) => group.id === selectedOffice);
    if ((!selectedOffice || !selectedStillExists) && officeGroups.length > 0) {
      setSelectedOffice(officeGroups[0].id);
    }
  }, [selectedOffice, officeGroups]);
  
  const selectedOfficeGroup = officeGroups.find((group) => group.id === selectedOffice);
  const selectedOfficeIds = selectedOfficeGroup ? [...selectedOfficeGroup.officeIds] : [];

  const office = selectedOfficeGroup
    ? {
        id: selectedOfficeGroup.id,
        name: selectedOfficeGroup.name,
        focalPerson: [...selectedOfficeGroup.focalPersons].join(', ') || 'N/A',
      }
    : undefined;

  const officeKPIs = kpis.filter((k) => selectedOfficeIds.includes(k.officeId));

  const compliance = {
    total: officeKPIs.length,
    submitted: officeKPIs.filter((k) => k.submissionStatus === 'submitted').length,
    compliance:
      officeKPIs.length > 0
        ? (officeKPIs.filter((k) => k.submissionStatus === 'submitted').length / officeKPIs.length) * 100
        : 0,
  };
  
  const completed = officeKPIs.filter(k => k.status === 'completed').length;
  const ongoing = officeKPIs.filter(k => k.status === 'ongoing').length;
  const delayed = officeKPIs.filter(k => k.status === 'delayed').length;
  const forValidation = officeKPIs.filter(k => k.status === 'for_validation').length;
  
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
              {officeGroups.map((officeGroup) => (
                <SelectItem key={officeGroup.id} value={officeGroup.id}>
                  {officeGroup.name}
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
      <div className="grid gap-4 md:grid-cols-5">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">For Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-indigo-600">{forValidation}</div>
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
                <TableHead className="w-[100px] min-w-[100px]">Code</TableHead>
                <TableHead className="min-w-[320px]">KPI Name</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Accomplishment</TableHead>
                <TableHead className="min-w-[240px]">Key Activities / Outputs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officeKPIs.map(kpi => {
                const progress = getKPIQ1Progress(kpi);
                const totalAcc = progress.accomplishment;
                const percentage = progress.percentage;
                
                return (
                  <TableRow key={kpi.id}>
                    <TableCell className="w-[100px] min-w-[100px] text-xs font-semibold text-gray-600 whitespace-nowrap">{kpi.code}</TableCell>
                    <TableCell>
                      <div className="max-w-[340px] min-w-[280px]">
                        <div className="font-semibold text-base leading-tight break-words">{kpi.name}</div>
                        <div className="text-xs text-gray-500 break-words">{kpi.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{progress.benchmarkTarget} {kpi.unit}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{totalAcc} {kpi.unit}</div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] break-words text-sm" title={kpi.keyActivitiesOutputs || 'N/A'}>
                        <LinkifiedText text={kpi.keyActivitiesOutputs} />
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
