
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommandFilterProps {
  categories: string[];
  onFilterChange: (search: string, category: string) => void;
}

const CommandFilter: React.FC<CommandFilterProps> = ({ categories, onFilterChange }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onFilterChange(e.target.value, category);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFilterChange(search, value);
  };

  return (
    <div className="flex flex-col gap-4 mb-6 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search commands..."
          value={search}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>
      <Select value={category} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CommandFilter;
