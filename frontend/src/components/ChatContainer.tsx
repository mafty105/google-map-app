import { useEffect, useRef, useState } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import QuickReplies from './QuickReplies';
import MapDisplay from './MapDisplay';
import PlanSummary from './PlanSummary';
import EnrichedPlaceCard from './EnrichedPlaceCard';
import PlaceDrawer from './PlaceDrawer';
import AgeSelector from './AgeSelector';
import type { TravelPlan } from '../types/plan';
import { mockPlan } from '../data/mockPlan';
import { useSession } from '../hooks/useSession';
import { useChat } from '../hooks/useChat';
import { useGeolocation } from '../hooks/useGeolocation';
import { useMobileDetection } from '../hooks/useMobileDetection';

interface Location {
  lat: number;
  lng: number;
  name?: string;
  index?: number; // Marker number for display
}

/**
 * ChatContainer - Main chat interface component
 * Manages conversation state and API communication
 */
export default function ChatContainer() {
  const { sessionId, loading: sessionLoading, error: sessionError } = useSession();
  const {
    messages,
    quickReplies,
    isLoading,
    error: chatError,
    currentPlan,
    enrichedPlaces,
    routes,
    sendMessage,
    addGreeting,
  } = useChat(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<Location>({
    lat: 35.6812,
    lng: 139.7671,
    name: 'Tokyo Station',
  });
  const [mapMarkers, setMapMarkers] = useState<Location[]>([]);
  const [mapRoutes, setMapRoutes] = useState<Location[][]>([]);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);

  // Drawer state
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);

  // Age selector state
  const [showAgeSelector, setShowAgeSelector] = useState(false);

  // Navigation state
  const { location: userLocation, loading: geoLoading, error: geoError, requestLocation, clearError: clearGeoError } = useGeolocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const isMobile = useMobileDetection();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add initial greeting when session is ready
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      addGreeting(
        'こんにちは！週末のお出かけプランをお手伝いします。\n\n' +
          'どこへ行きたいか、何をしたいか、お気軽にお話しください。\n' +
          '例：「子供と一緒に動物園に行きたい」「新宿から1時間以内で遊べる場所」',
      );
    }
  }, [sessionId, messages.length, addGreeting]);

  // Update map markers when enriched places change
  useEffect(() => {
    if (enrichedPlaces && enrichedPlaces.length > 0) {
      const markers = enrichedPlaces
        .filter((place) => place.location) // Only places with valid location
        .map((place, index) => ({
          lat: place.location!.lat,
          lng: place.location!.lng,
          name: place.name,
          index: index + 1, // Marker number (1, 2, 3...)
        }));

      setMapMarkers(markers);

      // Create routes from markers for map display
      // This creates a single route through all places
      if (markers.length > 1) {
        setMapRoutes([markers]);
      }
    } else {
      setMapMarkers([]); // Clear markers when list is cleared
      setMapRoutes([]); // Clear routes as well
    }
  }, [enrichedPlaces]);

  // Combine errors from session and chat
  const error = sessionError || chatError;

  // Handle quick reply click
  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  // Handle special reply (opens age selector)
  const handleSpecialReply = (reply: string) => {
    if (reply === 'その他') {
      setShowAgeSelector(true);
    }
  };

  // Handle age confirmation from selector
  const handleAgeConfirm = (age: string) => {
    sendMessage(age);
  };

  // Handle use current location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          sendMessage(`現在地（緯度: ${lat.toFixed(6)}, 経度: ${lng.toFixed(6)}）`);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('現在地の取得に失敗しました。位置情報の許可を確認してください。');
        }
      );
    } else {
      alert('このブラウザは位置情報に対応していません。');
    }
  };

  // Handle plan actions
  const handleConfirmPlan = () => {
    alert('プランが確定されました！');
    // TODO: Send confirmation to backend
  };

  const handleModifyPlan = () => {
    setCurrentPlan(null);
    setMessages((prev) => [
      ...prev,
      {
        text: 'プランを修正します。どの部分を変更したいですか？',
        isUser: false,
      },
    ]);
  };

  const handleStartOver = () => {
    setCurrentPlan(null);
    setMessages([
      {
        text: 'こんにちは！週末のお出かけプランをお手伝いします。\nどこからお出かけされますか？',
        isUser: false,
      },
    ]);
    setQuickReplies([]);
  };

  const handlePlaceClick = (placeId: string) => {
    // Find the index of the place in enrichedPlaces
    const index = enrichedPlaces.findIndex((p) => p.place_id === placeId);
    if (index !== -1) {
      setSelectedPlaceIndex(index);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedPlaceIndex(null);
    setDirectionsResult(null); // Clear route when drawer closes
    setNavigationError(null);
  };

  const handleNavigate = async (placeId: string, placeName: string, lat: number, lng: number) => {
    setNavigationError(null);

    // Mobile: Open Google Maps app with deep link
    if (isMobile) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${placeId}`;
      window.open(mapsUrl, '_blank');
      return;
    }

    // Desktop: Show route on current map
    setIsNavigating(true);

    // Request user location if not already available
    if (!userLocation) {
      requestLocation();
    }

    // Wait for geolocation to complete
    if (geoLoading) {
      return; // Geolocation is already in progress
    }

    if (geoError) {
      setNavigationError(geoError);
      setIsNavigating(false);
      return;
    }

    // Use geolocation result or wait for it
    if (!userLocation) {
      // Location request is pending, the effect below will handle it
      return;
    }

    // Calculate directions using Google Maps DirectionsService
    try {
      const directionsService = new google.maps.DirectionsService();

      const result = await directionsService.route({
        origin: { lat: userLocation.lat, lng: userLocation.lng },
        destination: { lat, lng },
        travelMode: google.maps.TravelMode.TRANSIT,
        provideRouteAlternatives: false,
      });

      setDirectionsResult(result);
      setIsNavigating(false);
    } catch (error) {
      console.error('Directions error:', error);
      setNavigationError('ルートの検索に失敗しました。もう一度お試しください。');
      setIsNavigating(false);
    }
  };

  // Effect to handle geolocation completion for desktop navigation
  useEffect(() => {
    if (!isMobile && isNavigating && userLocation && !directionsResult && !navigationError) {
      // Retry navigation now that we have user location
      // This will happen automatically when userLocation updates
    }
  }, [userLocation, isMobile, isNavigating, directionsResult, navigationError]);

  const handlePreviousPlace = () => {
    if (selectedPlaceIndex !== null && selectedPlaceIndex > 0) {
      setSelectedPlaceIndex(selectedPlaceIndex - 1);
    }
  };

  const handleNextPlace = () => {
    if (selectedPlaceIndex !== null && selectedPlaceIndex < enrichedPlaces.length - 1) {
      setSelectedPlaceIndex(selectedPlaceIndex + 1);
    }
  };

  const handleSeeMoreOptions = () => {
    sendMessage('別のプランを見せてください');
  };

  // Demo: Load mock plan (for testing)
  const loadMockPlan = () => {
    setCurrentPlan(mockPlan);
    setMessages((prev) => [
      ...prev,
      {
        text: 'デモプランを生成しました！以下の内容をご確認ください。',
        isUser: false,
      },
    ]);

    // Update map with plan data
    if (mockPlan.route) {
      setMapRoutes([mockPlan.route]);
    }
    // Extract place markers from activities
    const markers = mockPlan.activities
      .filter((a) => a.place)
      .map((a) => ({
        lat: a.place!.location.lat,
        lng: a.place!.location.lng,
        name: a.place!.name,
      }));
    setMapMarkers(markers);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              週末お出かけプランナー
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              家族で楽しめる週末のお出かけプランを提案します
            </p>
          </div>
          {/* Demo Button */}
          <button
            onClick={loadMockPlan}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            デモプラン表示
          </button>
        </div>
      </header>

      {/* Main Content: Chat + Map */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-6">
              {/* Error Message */}
              {error && (
                <div className="mb-4 px-4 py-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-red-800 font-semibold mb-1">エラーが発生しました</h3>
                      <p className="text-red-700 text-sm mb-2">{error}</p>
                      {error.includes('バックエンドサーバー') && (
                        <div className="mt-3 p-3 bg-white rounded border border-red-200">
                          <p className="text-sm text-gray-700 font-medium mb-2">解決方法:</p>
                          <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                            <li>ターミナルでバックエンドディレクトリに移動</li>
                            <li><code className="bg-gray-100 px-2 py-1 rounded text-xs">cd backend && python run.py</code> を実行</li>
                            <li>サーバーが起動したらページを再読み込み</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  message={msg.text}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Display */}
              {currentPlan && (
                <div className="mb-6">
                  <PlanSummary
                    plan={currentPlan}
                    onConfirm={handleConfirmPlan}
                    onModify={handleModifyPlan}
                    onSeeMoreOptions={handleSeeMoreOptions}
                    onStartOver={handleStartOver}
                    onPlaceClick={handlePlaceClick}
                  />
                </div>
              )}

              {/* Enriched Places Display */}
              {enrichedPlaces && enrichedPlaces.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    おすすめスポット ({enrichedPlaces.length}件)
                  </h3>
                  <div className="space-y-3">
                    {enrichedPlaces.map((place) => (
                      <EnrichedPlaceCard
                        key={place.place_id}
                        place={place}
                        onClick={handlePlaceClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Replies */}
              {!isLoading && quickReplies.length > 0 && (
                <QuickReplies
                  replies={quickReplies}
                  onReplyClick={handleQuickReply}
                  onSpecialReply={handleSpecialReply}
                />
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isLoading || sessionLoading || !sessionId}
            onUseCurrentLocation={messages.length <= 1 ? handleUseCurrentLocation : undefined}
          />
        </div>

        {/* Map Panel */}
        <div className="w-1/2 bg-gray-50">
          <MapDisplay
            markers={mapMarkers}
            routes={mapRoutes}
            directionsResult={directionsResult}
            onMarkerClick={(index) => setSelectedPlaceIndex(index)}
          />
        </div>
      </div>

      {/* Place Drawer */}
      {selectedPlaceIndex !== null && enrichedPlaces[selectedPlaceIndex] && (
        <PlaceDrawer
          place={enrichedPlaces[selectedPlaceIndex]}
          isOpen={selectedPlaceIndex !== null}
          onClose={handleCloseDrawer}
          onNavigate={handleNavigate}
          navigating={isNavigating}
          navigationError={navigationError}
          onPrevious={handlePreviousPlace}
          onNext={handleNextPlace}
          hasPrevious={selectedPlaceIndex > 0}
          hasNext={selectedPlaceIndex < enrichedPlaces.length - 1}
        />
      )}

      {/* Age Selector Modal */}
      <AgeSelector
        isOpen={showAgeSelector}
        onClose={() => setShowAgeSelector(false)}
        onConfirm={handleAgeConfirm}
      />
    </div>
  );
}
