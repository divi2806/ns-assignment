"use client";

import { useEffect, useState } from "react";

interface Activity {
  date: string;
  count: number;
}

interface ActivityGraphProps {
  address: string;
}

export function ActivityGraph({ address }: ActivityGraphProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(0);
  const [cacheInfo, setCacheInfo] = useState<{ cached?: boolean; cacheAge?: number; demo?: boolean } | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`/api/activity?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities);
          setMaxCount(data.maxCount || 1);
          setCacheInfo({
            cached: data.cached,
            cacheAge: data.cacheAge,
            demo: data.demo,
          });
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      }
      setLoading(false);
    }

    if (address) {
      fetchActivity();
    }
  }, [address]);

  // Generate days for last 6 months
  const generateDays = () => {
    const days: { date: Date; count: number }[] = [];
    
    // Use the activities data directly from the API (already filtered for last 6 months)
    activities.forEach(activity => {
      const date = new Date(activity.date);
      days.push({
        date,
        count: activity.count || 0,
      });
    });
    
    return days;
  };

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-200";
    const intensity = Math.min(count / Math.max(maxCount, 1), 1);
    
    if (intensity <= 0.25) return "bg-green-300";
    if (intensity <= 0.5) return "bg-green-400";
    if (intensity <= 0.75) return "bg-green-600";
    return "bg-green-700";
  };

  const days = generateDays();
  
  // Group by weeks
  const weeks: { date: Date; count: number }[][] = [];
  let currentWeek: { date: Date; count: number }[] = [];
  
  days.forEach((day, index) => {
    currentWeek.push(day);
    if (day.date.getDay() === 6 || index === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Fill the first week with empty cells if it doesn't start on Sunday
  if (weeks.length > 0 && weeks[0][0].date.getDay() !== 0) {
    const firstWeek = weeks[0];
    const startDay = firstWeek[0].date.getDay();
    for (let i = 0; i < startDay; i++) {
      firstWeek.unshift({ date: new Date(), count: -1 }); // -1 means empty
    }
  }

  // Generate month labels for last 6 months
  const monthLabels = [];
  const currentMonth = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentMonth);
    month.setMonth(month.getMonth() - i);
    monthLabels.push({
      name: month.toLocaleDateString('en-US', { month: 'short' }),
      month: month.getMonth(),
    });
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Transaction Activity</h3>
        <div className="h-32 flex flex-col items-center justify-center text-gray-500 gap-3">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm">Loading activity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">On-Chain Activity (Last 6 Months)</h3>
          {cacheInfo?.cached && (
            <p className="text-xs text-gray-500 mt-1">
              Cached ({cacheInfo.cacheAge}m ago)
            </p>
          )}
          {cacheInfo?.demo && (
            <p className="text-xs text-orange-600 mt-1">
              Sample data
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-700 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 ml-6">
            {monthLabels.map((label, i) => (
              <div key={i} className="text-[10px] text-gray-600" style={{ width: '52px' }}>
                {label.name}
              </div>
            ))}
          </div>
          
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 text-[10px] text-gray-600 pr-1">
              <div style={{ height: '11px' }}></div>
              <div style={{ height: '11px' }}>Mon</div>
              <div style={{ height: '11px' }}></div>
              <div style={{ height: '11px' }}>Wed</div>
              <div style={{ height: '11px' }}></div>
              <div style={{ height: '11px' }}>Fri</div>
              <div style={{ height: '11px' }}></div>
            </div>
            
            {/* Activity grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    if (day.count === -1) {
                      return <div key={dayIndex} className="w-[11px] h-[11px]"></div>;
                    }
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`w-[11px] h-[11px] rounded-sm ${getColor(day.count)} transition-all hover:ring-1 hover:ring-gray-400 cursor-pointer`}
                        title={`${day.date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}: ${day.count} transaction${day.count !== 1 ? 's' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-600">
        {activities.reduce((sum, a) => sum + a.count, 0)} on-chain interactions in the last 6 months
      </div>
    </div>
  );
}

