
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Food } from "@/types/knowledge-base";

const DEFAULT_FOOD_IMAGE = '/lovable-uploads/6fe7589b-6114-4c7e-9ee1-e97994f6ff38.png';

export const useFoods = () => {
  return useQuery({
    queryKey: ['foods'],
    queryFn: async (): Promise<Food[]> => {
      const { data, error } = await supabase
        .from('foods')
        .select(`
          *,
          food_categories!inner (
            categories!inner(name)
          )
        `);

      if (error) throw error;

      return data?.map(food => ({
        id: food.id,
        name: food.name,
        image_url: food.image_url && food.image_url.startsWith('http') 
          ? food.image_url 
          : DEFAULT_FOOD_IMAGE,
        description: food.description,
        recipe: food.recipe,
        categories: food.food_categories.map((fc: any) => fc.categories.name)
      })) || [];
    }
  });
};
