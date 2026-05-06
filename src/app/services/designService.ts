import type { CustomDesign } from '../types';

type SaveDesignData = Omit<CustomDesign, 'id'>;
const DESIGN_STORAGE_KEY = 'solution_designs';

function readDesigns() {
  const storedDesigns = localStorage.getItem(DESIGN_STORAGE_KEY);
  if (!storedDesigns) return [];

  try {
    return JSON.parse(storedDesigns) as CustomDesign[];
  } catch {
    localStorage.removeItem(DESIGN_STORAGE_KEY);
    return [];
  }
}

function writeDesigns(designs: CustomDesign[]) {
  localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(designs));
}

export const designService = {
  async uploadDesignImage(file: File) {
    return {
      fileName: file.name,
      imageUrl: URL.createObjectURL(file),
    };
  },

  async saveDesign(data: SaveDesignData) {
    const design = { id: `DSN-${Date.now()}`, ...data };
    writeDesigns([...readDesigns(), design]);
    return { customDesignId: design.id, design };
  },

  async getDesignById(id: string): Promise<CustomDesign> {
    const design = readDesigns().find((item) => item.id === id);
    if (design) return design;

    return { id, imageUrl: '', position: { x: 50, y: 50 }, scale: 1, rotation: 0 };
  },
};

export { DESIGN_STORAGE_KEY };
