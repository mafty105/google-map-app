import { useState } from 'react';
import type { TravelPlan } from '../types/plan';
import Schedule from './Schedule';
import PlaceCard from './PlaceCard';
import RestaurantCard from './RestaurantCard';

interface PlanSummaryProps {
  plan: TravelPlan;
  onConfirm?: () => void;
  onModify?: () => void;
  onSeeMoreOptions?: () => void;
  onStartOver?: () => void;
  onPlaceClick?: (activityId: string) => void;
}

/**
 * PlanSummary - Complete travel plan overview with schedule, places, and actions
 * Based on IKYU Design Guideline
 */
export default function PlanSummary({
  plan,
  onConfirm,
  onModify,
  onSeeMoreOptions,
  onStartOver,
  onPlaceClick,
}: PlanSummaryProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'places'>('schedule');

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

  const formatCost = (yen: number): string => {
    return `¥${yen.toLocaleString()}`;
  };

  // Extract places and restaurants from activities
  const places = plan.activities
    .filter((a) => a.type === 'destination' && a.place)
    .map((a) => a.place!);

  const restaurants = plan.activities
    .filter((a) => a.type === 'meal' && a.restaurant)
    .map((a) => a.restaurant!);

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[--color-primary-blue] to-[--color-light-blue] text-white p-6 rounded-t-lg">
        <h1 className="text-2xl font-bold mb-2">{plan.title}</h1>
        {plan.date && <p className="text-sm opacity-90">📅 {plan.date}</p>}
        {plan.summary && <p className="text-sm mt-2 opacity-90">{plan.summary}</p>}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-[--color-gray-100]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[--color-primary-blue]">
            {plan.activities.length}
          </div>
          <div className="text-xs text-[--color-gray-600]">アクティビティ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[--color-primary-blue]">
            {formatDuration(plan.totalDuration)}
          </div>
          <div className="text-xs text-[--color-gray-600]">総所要時間</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[--color-primary-blue]">
            {formatDuration(plan.totalTravelTime)}
          </div>
          <div className="text-xs text-[--color-gray-600]">移動時間</div>
        </div>
        {plan.estimatedCost && (
          <div className="text-center">
            <div className="text-2xl font-bold text-[--color-primary-blue]">
              {formatCost(plan.estimatedCost.total)}
            </div>
            <div className="text-xs text-[--color-gray-600]">概算費用</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[--color-gray-200]">
        <div className="flex">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'text-[--color-primary-blue] border-b-2 border-[--color-primary-blue]'
                : 'text-[--color-gray-600] hover:text-[--color-gray-800]'
            }`}
          >
            📅 スケジュール
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'places'
                ? 'text-[--color-primary-blue] border-b-2 border-[--color-primary-blue]'
                : 'text-[--color-gray-600] hover:text-[--color-gray-800]'
            }`}
          >
            📍 訪問先一覧
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'schedule' && (
          <Schedule activities={plan.activities} onPlaceClick={onPlaceClick} />
        )}

        {activeTab === 'places' && (
          <div className="space-y-6">
            {/* Destinations */}
            {places.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[--color-gray-800] mb-4">
                  観光スポット ({places.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {places.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onViewOnMap={() => onPlaceClick?.(place.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {restaurants.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[--color-gray-800] mb-4">
                  レストラン ({restaurants.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onViewOnMap={() => onPlaceClick?.(restaurant.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      {plan.estimatedCost && (
        <div className="px-6 pb-6">
          <div className="bg-[--color-gray-100] rounded-lg p-4">
            <h3 className="text-sm font-bold text-[--color-gray-800] mb-3">概算費用の内訳</h3>
            <div className="space-y-2 text-sm">
              {plan.estimatedCost.transportation && (
                <div className="flex justify-between">
                  <span className="text-[--color-gray-600]">🚗 交通費</span>
                  <span className="font-medium">{formatCost(plan.estimatedCost.transportation)}</span>
                </div>
              )}
              {plan.estimatedCost.meals && (
                <div className="flex justify-between">
                  <span className="text-[--color-gray-600]">🍽️ 食事代</span>
                  <span className="font-medium">{formatCost(plan.estimatedCost.meals)}</span>
                </div>
              )}
              {plan.estimatedCost.activities && (
                <div className="flex justify-between">
                  <span className="text-[--color-gray-600]">🎫 アクティビティ</span>
                  <span className="font-medium">{formatCost(plan.estimatedCost.activities)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[--color-gray-300] pt-2 font-bold">
                <span className="text-[--color-gray-800]">合計</span>
                <span className="text-[--color-primary-blue]">
                  {formatCost(plan.estimatedCost.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 p-6 border-t border-[--color-gray-200] bg-[--color-gray-50]">
        {onConfirm && (
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-[--color-primary-blue] text-white font-medium rounded-lg hover:bg-[#0f2d4f] transition-colors"
          >
            ✓ このプランで確定
          </button>
        )}
        {onModify && (
          <button
            onClick={onModify}
            className="flex-1 px-6 py-3 bg-white border-2 border-[--color-primary-blue] text-[--color-primary-blue] font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            ✎ 修正する
          </button>
        )}
        {onSeeMoreOptions && (
          <button
            onClick={onSeeMoreOptions}
            className="flex-1 px-6 py-3 bg-white border-2 border-orange-500 text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors"
          >
            🔄 別のプランを見る
          </button>
        )}
        {onStartOver && (
          <button
            onClick={onStartOver}
            className="px-6 py-3 bg-white border border-[--color-gray-300] text-[--color-gray-700] font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            ↺ 最初から
          </button>
        )}
      </div>
    </div>
  );
}
