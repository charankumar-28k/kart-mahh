import { CATEGORIES } from "@/lib/categories";
import { FormSelect } from "./FormSelect";

type CategoryPickerProps = {
  category: string;
  subcategory: string;
  onCategoryChange: (category: string, subcategory: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
};

export function CategoryPicker({
  category,
  subcategory,
  onCategoryChange,
  onSubcategoryChange,
}: CategoryPickerProps) {
  const cat = CATEGORIES.find((c) => c.slug === category) ?? CATEGORIES[0];

  return (
    <>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Category</label>
        <FormSelect
          value={category}
          onValueChange={(slug) => {
            const next = CATEGORIES.find((c) => c.slug === slug)!;
            onCategoryChange(slug, next.subs[0].slug);
          }}
          options={CATEGORIES.map((c) => ({
            value: c.slug,
            label: (
              <>
                {c.emoji} {c.label}
              </>
            ),
          }))}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Subcategory</label>
        <FormSelect
          value={subcategory}
          onValueChange={onSubcategoryChange}
          options={cat.subs.map((s) => ({ value: s.slug, label: s.label }))}
        />
      </div>
    </>
  );
}
