import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { GoalPerformanceChart } from '../charts/GoalPerformanceChart';
import { getKPIsByGoal, getAccomplishmentsByKPI } from '../../utils/analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { AlertCircle } from 'lucide-react';
import { Progress } from '../ui/progress';
import { useAppData } from '../../data/store';

export function GoalPerformanceDashboard() {
  const { goals, offices } = useAppData();
  const goalData = goals.map(goal => {
    const goalKPIs = getKPIsByGoal(goal.id);
    const totalTarget = goalKPIs.reduce((sum, kpi) => sum + kpi.target, 0);
    const totalAccomplished = goalKPIs.reduce((sum, kpi) => {
      const accs = getAccomplishmentsByKPI(kpi.id);
      return sum + accs.reduce((s, a) => s + a.accomplishment, 0);
    }, 0);
    const percentage = totalTarget > 0 ? (totalAccomplished / totalTarget) * 100 : 0;
    
    return {
      goal: `Goal ${goal.number}`,
      name: goal.name,
      target: totalTarget,
      accomplished: totalAccomplished,
      percentage: Math.round(percentage * 10) / 10,
      kpiCount: goalKPIs.length,
      delayed: goalKPIs.filter(k => k.status === 'delayed').length
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">Goal Performance Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Progress analysis by strategic goals</p>
      </div>

      {/* Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Performance Overview</CardTitle>
          <CardDescription>Target vs Accomplishment by Goal</CardDescription>
        </CardHeader>
        <CardContent>
          <GoalPerformanceChart data={goalData} />
        </CardContent>
      </Card>

      {/* Goal Statistics */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {goalData.map((data, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Goal {idx + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-blue-600">{data.percentage}%</div>
              <p className="text-xs text-gray-500 mt-1">{data.kpiCount} KPIs</p>
              {data.delayed > 0 && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  {data.delayed} delayed
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Breakdown by Goal */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Goal Analysis</CardTitle>
          <CardDescription>Office contributions and KPI status per goal</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="goal-1">
            <div className="overflow-x-auto pb-1">
              <TabsList className="flex min-w-max">
              {goals.map(goal => (
                <TabsTrigger key={goal.id} value={goal.id}>
                  Goal {goal.number}
                </TabsTrigger>
              ))}
            </TabsList>            </div>            
            {goals.map(goal => {
              const goalKPIs = getKPIsByGoal(goal.id);
              
              return (
                <TabsContent key={goal.id} value={goal.id} className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-semibold">{goal.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                  </div>

                  <div className="space-y-3 max-h-[28rem] overflow-auto pr-1">
                    {goalKPIs.map(kpi => {
                      const office = offices.find(o => o.id === kpi.officeId);
                      const accs = getAccomplishmentsByKPI(kpi.id);
                      const totalAcc = accs.reduce((s, a) => s + a.accomplishment, 0);
                      const percentage = kpi.target > 0 ? (totalAcc / kpi.target) * 100 : 0;
                      
                      return (
                        <div key={kpi.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{kpi.code}</span>
                                <Badge 
                                  variant={
                                    kpi.status === 'completed' ? 'default' :
                                    kpi.status === 'delayed' ? 'destructive' :
                                    'secondary'
                                  }
                                  className="capitalize"
                                >
                                  {kpi.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 break-words">{kpi.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {office?.name} • {kpi.focalPerson}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-semibold">{percentage.toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">
                                {totalAcc} / {kpi.target} {kpi.unit}
                              </div>
                            </div>
                          </div>
                          
                          <Progress
                            value={Math.min(percentage, 100)}
                            className="mt-3 h-2"
                          />

                          {kpi.status === 'delayed' && (
                            <div className="mt-2 flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                              <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
                              <span>This KPI is delayed and requires attention</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
