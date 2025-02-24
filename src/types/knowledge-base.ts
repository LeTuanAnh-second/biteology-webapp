
export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Food {
  id: number;
  name: string;
  image_url: string;
  description: string;
  recipe: string;
  categories: string[];
}
