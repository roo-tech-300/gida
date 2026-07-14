import { createContext, useContext, useState, type ReactNode } from 'react';

type CreateListingData = {
  step1: {
    title: string;
    description: string;
    landlordId: string | null;
    layoutType: 'self_contain' | 'single_room' | 'flat' | null;
    price: string;
    term: 'per_semester' | 'per_annum';
    units: number;
  };
  step2: {
    selectedSchool: string | null;
    selectedCampus: string | null;
    landmark: string;
    coords: { latitude: number; longitude: number } | null;
  };
  step3: {
    selectedAmenities: string[];
    featuresList: string[];
  };
  step4: {
    rulesList: string[];
    maxRoommates: number;
    noLimit: boolean;
  };
  step5: {
    heroImage: string | null;
    galleryImages: string[];
  };
};

type CreateListingContextType = {
  data: CreateListingData;
  setStep1: (partial: Partial<CreateListingData['step1']>) => void;
  setStep2: (partial: Partial<CreateListingData['step2']>) => void;
  setStep3: (partial: Partial<CreateListingData['step3']>) => void;
  setStep4: (partial: Partial<CreateListingData['step4']>) => void;
  setStep5: (partial: Partial<CreateListingData['step5']>) => void;
  reset: () => void;
};

const defaultValue: CreateListingData = {
  step1: { title: '', description: '', landlordId: null, layoutType: null, price: '', term: 'per_annum', units: 1 },
  step2: { selectedSchool: null, selectedCampus: null, landmark: '', coords: null },
  step3: { selectedAmenities: [], featuresList: [] },
  step4: { rulesList: [], maxRoommates: 1, noLimit: false },
  step5: { heroImage: null, galleryImages: [] },
};

const CreateListingContext = createContext<CreateListingContextType>({
  data: defaultValue,
  setStep1: () => {},
  setStep2: () => {},
  setStep3: () => {},
  setStep4: () => {},
  setStep5: () => {},
  reset: () => {},
});

export function CreateListingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CreateListingData>(defaultValue);

  const setStep1 = (partial: Partial<CreateListingData['step1']>) =>
    setData((prev) => ({ ...prev, step1: { ...prev.step1, ...partial } }));
  const setStep2 = (partial: Partial<CreateListingData['step2']>) =>
    setData((prev) => ({ ...prev, step2: { ...prev.step2, ...partial } }));
  const setStep3 = (partial: Partial<CreateListingData['step3']>) =>
    setData((prev) => ({ ...prev, step3: { ...prev.step3, ...partial } }));
  const setStep4 = (partial: Partial<CreateListingData['step4']>) =>
    setData((prev) => ({ ...prev, step4: { ...prev.step4, ...partial } }));
  const setStep5 = (partial: Partial<CreateListingData['step5']>) =>
    setData((prev) => ({ ...prev, step5: { ...prev.step5, ...partial } }));

  const reset = () => setData(defaultValue);

  return (
    <CreateListingContext.Provider value={{ data, setStep1, setStep2, setStep3, setStep4, setStep5, reset }}>
      {children}
    </CreateListingContext.Provider>
  );
}

export function useCreateListingForm() {
  return useContext(CreateListingContext);
}
