import type { Activity } from '../types/plan';

interface ScheduleProps {
  activities: Activity[];
  onPlaceClick?: (activityId: string) => void;
}

/**
 * Schedule - Timeline component displaying activities with times and durations
 * Based on IKYU Design Guideline
 */
export default function Schedule({ activities, onPlaceClick }: ScheduleProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}時間${mins}分`;
    }
    if (hours > 0) {
      return `${hours}時間`;
    }
    return `${mins}分`;
  };

  const getTravelModeIcon = (mode?: string): string => {
    switch (mode) {
      case 'driving':
        return '🚗';
      case 'walking':
        return '🚶';
      case 'transit':
        return '🚃';
      default:
        return '🚗';
    }
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'departure':
        return '🏠';
      case 'destination':
        return '📍';
      case 'meal':
        return '🍽️';
      case 'return':
        return '🏠';
      default:
        return '📍';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[--color-gray-200] p-6">
      <h2 className="text-xl font-bold text-[--color-primary-blue] mb-6 flex items-center gap-2">
        <span>📅</span>
        <span>スケジュール</span>
      </h2>

      <div className="relative">
        {/* Timeline */}
        {activities.map((activity, index) => {
          const isLast = index === activities.length - 1;
          const nextActivity = !isLast ? activities[index + 1] : null;

          return (
            <div key={activity.id} className="relative">
              {/* Activity */}
              <div className="flex items-start gap-4 mb-2">
                {/* Time */}
                <div className="w-16 flex-shrink-0 text-sm font-medium text-[--color-gray-800] pt-1">
                  {activity.time}
                </div>

                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  {/* Dot */}
                  <div className="w-4 h-4 rounded-full bg-[--color-primary-blue] border-4 border-white shadow-sm z-10"></div>

                  {/* Vertical Line */}
                  {!isLast && (
                    <div className="w-0.5 h-full min-h-[60px] bg-[--color-gray-300] -mt-1"></div>
                  )}
                </div>

                {/* Activity Content */}
                <div className="flex-1 pb-6">
                  {activity.type === 'departure' && (
                    <div className="text-sm">
                      <span className="mr-2">{getActivityIcon(activity.type)}</span>
                      <span className="font-medium text-[--color-gray-800]">出発</span>
                    </div>
                  )}

                  {activity.type === 'return' && (
                    <div className="text-sm">
                      <span className="mr-2">{getActivityIcon(activity.type)}</span>
                      <span className="font-medium text-[--color-gray-800]">帰宅</span>
                    </div>
                  )}

                  {activity.type === 'destination' && activity.place && (
                    <div>
                      <div className="flex items-start gap-2 mb-1">
                        <span>{getActivityIcon(activity.type)}</span>
                        <div className="flex-1">
                          <button
                            onClick={() => onPlaceClick?.(activity.id)}
                            className="font-bold text-[--color-primary-blue] hover:underline text-left"
                          >
                            {activity.place.name}
                          </button>
                          {activity.place.category && (
                            <span className="ml-2 text-xs text-[--color-gray-500]">
                              ({activity.place.category})
                            </span>
                          )}
                        </div>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-[--color-gray-600] ml-6 mb-2">
                          {activity.description}
                        </p>
                      )}
                      {activity.duration && (
                        <div className="text-xs text-[--color-gray-500] ml-6 flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{formatDuration(activity.duration)}滞在</span>
                        </div>
                      )}
                    </div>
                  )}

                  {activity.type === 'meal' && activity.restaurant && (
                    <div>
                      <div className="flex items-start gap-2 mb-1">
                        <span>{getActivityIcon(activity.type)}</span>
                        <div className="flex-1">
                          <button
                            onClick={() => onPlaceClick?.(activity.id)}
                            className="font-bold text-[--color-primary-blue] hover:underline text-left"
                          >
                            {activity.restaurant.name}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-[--color-gray-600] ml-6 mb-1">
                        {activity.restaurant.cuisine && (
                          <span>{activity.restaurant.cuisine}</span>
                        )}
                        {activity.restaurant.priceRange && (
                          <span className="ml-2">{activity.restaurant.priceRange}</span>
                        )}
                        {activity.restaurant.kidsMenu && (
                          <span className="ml-2 text-xs text-green-600">子供メニューあり</span>
                        )}
                      </div>
                      {activity.duration && (
                        <div className="text-xs text-[--color-gray-500] ml-6 flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{formatDuration(activity.duration)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Travel Time to Next Activity */}
              {activity.travelTime && nextActivity && (
                <div className="flex items-start gap-4 mb-2 ml-16">
                  <div className="flex items-center gap-1 text-xs text-[--color-gray-500] bg-[--color-gray-100] px-3 py-1 rounded-full">
                    <span>{getTravelModeIcon(activity.travelMode)}</span>
                    <span>{formatDuration(activity.travelTime)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
