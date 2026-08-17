import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SearchInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search drivers...",
}: SearchInputProps) => {
  return (
    <div className="relative w-full md:max-w-md">
      <Search
        size={17}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />

      <Input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="h-10 pl-9 pr-3"
      />
    </div>
  );
};

export default SearchInput;
