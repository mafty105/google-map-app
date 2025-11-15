import { useState, useEffect } from 'react';

interface AgeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (age: string) => void;
}

/**
 * AgeSelector - Modal for selecting specific child age
 * Opens when user clicks "その他" button
 */
export default function AgeSelector({ isOpen, onClose, onConfirm }: AgeSelectorProps) {
  const [selectedAge, setSelectedAge] = useState<string>('0');

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirm = () => {
    // Send age in format "X歳"
    onConfirm(`${selectedAge}歳`);
    onClose();
  };

  if (!isOpen) return null;

  // Generate age options (0-12)
  const ageOptions = Array.from({ length: 13 }, (_, i) => i);

  return (
    <>
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-6 w-80">
        <h3 className="text-lg font-bold text-gray-900 mb-4">お子様の年齢を選択</h3>

        {/* Dropdown */}
        <div className="mb-6">
          <label htmlFor="age-select" className="block text-sm font-medium text-gray-700 mb-2">
            年齢
          </label>
          <select
            id="age-select"
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          >
            {ageOptions.map((age) => (
              <option key={age} value={age}>
                {age}歳
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            決定
          </button>
        </div>
      </div>
    </>
  );
}
