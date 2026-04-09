import { Mic, Search } from "lucide-react";
import { FormEvent } from "react";

interface SearchInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onMicClick?: () => void;
  isListening?: boolean;
}

const SearchInput = ({
  value,
  placeholder,
  onChange,
  onSubmit,
  onMicClick,
  isListening = false
}: SearchInputProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl rounded-2xl border border-apple-border bg-apple-card p-2">
      <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3">
        <Search size={20} className="text-apple-hint" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full border-none bg-transparent text-base text-apple-dark outline-none"
        />
        <button
          type="button"
          onClick={onMicClick}
          className={`rounded-full border p-2 ${
            isListening ? "border-[#C62828] bg-[#C62828] text-white" : "border-apple-border text-apple-hint"
          }`}
        >
          <Mic size={18} />
        </button>
      </div>
    </form>
  );
};

export default SearchInput;
