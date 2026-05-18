import { create } from 'zustand';

// --- Types ---

export interface CurrentUser {
  id: string;
  nickname: string;
  gender: string;
  age: number | null;
  profession: string | null;
  permanentCity: string | null;
  onboardingDone: boolean;
}

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  category: string;
  color: string;
  material: string | null;
  brand: string | null;
  price: number | null;
  imageUrl: string | null;
  fitType: string | null;
  season: string | null;
  sourceType: string;
  status: string;
  wearCount: number;
  isFavorite: boolean;
  tags?: { id: string; name: string; type: string }[];
}

export interface OutfitItemEntry {
  id: string;
  itemId: string;
  role: string | null;
  displayOrder: number;
  item?: WardrobeItem;
}

export interface Outfit {
  id: string;
  userId: string;
  sessionId: string | null;
  name: string | null;
  aiComment: string | null;
  source: string;
  isFavorite: boolean;
  scene: string | null;
  items?: OutfitItemEntry[];
}

export interface WeatherData {
  city: string;
  temp: number;
  icon: string;
  desc: string;
}

export type ActiveTab = 'outfit' | 'wardrobe' | 'profile';

// --- Store State ---

interface AppState {
  currentUser: CurrentUser | null;
  wardrobeItems: WardrobeItem[];
  outfits: Outfit[];
  currentWeather: WeatherData | null;
  activeTab: ActiveTab;
  showOnboarding: boolean;

  // Actions
  setUser: (user: CurrentUser | null) => void;
  setWardrobeItems: (items: WardrobeItem[]) => void;
  setOutfits: (outfits: Outfit[]) => void;
  setWeather: (weather: WeatherData | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setShowOnboarding: (show: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  wardrobeItems: [],
  outfits: [],
  currentWeather: null,
  activeTab: 'outfit',
  showOnboarding: false,

  setUser: (user) => set({ currentUser: user }),

  setWardrobeItems: (items) => set({ wardrobeItems: items }),

  setOutfits: (outfits) => set({ outfits }),

  setWeather: (weather) => set({ currentWeather: weather }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setShowOnboarding: (show) => set({ showOnboarding: show }),

  logout: () =>
    set({
      currentUser: null,
      wardrobeItems: [],
      outfits: [],
      currentWeather: null,
      activeTab: 'outfit',
      showOnboarding: false,
    }),
}));
