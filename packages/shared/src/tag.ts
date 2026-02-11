export type TagCategory = "character" | "series" | "keyword" | "other";

export interface Tag {
  id: string;
  name: string;
  category: string | null;
  createdAt: Date;
}

export interface CreateTagInput {
  name: string;
  category?: TagCategory;
}
