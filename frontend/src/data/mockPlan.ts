import type { TravelPlan } from '../types/plan';

/**
 * Mock travel plan data for testing and demonstration
 * This simulates data that would come from the backend API
 */
export const mockPlan: TravelPlan = {
  id: 'plan-001',
  title: '所沢周辺 家族お出かけプラン',
  date: '2025年11月16日（土）',
  summary: '子供と楽しめる航空公園とトトロの森を巡る1日プラン。自然とアクティビティを満喫！',
  totalDuration: 420, // 7 hours
  totalTravelTime: 60, // 1 hour total travel
  estimatedCost: {
    total: 8500,
    transportation: 3000,
    meals: 4000,
    activities: 1500,
  },
  activities: [
    {
      id: 'act-001',
      type: 'departure',
      time: '09:00',
      description: '自宅から出発',
    },
    {
      id: 'act-002',
      type: 'travel',
      time: '09:00',
      travelMode: 'driving',
      travelTime: 60,
    },
    {
      id: 'act-003',
      type: 'destination',
      time: '10:00',
      duration: 120,
      place: {
        id: 'place-001',
        name: '所沢航空記念公園',
        location: {
          lat: 35.7987,
          lng: 139.4623,
          address: '埼玉県所沢市並木1-13',
        },
        category: '公園・自然',
        photoUrl: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800',
        rating: 4.3,
        description: '日本初の飛行場跡地に作られた広大な公園。所沢航空発祥記念館があり、子供向けの航空展示が充実。',
        kidFriendly: true,
        openingHours: '9:00 - 17:00',
      },
      description: '子供向けアクティビティ、航空博物館を見学',
    },
    {
      id: 'act-004',
      type: 'travel',
      time: '12:00',
      travelMode: 'driving',
      travelTime: 10,
    },
    {
      id: 'act-005',
      type: 'meal',
      time: '12:10',
      duration: 80,
      restaurant: {
        id: 'rest-001',
        name: 'ファミリーレストラン サイゼリヤ 所沢店',
        location: {
          lat: 35.7995,
          lng: 139.4685,
          address: '埼玉県所沢市並木2-1-5',
        },
        cuisine: 'イタリアン',
        priceRange: '¥¥',
        rating: 3.8,
        kidFriendly: true,
        kidsMenu: true,
        openingHours: '11:00 - 23:00',
      },
      description: 'ランチタイム',
    },
    {
      id: 'act-006',
      type: 'travel',
      time: '13:30',
      travelMode: 'driving',
      travelTime: 25,
    },
    {
      id: 'act-007',
      type: 'destination',
      time: '13:55',
      duration: 150,
      place: {
        id: 'place-002',
        name: 'トトロの森1号地',
        location: {
          lat: 35.8122,
          lng: 139.4401,
          address: '埼玉県所沢市上山口雑魚入351',
        },
        category: '自然・ハイキング',
        photoUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        rating: 4.5,
        description: 'となりのトトロの舞台となった狭山丘陵の雑木林。自然散策やピクニックに最適。',
        kidFriendly: true,
        openingHours: '終日開放',
      },
      description: '自然散策、ピクニック可能',
    },
    {
      id: 'act-008',
      type: 'travel',
      time: '16:25',
      travelMode: 'driving',
      travelTime: 55,
    },
    {
      id: 'act-009',
      type: 'return',
      time: '17:20',
      description: '自宅到着',
    },
  ],
  route: [
    { lat: 35.6812, lng: 139.7671 }, // Tokyo Station (departure)
    { lat: 35.7987, lng: 139.4623 }, // Tokorozawa Aviation Park
    { lat: 35.7995, lng: 139.4685 }, // Restaurant
    { lat: 35.8122, lng: 139.4401 }, // Totoro Forest
    { lat: 35.6812, lng: 139.7671 }, // Return
  ],
};
